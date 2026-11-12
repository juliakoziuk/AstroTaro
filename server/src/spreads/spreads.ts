import { UsageModule, UsageService } from '../plans/usage'
import { BadRequestException, Body, Controller, Delete, Get, HttpCode, HttpException, HttpStatus, Injectable, Module, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Put, Query, Req, Res, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { Type } from 'class-transformer'
import { ArrayMaxSize, ArrayMinSize, IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator'
import { ApiCreatedResponse, ApiNoContentResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from '@nestjs/swagger'
import { ApiAuthed, ApiOwnedNotFound } from '../common/api-docs'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OwnedService } from '../common/owned.service'
import { currentLocale } from '../i18n/locale'
import { attachNarrative } from '../tarot/ai'
import { presentShared, presentSpread } from '../tarot/present'
import { randomBytes } from 'node:crypto'
import { Request, Response } from 'express'
import { RateLimiter } from '../auth/rate-limit'
import { Spread } from './spread.model'
import { accuracyOf, OUTCOMES } from './accuracy'
import { chosen, DECKS, MODES } from '../tarot/readings'
import { msg } from '../i18n/messages'

class CardDto {
  @ApiProperty({ minimum: 0, maximum: 77, description: 'Номер карти колоди (0–77)' }) @IsInt() @Min(0) @Max(77) id: number
  @ApiProperty({ description: 'Перевернута карта' }) @IsBoolean() reversed: boolean
}

export class SaveSpreadDto {
  @ApiProperty() @IsBoolean() saved: boolean
}

export class SetOutcomeDto {
  @ApiProperty({ enum: OUTCOMES, description: 'Чи збулося: yes — так, partly — частково, no — ні' }) @IsIn(OUTCOMES) outcome: string
}

export class CreateSpreadDto {
  @ApiPropertyOptional({ enum: DECKS }) @IsOptional() @IsIn(DECKS) deck?: string
  @ApiPropertyOptional({ enum: MODES }) @IsOptional() @IsIn(MODES) mode?: string
  @ApiPropertyOptional() @IsOptional() @IsBoolean() saved?: boolean
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
  constructor(private s: SpreadsService, private usage: UsageService) {}

  @ApiOperation({ summary: 'Список записів користувача' }) @ApiOkResponse({ type: [Spread] })
  @ApiQuery({ name: 'saved', required: false, description: 'true — лише збережені розклади' })
  @Get() async list(@CurrentUser() u, @Query('saved') saved?: string) { return (await this.s.list(u.id, saved === 'true' ? { saved: true } : {})).map((r) => presentSpread(r, currentLocale())) }
  @ApiOperation({ summary: 'Створити запис' }) @ApiCreatedResponse({ type: Spread })
  @Post() async create(@CurrentUser() u, @Body() dto: CreateSpreadDto) {
    // ті самі правила, що й у /tarot/readings: відомий розклад, по одній різній карті на позицію
    let cards
    try {
      cards = chosen(dto.spreadId, dto.cards)
    } catch {
      throw new BadRequestException(msg(currentLocale(), 'badCards'))
    }
    await this.usage.accept(u.id, 'reading', dto.mode ?? 'quick')
    const row = await this.s.create(u.id, { ...dto, cards })
    await attachNarrative(row, currentLocale())
    return presentSpread(row, currentLocale())
  }
  @ApiOperation({
    summary: 'Твої розклади в цифрах: скільки збулося',
    description: 'Підсумок відповідей «Збулося?»: кількість за відповідями, відсоток, скільки розкладів чекають на відповідь, карти, що випадають найчастіше.',
  })
  @ApiOkResponse({ description: '{ total, answered, yes, partly, no, waiting, rate, topCards: [{ id, count }] }' })
  @Get('accuracy') async accuracy(@CurrentUser() u) { return accuracyOf(await this.s.list(u.id)) }
  @ApiOperation({ summary: 'Один запис за id' }) @ApiOkResponse({ type: Spread }) @ApiOwnedNotFound()
  @Get(':id') async get(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) { return presentSpread(await this.s.get(u.id, id), currentLocale()) }
  @ApiOperation({ summary: 'Зберегти розклад або прибрати зі збережених' }) @ApiOkResponse({ type: Spread }) @ApiOwnedNotFound()
  @Patch(':id') async save(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveSpreadDto) { return presentSpread(await this.s.update(u.id, id, { saved: dto.saved }), currentLocale()) }
  @ApiOperation({ summary: 'Відповісти «Збулося?»: так, частково чи ні', description: 'Відповідь можна змінити, повторивши виклик, або прибрати (DELETE).' })
  @ApiOkResponse({ type: Spread }) @ApiOwnedNotFound()
  @Put(':id/outcome') async setOutcome(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SetOutcomeDto) {
    return presentSpread(await this.s.update(u.id, id, { outcome: dto.outcome, outcomeAt: new Date() }), currentLocale())
  }
  @ApiOperation({ summary: 'Прибрати відповідь «Збулося?»' }) @ApiOkResponse({ type: Spread }) @ApiOwnedNotFound()
  @Delete(':id/outcome') async clearOutcome(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) {
    return presentSpread(await this.s.update(u.id, id, { outcome: null, outcomeAt: null }), currentLocale())
  }
  @ApiOperation({ summary: 'Поділитися розкладом: створити публічне посилання (лише для читання)', description: 'Якщо посилання вже є, повертає його ж. Щоб замінити, спершу відкличте.' })
  @ApiOkResponse({ description: '{ token, path, url }' }) @ApiOwnedNotFound()
  @Post(':id/share') async share(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) {
    const row = await this.s.get(u.id, id)
    if (!row.shareToken) await row.update({ shareToken: randomBytes(32).toString('base64url'), sharedAt: new Date() })
    return shareLink(row.shareToken)
  }
  @ApiOperation({ summary: 'Відкликати публічне посилання: воно одразу перестає працювати' }) @ApiNoContentResponse({ description: 'Відкликано' }) @ApiOwnedNotFound()
  @Delete(':id/share') @HttpCode(204) async unshare(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) {
    const row = await this.s.get(u.id, id)
    await row.update({ shareToken: null, sharedAt: null })
  }
  @ApiOperation({ summary: 'Видалити запис' }) @ApiNoContentResponse({ description: 'Видалено' }) @ApiOwnedNotFound()
  @Delete(':id') @HttpCode(204) remove(@CurrentUser() u, @Param('id', ParseUUIDPipe) id: string) { return this.s.remove(u.id, id) }
}

/** Посилання, яке людина надсилає іншим: адреса клієнта + токен; APP_URL — де живе клієнт. */
const shareLink = (token: string) => ({
  token,
  path: `/shared?token=${token}`,
  url: `${(process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')}/app.html#/shared?token=${token}`,
})

/** Публічний перегляд розкладу за посиланням: без входу, лише читання. Токен — 256 випадкових біт, тож його не вгадати; запити з однієї адреси обмежені. */
@ApiTags('shared')
@Controller('shared')
export class SharedController {
  private limiter = new RateLimiter(60, 60_000)

  constructor(@InjectModel(Spread) private spreads: typeof Spread) {}

  @ApiOperation({ summary: 'Розклад за публічним посиланням (без входу)', description: 'Віддає розклад, питання й тлумачення без id та даних акаунта; мова — за Accept-Language.' })
  @ApiOkResponse({ description: '{ date, spreadId, deck, mode, question, cards, result }' })
  @ApiNotFoundResponse({ description: 'Посилання не існує або відкликане' })
  @Get(':token') async view(@Param('token') token: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    if (this.limiter.record(req.ip ?? '')) throw new HttpException(msg(currentLocale(), 'tooManyAttempts', { minutes: '1' }), HttpStatus.TOO_MANY_REQUESTS)
    // чужий розклад не повинен потрапити в пошукову видачу чи кеш посередників
    res.setHeader('X-Robots-Tag', 'noindex, nofollow')
    res.setHeader('Cache-Control', 'no-store')
    const row = token.length >= 20 && token.length <= 64 ? await this.spreads.findOne({ where: { shareToken: token } }) : null
    if (!row) throw new NotFoundException(msg(currentLocale(), 'notFound'))
    return presentShared(row, currentLocale())
  }
}

@Module({
  imports: [UsageModule, SequelizeModule.forFeature([Spread])],
  controllers: [SpreadsController, SharedController],
  providers: [SpreadsService],
})
export class SpreadsModule {}
