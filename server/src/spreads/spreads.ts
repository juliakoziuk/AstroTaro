import { Body, Controller, Delete, Get, HttpCode, Injectable, Module, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator'
import { ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ApiAuthed, ApiOwnedNotFound } from '../common/api-docs'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OwnedService } from '../common/owned.service'
import { currentLocale } from '../i18n/locale'
import { attachNarrative } from '../tarot/ai'
import { presentSpread } from '../tarot/present'
import { Spread } from './spread.model'

class CardDto {
  @ApiProperty({ minimum: 0, maximum: 77, description: 'Номер карти колоди (0–77)' }) @IsInt() @Min(0) @Max(77) id: number
  @ApiProperty({ description: 'Перевернута карта' }) @IsBoolean() reversed: boolean
}

export class SaveSpreadDto {
  @ApiProperty() @IsBoolean() saved: boolean
}

export class CreateSpreadDto {
  @ApiPropertyOptional({ format: 'date-time', description: 'За замовчуванням — зараз' }) @IsOptional() @IsDateString() date?: string
  @ApiProperty({ example: 'three-card', description: 'Тип розкладу' }) @IsString() @MaxLength(40) spreadId: string
  @ApiPropertyOptional({ maxLength: 500 }) @IsOptional() @IsString() @MaxLength(500) question?: string
  @ApiProperty({ type: [CardDto], minItems: 1, maxItems: 12 }) @IsArray() @ArrayMinSize(1) @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => CardDto) cards: CardDto[]
}

// Розклад — це знімок моменту, тому редагування немає: тільки створити, переглянути, видалити.
@Injectable()
export class SpreadsService extends OwnedService<Spread> {
  constructor(@InjectModel(Spread) model: typeof Spread) {
    super(model)
  }
}

@ApiTags('spreads')
@ApiAuthed()
@UseGuards(JwtAuthGuard)
@Controller('spreads')
export class SpreadsController {
  constructor(private s: SpreadsService) {}

  @ApiOperation({ summary: 'Список записів користувача' }) @ApiOkResponse({ type: [Spread] })
  @ApiQuery({ name: 'saved', required: false, description: 'true — лише збережені розклади' })
  @Get() async list(@CurrentUser() u, @Query('saved') saved?: string) { return (await this.s.list(u.id, saved === 'true' ? { saved: true } : {})).map((r) => presentSpread(r, currentLocale())) }
  @ApiOperation({ summary: 'Створити запис' }) @ApiCreatedResponse({ type: Spread })
  @Post() async create(@CurrentUser() u, @Body() dto: CreateSpreadDto) {
    const row = await this.s.create(u.id, { ...dto })
    await attachNarrative(row, currentLocale())
    return presentSpread(row, currentLocale())
  }
  @ApiOperation({ summary: 'Один запис за id' }) @ApiOkResponse({ type: Spread }) @ApiOwnedNotFound()
  @Get(':id') async get(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) { return presentSpread(await this.s.get(u.id, id), currentLocale()) }
  @ApiOperation({ summary: 'Зберегти розклад або прибрати зі збережених' }) @ApiOkResponse({ type: Spread }) @ApiOwnedNotFound()
  @Patch(':id') async save(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveSpreadDto) { return presentSpread(await this.s.update(u.id, id, { saved: dto.saved }), currentLocale()) }
  @ApiOperation({ summary: 'Видалити запис' }) @ApiNoContentResponse({ description: 'Видалено' }) @ApiOwnedNotFound()
  @Delete(':id') @HttpCode(204) remove(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) { return this.s.remove(u.id, id) }
}

@Module({
  imports: [SequelizeModule.forFeature([Spread])],
  controllers: [SpreadsController],
  providers: [SpreadsService],
})
export class SpreadsModule {}
