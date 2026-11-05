import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ArrayMaxSize, IsArray, IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger'
import { ApiAuthed, ApiOwnedNotFound } from '../common/api-docs'
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

  @ApiOperation({ summary: 'Список записів користувача' }) @ApiOkResponse({ type: [Dream] })
  @Get() async list(@CurrentUser() u) { return (await this.s.list(u.id)).map((d) => this.s.present(d)) }
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
