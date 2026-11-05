import { Controller, ForbiddenException, Get, Module, Post, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { User } from '../users/user.model'
import { zoneAt } from '../cosmos/timezone'
import { currentLocale } from '../i18n/locale'
import { msg } from '../i18n/messages'
import { currentPlanets, natalChart, nextMoonEvents } from './astro'
import { buildReport } from './report'
import { inSign, monthlyInsight, moonEventName, planetName, signName } from './text'

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
    // id (name, sign) лишаються англійськими; поруч — назви мовою запиту
    const place = (p: { name: string; sign: string; degree: number }) => ({ ...p, planet: planetName(p.name, locale), signName: signName(p.sign, locale) })
    return {
      natal: natal && {
        planets: natal.planets.map(place),
        sun: signName(natal.planets[0].sign, locale),
        moon: signName(natal.planets[1].sign, locale),
        ascendant: natal.ascendant && signName(natal.ascendant, locale),
      },
      current: currentPlanets(now)
        .filter((p) => ['Mercury', 'Venus', 'Mars'].includes(p.name))
        .map((p) => ({ ...place(p), label: inSign(p.name, p.sign, locale) })),
      events: nextMoonEvents(now).map((e) => ({ ...e, id: e.name, name: moonEventName(e.name, locale) })),
      insight: monthlyInsight(now, locale),
    }
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
    if (user.plan === 'free') throw new ForbiddenException(msg(currentLocale(), 'reportNeedsPro'))
    const birth = birthOf(user)
    if (!birth) throw new ForbiddenException(msg(currentLocale(), 'reportNeedsBirth'))
    return this.reports.create({ userId: u.id, ...buildReport(natalChart(birth), currentLocale()) } as any)
  }
}

@Module({ imports: [SequelizeModule.forFeature([User, Report])], controllers: [AstrologyController] })
export class AstrologyModule {}
