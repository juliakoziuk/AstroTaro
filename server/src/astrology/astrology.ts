import { limitsOf } from '../plans/limits'
import { planLimit } from '../plans/usage'
import { BadRequestException, Body, Controller, ForbiddenException, Get, Module, Post, Query, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger'
import { IsDateString, IsOptional, IsString, Matches, MaxLength } from 'class-validator'
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { User } from '../users/user.model'
import { zoneAt } from '../cosmos/timezone'
import { currentLocale } from '../i18n/locale'
import { msg } from '../i18n/messages'
import { currentPlanets, natalChart, nextMoonEvents } from './astro'
import { aspectMeaning, planetMeaning } from './interpretation'
import { aspectsOf, buildReport } from './report'
import { buildForecast } from './forecast'
import { buildCompatibility } from './synastry'
import { inSign, monthlyInsight, moonEventName, planetName, signName } from './text'
import { aiCompatibility, aiForecast, aiNatalReport, positionsBlock } from './ai'

@Table({ tableName: 'reports', indexes: [{ fields: ['userId', 'createdAt'] }] })
export class Report extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string

  @Column({ type: DataType.STRING, allowNull: false })
  declare title: string

  @Column({ type: DataType.TEXT, allowNull: false })
  declare text: string
}

const MIN_BIRTH_YEAR = 1900

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export class CompatibilityDto {
  @ApiPropertyOptional({ example: 'Anna', description: 'Імʼя другої людини (необовʼязково)' }) @IsOptional() @IsString() @MaxLength(60) name?: string
  @ApiProperty({ example: '1999-03-14', description: 'Дата народження другої людини, YYYY-MM-DD' }) @Matches(DATE_ONLY) @IsDateString({ strict: true }) birthDate: string
  @ApiPropertyOptional({ example: 'Yullia', description: 'Імʼя першої людини; без нього береться імʼя з профілю' }) @IsOptional() @IsString() @MaxLength(60) firstName?: string
  @ApiPropertyOptional({ example: '2004-06-22', description: 'Дата народження першої людини; без неї береться натальна карта з профілю (з часом і місцем)' }) @IsOptional() @Matches(DATE_ONLY) @IsDateString({ strict: true }) firstBirthDate?: string
}

export const birthOf = (u: User) =>
  u.birthDate
    ? { birthDate: u.birthDate, birthTime: u.birthTime, lat: u.birthLat, lon: u.birthLon, timeZone: u.birthLat != null && u.birthLon != null ? zoneAt(u.birthLat, u.birthLon) : null }
    : null

@ApiTags('astrology')
@ApiAuthed()
@UseGuards(JwtAuthGuard)
@Controller('astrology')
export class AstrologyController {
  constructor(
    @InjectModel(User) private users: typeof User,
    @InjectModel(Report) private reports: typeof Report,
  ) {}

  @ApiOperation({
    summary: 'Дані екрана Astrology',
    description: 'Натальна карта з дати народження (planets, sun/moon/ascendant), поточні транзити та найближчі фази Місяця. Якщо дата народження не вказана, natal = null.',
  })
  @ApiOkResponse({ description: '{ natal, current[], events[], insight }' })
  @Get()
  async overview(@CurrentUser() u: { id: string }) {
    const user = await this.users.findByPk(u.id)
    const birth = birthOf(user)
    const now = new Date()
    const locale = currentLocale()
    const natal = birth ? natalChart(birth) : null
    const sky = currentPlanets(now)
    // id (name, sign) лишаються англійськими; поруч — назви мовою запиту
    const place = (p: { name: string; sign: string; degree: number }) => ({ ...p, planet: planetName(p.name, locale), signName: signName(p.sign, locale) })
    return {
      natal: natal && {
        planets: natal.planets.map((p) => ({ ...place(p), meaning: planetMeaning(p, locale) })),
        sun: signName(natal.planets[0].sign, locale),
        moon: signName(natal.planets[1].sign, locale),
        ascendant: natal.ascendant && signName(natal.ascendant, locale),
        // точні довготи кутів і куспіди будинків — для колеса; усі аспекти між планетами
        angles: natal.houses && { ascendant: natal.ascendantLongitude, midheaven: natal.midheaven },
        houses: natal.houses,
        aspects: aspectsOf(natal.planets, Number.POSITIVE_INFINITY).map((a) => ({ ...a, meaning: aspectMeaning(a, locale) })),
      },
      // положення всіх планет зараз (довгота 0–360) — для живого колеса, коли дати народження ще немає
      sky: { planets: sky.map(({ name, longitude }) => ({ name, longitude })), aspects: aspectsOf(sky, Number.POSITIVE_INFINITY) },
      current: sky
        .filter((p) => ['Mercury', 'Venus', 'Mars'].includes(p.name))
        .map((p) => ({ ...place(p), label: inSign(p.name, p.sign, locale) })),
      events: nextMoonEvents(now).map((e) => ({ ...e, id: e.name, name: moonEventName(e.name, locale) })),
      insight: monthlyInsight(now, locale),
    }
  }

  @ApiOperation({
    summary: 'Сумісність із партнером (синастрія)',
    description: 'Порівнює натальну карту користувача з картою за датою народження партнера: аспекти між планетами, оцінки за сферами та текстовий звіт. Нічого не зберігає.',
  })
  @ApiOkResponse({ description: '{ title, text, score, level, categories[], aspects[], me, partner }' })
  @ApiForbiddenResponse({ description: 'У користувача немає дати народження' })
  @Post('compatibility')
  async compatibility(@CurrentUser() u: { id: string }, @Body() dto: CompatibilityDto) {
    const user = await this.users.findByPk(u.id)
    const locale = currentLocale()
    if (!limitsOf(user.plan).compatibility) planLimit(user, 'compatibility')
    const today = new Date().toISOString().slice(0, 10)
    for (const date of [dto.birthDate, dto.firstBirthDate]) {
      if (date && (Number(date.slice(0, 4)) < MIN_BIRTH_YEAR || date > today)) throw new BadRequestException(msg(locale, 'badPartnerBirth'))
    }
    // перша людина: введена дата (планети на полудень) або профіль користувача з часом і місцем, якщо вони є
    const profileBirth = birthOf(user)
    if (!dto.firstBirthDate && !profileBirth) throw new ForbiddenException(msg(locale, 'reportNeedsBirth'))
    const mine = natalChart(dto.firstBirthDate ? { birthDate: dto.firstBirthDate } : (profileBirth as NonNullable<typeof profileBirth>))
    const theirs = natalChart({ birthDate: dto.birthDate }) // без часу й місця: планети на полудень, без будинків
    const names = { a: dto.firstName?.trim() || user.name, b: dto.name?.trim() || msg(locale, 'partnerName') }
    const plotted = (c: typeof mine) => c.planets.map((p) => ({ name: p.name, planet: planetName(p.name, locale), sign: p.sign, signName: signName(p.sign, locale), longitude: p.longitude }))
    const built = buildCompatibility(mine, theirs, names, locale)
    // розрахунок наш, а текст пише модель за цими фактами (summary); без неї лишається шаблонний text: source каже, що саме показано
    const summary = await aiCompatibility(mine, theirs, built, names, locale)
    return { ...built, summary, source: summary ? 'ai' : 'local', me: { name: names.a, planets: plotted(mine) }, partner: { name: names.b, planets: plotted(theirs) } }
  }

  @ApiOperation({
    summary: 'Особистий прогноз: день, тиждень і місяць',
    description: 'Транзити (поточне небо) до натальної карти користувача: оцінки дня за сферами життя, ключові аспекти, прогноз на 7 і 30 днів уперед, новий і повний місяць. Потрібна дата народження.',
  })
  @ApiOkResponse({ description: '{ date, day, week, month }' })
  @ApiForbiddenResponse({ description: 'У користувача немає дати народження' })
  @Get('forecast')
  async forecast(@CurrentUser() u: { id: string }, @Query('date') date?: string) {
    const user = await this.users.findByPk(u.id)
    const locale = currentLocale()
    const birth = birthOf(user)
    if (!birth) throw new ForbiddenException(msg(locale, 'reportNeedsBirth'))
    // день рахуємо від дати, яку надіслав клієнт (його місцевий «сьогодні»), інакше від сьогодні за UTC
    if (date !== undefined && (!DATE_ONLY.test(date) || Number.isNaN(Date.parse(date)))) throw new BadRequestException(msg(locale, 'badDate'))
    const forecast = buildForecast(natalChart(birth).planets, date ?? new Date().toISOString().slice(0, 10), locale)
    const locked = (['week', 'month'] as const).filter((range) => !limitsOf(user.plan).forecastRanges.includes(range))
    // тлумачення від моделі лише на платних тарифах (Free бачить шаблонні тексти): це і найдорожча частина, і відмінність тарифів
    const narratives = user.plan === 'free' ? null : await aiForecast(forecast, locale)
    return { ...forecast, ...Object.fromEntries(locked.map((range) => [range, null])), locked, narratives }
  }

  @ApiOperation({ summary: 'Мої астрологічні звіти' })
  @ApiOkResponse({ description: '[{ id, title, text, createdAt }]' })
  @Get('reports')
  list(@CurrentUser() u: { id: string }) {
    return this.reports.findAll({ where: { userId: u.id }, order: [['createdAt', 'DESC']] })
  }

  @ApiOperation({ summary: 'Згенерувати повний астрологічний звіт', description: 'Потрібна дата народження й тариф Pro або Premium.' })
  @ApiCreatedResponse({ description: 'Створений звіт' })
  @ApiForbiddenResponse({ description: 'Тариф Free або немає дати народження' })
  @Post('reports')
  async create(@CurrentUser() u: { id: string }) {
    const user = await this.users.findByPk(u.id)
    if (!limitsOf(user.plan).fullReports) throw new ForbiddenException(msg(currentLocale(), 'reportNeedsPro'))
    const birth = birthOf(user)
    if (!birth) throw new ForbiddenException(msg(currentLocale(), 'reportNeedsBirth'))
    const chart = natalChart(birth)
    const locale = currentLocale()
    const built = buildReport(chart, locale)
    // текст пише модель за розрахованими фактами, після нього йдуть самі положення (їх можна звірити); без моделі лишається шаблонний звіт
    const ai = await aiNatalReport(chart, locale)
    return this.reports.create({ userId: u.id, title: built.title, text: ai ? `${ai}\n\n${positionsBlock(chart, locale)}` : built.text } as any)
  }
}

@Module({ imports: [SequelizeModule.forFeature([User, Report])], controllers: [AstrologyController] })
export class AstrologyModule {}
