import { Body, Controller, ForbiddenException, Get, Logger, Module, Post, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiCreatedResponse, ApiForbiddenResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'
import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import { randomUUID } from 'node:crypto'
import { birthOf } from '../astrology/astrology'
import { currentPlanets, natalChart } from '../astrology/astro'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { analyzeDream } from '../dreams/analysis'
import { Dream } from '../dreams/dream.model'
import { currentLocale } from '../i18n/locale'
import { msg } from '../i18n/messages'
import { JournalEntry } from '../journal/journal.model'
import { Message } from '../messages/message.model'
import { Spread } from '../spreads/spread.model'
import { cardOf } from '../tarot/cards'
import { DrawnCard, spreadsFor } from '../tarot/readings'
import { withDefaults } from '../users/settings'
import { User } from '../users/user.model'
import { generateReply } from './assistant'
import { UserContext } from './context'
import { PERSONA_IDS, personas } from './personas'

class HistoryTurnDto {
  @IsIn(['user', 'ai']) role: 'user' | 'ai'
  @IsString() @MaxLength(12000) text: string
}

export class ChatDto {
  @ApiProperty({ enum: PERSONA_IDS, example: 'Mystic Guide' }) @IsIn(PERSONA_IDS) persona: string
  @ApiProperty({ maxLength: 4000 }) @IsString() @MinLength(1) @MaxLength(4000) text: string
  @IsOptional() @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => HistoryTurnDto) history?: HistoryTurnDto[]
}

@ApiTags('companion')
@Controller('companion')
export class CompanionController {
  private log = new Logger('Companion')

  constructor(
    @InjectModel(Message) private messages: typeof Message,
    @InjectModel(User) private users: typeof User,
    @InjectModel(Dream) private dreams: typeof Dream,
    @InjectModel(Spread) private spreads: typeof Spread,
    @InjectModel(JournalEntry) private journal: typeof JournalEntry,
  ) {}

  @ApiOperation({ summary: 'Персони AI-компаньйона (публічно)' })
  @ApiOkResponse({ description: '[{ id, name, description[] }]: id стабільний, name і description мовою Accept-Language' })
  @Get('personas')
  personas() {
    return personas(currentLocale())
  }

  /** Що асистент знає про людину: профіль і натальна карта, поточне небо, останні сни, розклад і настрій щоденника. */
  private async loadContext(user: User, now: Date): Promise<UserContext> {
    const [dreams, lastSpread, entries] = await Promise.all([
      user.consent?.dreams ? this.dreams.findAll({ where: { userId: user.id }, order: [['date', 'DESC']], limit: 3 }) : [],
      user.consent?.spreads ? this.spreads.findOne({ where: { userId: user.id }, order: [['date', 'DESC']] }) : null,
      user.consent?.journal ? this.journal.findAll({ where: { userId: user.id }, order: [['date', 'DESC']], limit: 5 }) : [],
    ])
    const birth = birthOf(user)
    const chart = birth ? natalChart(birth) : null
    const spreadName = lastSpread && spreadsFor('en').find((s) => s.id === lastSpread.spreadId)?.name
    return {
      name: user.name,
      sunSign: chart?.planets[0].sign,
      moonSign: chart?.planets[1].sign,
      ascendant: chart?.ascendant,
      transits: currentPlanets(now)
        .filter((p) => ['Mercury', 'Venus', 'Mars'].includes(p.name))
        .map((p) => ({ planet: p.name, sign: p.sign })),
      dreams: dreams.map((d) => ({ title: d.title, symbols: analyzeDream(d.title, d.text, 'en').symbols })),
      lastReading: spreadName ? { spread: spreadName, cards: (lastSpread.cards as DrawnCard[]).map((c) => `${cardOf(c.id, 'en').name}${c.reversed ? ' (reversed)' : ''}`) } : null,
      moods: entries.map((e) => e.mood),
    }
  }

  @ApiOperation({
    summary: 'Надіслати повідомлення компаньйону',
    description:
      'Зберігає повідомлення, формує відповідь і зберігає її. Відповідь генерує модель (Claude: ANTHROPIC_API_KEY; або будь-який OpenAI-сумісний сервіс: LLM_BASE_URL + LLM_MODEL [+ LLM_API_KEY]) із контекстом про людину; без налаштованої моделі або при її збої відповідає локальний асистент. Поле source: "ai" | "local".',
  })
  @ApiCreatedResponse({ description: '{ user: Message, reply: Message, source: "ai" | "local" }' })
  @ApiForbiddenResponse({ description: 'AI Companion вимкнено в налаштуваннях' })
  @ApiAuthed()
  @UseGuards(JwtAuthGuard)
  @Post('chat')
  async chat(@CurrentUser() u: { id: string }, @Body() dto: ChatDto) {
    const user = await this.users.findByPk(u.id)
    const settings = withDefaults(user.settings)
    if (!settings.companion) throw new ForbiddenException(msg(currentLocale(), 'companionOff'))
    const persist = settings.autosave
    const sentValues = { userId: u.id, persona: dto.persona, role: 'user', text: dto.text }
    const sent = persist ? await this.messages.create(sentValues as any) : { ...sentValues, id: randomUUID(), createdAt: new Date() }
    const recent = persist
      ? (await this.messages.findAll({ where: { userId: u.id, persona: dto.persona }, order: [['createdAt', 'DESC']], limit: 20 })).reverse()
      : [...(dto.history ?? []), sent]
    const now = new Date()
    const answer = await generateReply({
      persona: dto.persona,
      text: dto.text,
      history: recent.map((m) => ({ role: m.role === 'ai' ? ('assistant' as const) : ('user' as const), content: m.text })),
      ctx: await this.loadContext(user, now),
      locale: currentLocale(),
      env: process.env,
      now,
      onProviderError: (e) => this.log.warn(`AI provider failed, using the local assistant: ${e.message}`),
    })
    const replyValues = { userId: u.id, persona: dto.persona, role: 'ai', text: answer.text }
    const reply = persist ? await this.messages.create(replyValues as any) : { ...replyValues, id: randomUUID(), createdAt: new Date() }
    return { user: sent, reply, source: answer.source }
  }
}

@Module({ imports: [SequelizeModule.forFeature([Message, User, Dream, Spread, JournalEntry])], controllers: [CompanionController] })
export class CompanionModule {}
