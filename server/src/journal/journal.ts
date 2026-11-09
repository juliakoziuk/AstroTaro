import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { Op } from 'sequelize'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator'
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger'
import { ApiAuthed, ApiOwnedNotFound } from '../common/api-docs'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { listConditions, ListQueryDto } from '../common/list-query'
import { OwnedService } from '../common/owned.service'
import { JournalEntry } from './journal.model'

class LinkDto {
  @ApiProperty({ enum: ['dream', 'spread'] }) @IsIn(['dream', 'spread']) type: 'dream' | 'spread'
  @ApiProperty({ description: 'id сну або розкладу' }) @IsString() @MaxLength(64) id: string
}

export class CreateEntryDto {
  @ApiPropertyOptional({ format: 'date-time', description: 'За замовчуванням — зараз' }) @IsOptional() @IsDateString() date?: string
  @ApiProperty({ minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) mood: number
  @ApiProperty({ maxLength: 10000 }) @IsString() @MinLength(1) @MaxLength(10000) text: string
  @ApiPropertyOptional({ type: [String], maxItems: 10, description: 'Теги: до 10, кожен до 30 символів; зберігаються малими літерами' }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(30, { each: true }) tags?: string[]
  @ApiPropertyOptional({ type: [LinkDto], maxItems: 20 }) @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => LinkDto) links?: LinkDto[]
}

export class JournalQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ description: 'Лише записи з цим тегом', maxLength: 30 }) @IsOptional() @IsString() @MaxLength(30) tag?: string
  @ApiPropertyOptional({ description: 'Лише записи з цим настроєм (1–5)', minimum: 1, maximum: 5 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) mood?: number
}

/** Теги без пробілів по краях, малими літерами, без порожніх і повторів. */
export const normalizeTags = (tags?: string[]) => (tags ? [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))] : undefined)

export class UpdateEntryDto {
  @ApiPropertyOptional({ format: 'date-time', description: 'За замовчуванням — зараз' }) @IsOptional() @IsDateString() date?: string
  @ApiPropertyOptional({ minimum: 1, maximum: 5 }) @IsOptional() @IsInt() @Min(1) @Max(5) mood?: number
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(10000) text?: string
  @ApiPropertyOptional({ type: [String], maxItems: 10, description: 'Теги: до 10, кожен до 30 символів; зберігаються малими літерами' }) @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(30, { each: true }) tags?: string[]
  @ApiPropertyOptional({ type: [LinkDto], maxItems: 20 }) @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => LinkDto) links?: LinkDto[]
}

@Injectable()
export class JournalService extends OwnedService<JournalEntry> {
  constructor(@InjectModel(JournalEntry) model: typeof JournalEntry) {
    super(model)
  }

  /** Пошук і фільтри щоденника; повертає сторінку записів і кількість усіх знайдених. */
  async search(userId: string, query: JournalQueryDto) {
    const conditions = listConditions(query, ['text'])
    if (query.mood) conditions.push({ mood: query.mood })
    const tag = query.tag?.trim().toLowerCase()
    if (tag) conditions.push({ tags: { [Op.contains]: [tag] } })
    const { rows, count } = await this.model.findAndCountAll({
      where: { userId, ...(conditions.length ? { [Op.and]: conditions } : {}) } as any,
      order: this.order,
      limit: query.limit,
      offset: query.offset,
    })
    return { rows, count }
  }
}

@ApiTags('journal')
@ApiAuthed()
@UseGuards(JwtAuthGuard)
@Controller('journal')
export class JournalController {
  constructor(private s: JournalService) {}

  @ApiOperation({
    summary: 'Список записів користувача',
    description: 'Без параметрів повертає всі записи. Пошук q (текст), tag, mood, період from/to, сторінки limit/offset; кількість усіх знайдених — у заголовку X-Total-Count.',
  })
  @ApiOkResponse({ type: [JournalEntry] })
  @Get()
  async list(@CurrentUser() u, @Query() query: JournalQueryDto, @Res({ passthrough: true }) res: Response) {
    const { rows, count } = await this.s.search(u.id, query)
    res.setHeader('X-Total-Count', String(count))
    return rows
  }

  @ApiOperation({ summary: 'Теги записів щоденника з кількістю: для фільтра' })
  @ApiOkResponse({ description: '[{ tag, count }] від частіших до рідших' })
  @Get('tags')
  async tags(@CurrentUser() u) {
    const counts = new Map<string, number>()
    for (const e of await this.s.list(u.id)) for (const tag of e.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1)
    return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  }
  @ApiOperation({ summary: 'Створити запис' }) @ApiCreatedResponse({ type: JournalEntry })
  @Post() create(@CurrentUser() u, @Body() dto: CreateEntryDto) { return this.s.create(u.id, { ...dto, tags: normalizeTags(dto.tags) }) }
  @ApiOperation({ summary: 'Один запис за id' }) @ApiOkResponse({ type: JournalEntry }) @ApiOwnedNotFound()
  @Get(':id') get(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) { return this.s.get(u.id, id) }
  @ApiOperation({ summary: 'Змінити запис (лише передані поля)' }) @ApiOkResponse({ type: JournalEntry }) @ApiOwnedNotFound()
  @Patch(':id') update(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEntryDto) { return this.s.update(u.id, id, { ...dto, ...(dto.tags ? { tags: normalizeTags(dto.tags) } : {}) }) }
  @ApiOperation({ summary: 'Видалити запис' }) @ApiNoContentResponse({ description: 'Видалено' }) @ApiOwnedNotFound()
  @Delete(':id') @HttpCode(204) remove(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) { return this.s.remove(u.id, id) }
}

@Module({
  imports: [SequelizeModule.forFeature([JournalEntry])],
  controllers: [JournalController],
  providers: [JournalService],
})
export class JournalModule {}
