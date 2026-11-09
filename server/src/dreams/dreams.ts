import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { Op } from 'sequelize'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ArrayMaxSize, IsArray, IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger'
import { ApiAuthed, ApiOwnedNotFound } from '../common/api-docs'
import { listConditions, ListQueryDto } from '../common/list-query'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OwnedService } from '../common/owned.service'
import { currentLocale } from '../i18n/locale'
import { ALL_TAGS, analyzeDream } from './analysis'
import { Dream } from './dream.model'

export class CreateDreamDto {
  @ApiPropertyOptional({ format: 'date-time', description: 'За замовчуванням — зараз' }) @IsOptional() @IsDateString() date?: string
  @ApiProperty({ example: 'Політ над містом' }) @IsString() @MinLength(1) @MaxLength(200) title: string
  @ApiPropertyOptional({ example: 'calm' }) @IsOptional() @IsString() @MaxLength(40) mood?: string
  @ApiProperty({ maxLength: 10000 }) @IsString() @MinLength(1) @MaxLength(10000) text: string
  @ApiPropertyOptional({ type: [String], maxItems: 20, example: ['вода'] }) @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(40, { each: true }) symbols?: string[]
}

export class DreamQueryDto extends ListQueryDto {
  @ApiPropertyOptional({ description: 'Лише сни з цим символом (заданим вручну або знайденим автоматично)', maxLength: 40 }) @IsOptional() @IsString() @MaxLength(40) tag?: string
  @ApiPropertyOptional({ description: 'Лише сни з цим настроєм', maxLength: 40 }) @IsOptional() @IsString() @MaxLength(40) mood?: string
}

export class UpdateDreamDto {
  @ApiPropertyOptional({ format: 'date-time', description: 'За замовчуванням — зараз' }) @IsOptional() @IsDateString() date?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(200) title?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) mood?: string
  @ApiPropertyOptional() @IsOptional() @IsString() @MinLength(1) @MaxLength(10000) text?: string
  @ApiPropertyOptional({ type: [String], maxItems: 20 }) @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(40, { each: true }) symbols?: string[]
}

@Injectable()
export class DreamsService extends OwnedService<Dream> {
  constructor(@InjectModel(Dream) model: typeof Dream) {
    super(model)
  }

  /**
   * Сон для відповіді: символи, тип і трактовка рахуються з тексту (мовою запиту), тож зміна мови перекладає й старі сни.
   * Теги, які людина задала сама, мають пріоритет; автоматичні теги з давніх записів у базі ігноруємо.
   */
  present(row: Dream) {
    const a = analyzeDream(row.title, row.text, currentLocale())
    const manual = (row.symbols ?? []).filter((t) => !ALL_TAGS.has(t))
    return { ...row.toJSON(), symbols: manual.length ? manual : a.symbols, kind: a.kind, analysis: { interpretation: a.interpretation, keyMeanings: a.keyMeanings } }
  }
}

@ApiTags('dreams')
@ApiAuthed()
@UseGuards(JwtAuthGuard)
@Controller('dreams')
export class DreamsController {
  constructor(private s: DreamsService) {}

  @ApiOperation({
    summary: 'Список записів користувача',
    description: 'Без параметрів повертає всі сни. Пошук q (назва й текст), tag (символ), mood, період from/to, сторінки limit/offset; кількість усіх знайдених — у заголовку X-Total-Count.',
  })
  @ApiOkResponse({ type: [Dream] })
  @Get()
  async list(@CurrentUser() u, @Query() query: DreamQueryDto, @Res({ passthrough: true }) res: Response) {
    const conditions = listConditions(query, ['title', 'text'])
    if (query.mood) conditions.push({ mood: query.mood })
    let items = (await this.s.list(u.id, conditions.length ? { [Op.and]: conditions } : {})).map((d) => this.s.present(d))
    // символи рахуються з тексту мовою запиту, тож за ними фільтруємо вже після вибірки
    const tag = query.tag?.trim().toLowerCase()
    if (tag) items = items.filter((d) => d.symbols.some((s) => s.toLowerCase() === tag))
    res.setHeader('X-Total-Count', String(items.length))
    const offset = query.offset ?? 0
    return query.limit ? items.slice(offset, offset + query.limit) : items.slice(offset)
  }

  @ApiOperation({ summary: 'Символи у снах користувача з кількістю: для фільтра за тегом' })
  @ApiOkResponse({ description: '[{ tag, count }] від частіших до рідших' })
  @Get('tags')
  async tags(@CurrentUser() u) {
    const counts = new Map<string, number>()
    for (const d of (await this.s.list(u.id)).map((row) => this.s.present(row))) for (const s of new Set<string>(d.symbols as string[])) counts.set(s, (counts.get(s) ?? 0) + 1)
    return [...counts].map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
  }

  @ApiOperation({ summary: 'Створити запис' }) @ApiCreatedResponse({ type: Dream })
  @Post() async create(@CurrentUser() u, @Body() dto: CreateDreamDto) { return this.s.present(await this.s.create(u.id, { ...dto })) }
  @ApiOperation({ summary: 'Один запис за id' }) @ApiOkResponse({ type: Dream }) @ApiOwnedNotFound()
  @Get(':id') async get(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) { return this.s.present(await this.s.get(u.id, id)) }
  @ApiOperation({ summary: 'Змінити запис (лише передані поля)' }) @ApiOkResponse({ type: Dream }) @ApiOwnedNotFound()
  @Patch(':id') async update(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDreamDto) { return this.s.present(await this.s.update(u.id, id, { ...dto })) }
  @ApiOperation({ summary: 'Видалити запис' }) @ApiNoContentResponse({ description: 'Видалено' }) @ApiOwnedNotFound()
  @Delete(':id') @HttpCode(204) remove(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) { return this.s.remove(u.id, id) }
}

@Module({
  imports: [SequelizeModule.forFeature([Dream])],
  controllers: [DreamsController],
  providers: [DreamsService],
})
export class DreamsModule {}
