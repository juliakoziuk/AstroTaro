import { Controller, Get, Module, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger'
import { Op } from 'sequelize'
import { monthlyInsight } from '../astrology/text'
import { currentLocale } from '../i18n/locale'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { Dream } from '../dreams/dream.model'
import { JournalEntry } from '../journal/journal.model'
import { Message } from '../messages/message.model'
import { Spread } from '../spreads/spread.model'
import { User } from '../users/user.model'
import { progressPercent } from './dashboard'

@ApiTags('dashboard')
@ApiAuthed()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(
    @InjectModel(User) private users: typeof User,
    @InjectModel(Spread) private spreads: typeof Spread,
    @InjectModel(Dream) private dreams: typeof Dream,
    @InjectModel(JournalEntry) private journal: typeof JournalEntry,
    @InjectModel(Message) private messages: typeof Message,
  ) {}

  @ApiOperation({ summary: 'Дані головного екрана', description: 'Імʼя, лічильники активності, прогрес місяця (частка цілі в 30 дій за останні 30 днів) і місячний інсайт.' })
  @ApiOkResponse({ description: '{ name, counts: { readings, dreams, journal, chats }, progress, insight }' })
  @Get()
  async get(@CurrentUser() u: { id: string }) {
    const user = await this.users.findByPk(u.id)
    const userId = u.id
    const since = { createdAt: { [Op.gte]: new Date(Date.now() - 30 * 864e5) } }
    const chats = { userId, role: 'user' }
    const count = (m: any, where: object) => m.count({ where })
    const [readings, dreams, journal, aiChats, recent] = await Promise.all([
      count(this.spreads, { userId }),
      count(this.dreams, { userId }),
      count(this.journal, { userId }),
      count(this.messages, chats),
      Promise.all([this.spreads, this.dreams, this.journal, this.messages].map((m, i) => count(m, { userId, ...since, ...(i === 3 ? { role: 'user' } : {}) }))),
    ])
    return {
      name: user.name,
      counts: { readings, dreams, journal, chats: aiChats },
      progress: progressPercent(recent.reduce((a: number, b: number) => a + b, 0)),
      insight: monthlyInsight(new Date(), currentLocale()),
    }
  }
}

@Module({ imports: [SequelizeModule.forFeature([User, Spread, Dream, JournalEntry, Message])], controllers: [DashboardController] })
export class DashboardModule {}
