import { BadRequestException, Body, Controller, Get, Module, NotFoundException, Post, Query, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiOkResponse, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger'
import { randomInt } from 'node:crypto'
import { IsOptional, IsString, Matches } from 'class-validator'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { currentLocale, Locale } from '../i18n/locale'
import { msg } from '../i18n/messages'
import { User } from '../users/user.model'
import { cardOf } from './cards'
import { DailyCard } from './daily.model'
import { draw, interpret } from './readings'
import { isPlausibleToday, recentDays, streakOf } from './streak'

const DAY = /^\d{4}-\d{2}-\d{2}$/
const unit = () => randomInt(2 ** 32) / 2 ** 32

export class DayDto {
  @ApiPropertyOptional({ example: '2026-11-11', description: 'Сьогоднішня дата людини за її годинником, РРРР-ММ-ДД. Без неї береться дата за UTC.' })
  @IsOptional() @IsString() @Matches(DAY) date?: string
}

/** Картка дня мовою запиту: назва, положення, значення в одне речення (meaning) і тлумачення дня (text) із настроєм, роллю карти й порадою. */
export function presentDaily(row: Pick<DailyCard, 'day' | 'cardId' | 'reversed'>, locale: Locale) {
  const drawn = [{ id: row.cardId, reversed: row.reversed }]
  const short = interpret('daily', drawn, 'quick', locale)
  const full = interpret('daily', drawn, 'detailed', locale)
  const card = cardOf(row.cardId, locale)
  return { id: row.cardId, name: card.name, reversed: row.reversed, meaning: short.positions[0].meaning, text: full.summary }
}

@ApiTags('tarot')
@ApiAuthed()
@UseGuards(JwtAuthGuard)
@Controller('tarot/daily')
export class DailyController {
  constructor(@InjectModel(DailyCard) private cards: typeof DailyCard, @InjectModel(User) private users: typeof User) {}

  private today(date?: string) {
    const day = date ?? new Date().toISOString().slice(0, 10)
    if (!isPlausibleToday(day)) throw new BadRequestException(msg(currentLocale(), 'badDate'))
    return day
  }

  private async state(userId: string, day: string) {
    const rows = await this.cards.findAll({ where: { userId }, attributes: ['day', 'cardId', 'reversed'], order: [['day', 'DESC']] })
    const days = rows.map((r) => r.day)
    const mine = rows.find((r) => r.day === day)
    return {
      date: day,
      drawn: !!mine,
      card: mine ? presentDaily(mine, currentLocale()) : null,
      streak: streakOf(days, day),
      week: recentDays(days, day),
    }
  }

  @ApiOperation({ summary: 'Карта дня: чи відкрито сьогоднішню, серія днів поспіль і останні 7 днів', description: 'Карта лишається прихованою (card: null), доки людина не відкриє її через POST.' })
  @ApiOkResponse({ description: '{ date, drawn, card: { id, name, reversed, meaning, text } | null, streak: { current, longest, total, drawnToday }, week: [{ date, drawn }] }' })
  @Get()
  get(@CurrentUser() u: { id: string }, @Query() q: DayDto) {
    return this.state(u.id, this.today(q.date))
  }

  @ApiOperation({ summary: 'Відкрити карту дня', description: 'Одна карта на день: повторний виклик у той самий день повертає ту саму карту й не змінює серію.' })
  @ApiOkResponse({ description: 'Те саме, що GET /tarot/daily' })
  @Post()
  async reveal(@CurrentUser() u: { id: string }, @Body() dto: DayDto) {
    const day = this.today(dto.date)
    // токен може належати вже видаленому акаунту: без користувача запис порушив би зовнішній ключ
    if (!(await this.users.count({ where: { id: u.id } }))) throw new NotFoundException(msg(currentLocale(), 'notFound'))
    const [pick] = draw('daily', unit)
    await this.cards.findOrCreate({ where: { userId: u.id, day }, defaults: { userId: u.id, day, cardId: pick.id, reversed: pick.reversed } as any })
    return this.state(u.id, day)
  }
}

@Module({ imports: [SequelizeModule.forFeature([DailyCard, User])], controllers: [DailyController] })
export class DailyModule {}
