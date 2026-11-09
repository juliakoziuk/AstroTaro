import { ForbiddenException, Injectable, Module } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { Op, Transaction } from 'sequelize'
import { Dream } from '../dreams/dream.model'
import { User } from '../users/user.model'
import { currentLocale } from '../i18n/locale'
import { msg } from '../i18n/messages'
import { limitsOf, planOf, usageWindows } from './limits'
import { UsageEvent } from './usage.model'
export type UsageKind = 'reading' | 'ai_message' | 'dream'
export function planLimit(user: { plan: string }, limit: 'readingsPerMonth' | 'dreamsTotal' | 'aiMessagesPerDay' | 'readingMode' | 'compatibility' | 'forecast', count?: number, mode?: string): never {
  const plan = planOf(user.plan)
  const key = limit === 'readingMode' ? 'limitMode' : limit === 'compatibility' || limit === 'forecast' ? 'limitFeature' : limit === 'readingsPerMonth' ? 'limitReadings' : limit === 'dreamsTotal' ? 'limitDreams' : 'limitMessages'
  throw new ForbiddenException({ statusCode: 403, code: 'PLAN_LIMIT', limit, plan, message: msg(currentLocale(), key, { count: String(count ?? ''), plan: plan === 'free' ? 'Free' : plan === 'pro' ? 'Pro' : 'Premium', mode: mode ?? '', upgrade: mode === 'depth' || plan !== 'free' ? 'Premium' : 'Pro' }) })
}
@Injectable()
export class UsageService {
  constructor(@InjectModel(UsageEvent) private events: typeof UsageEvent, @InjectModel(Dream) private dreams: typeof Dream, @InjectModel(User) private users: typeof User) {}
  async usageOf(userId: string, now = new Date(), transaction?: Transaction) {
    const w = usageWindows(now)
    const [readingsThisMonth, dreamsTotal, aiMessagesToday] = await Promise.all([
      this.events.count({ where: { userId, kind: 'reading', createdAt: { [Op.gte]: w.monthStart, [Op.lt]: w.readings } }, transaction }),
      this.dreams.count({ where: { userId }, transaction }),
      this.events.count({ where: { userId, kind: 'ai_message', createdAt: { [Op.gte]: w.dayStart, [Op.lt]: w.aiMessages } }, transaction }),
    ])
    return { readingsThisMonth, dreamsTotal, aiMessagesToday }
  }
  record(userId: string, kind: 'reading' | 'ai_message', transaction?: Transaction) { return this.events.create({ userId, kind } as any, { transaction }) }
  async assertWithinLimit(user: User, kind: UsageKind, transaction?: Transaction) {
    const limits = limitsOf(user.plan), usage = await this.usageOf(user.id, new Date(), transaction)
    const [limit, used] = kind === 'reading' ? ['readingsPerMonth', usage.readingsThisMonth] as const : kind === 'dream' ? ['dreamsTotal', usage.dreamsTotal] as const : ['aiMessagesPerDay', usage.aiMessagesToday] as const
    const max = limits[limit]
    if (max !== null && used >= max) planLimit(user, limit, max)
  }
  // Блокування користувача захищає ліміт від паралельних запитів.
  async accept(userId: string, kind: UsageKind, mode = 'quick', createDream?: (transaction: Transaction) => Promise<any>) {
    return this.users.sequelize!.transaction(async (transaction) => {
      const user = await this.users.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE })
      if (kind === 'reading' && !limitsOf(user.plan).readingModes.includes(mode as any)) planLimit(user, 'readingMode', undefined, mode)
      await this.assertWithinLimit(user, kind, transaction)
      if (kind === 'dream') return createDream!(transaction)
      await this.record(userId, kind, transaction)
    })
  }
}
@Module({ imports: [SequelizeModule.forFeature([UsageEvent, Dream, User])], providers: [UsageService], exports: [UsageService] })
export class UsageModule {}
