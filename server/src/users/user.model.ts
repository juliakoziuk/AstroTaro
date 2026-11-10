import { Column, DataType, HasMany, Model, Table } from 'sequelize-typescript'
import { Dream } from '../dreams/dream.model'
import { JournalEntry } from '../journal/journal.model'
import { Spread } from '../spreads/spread.model'
import { DEFAULT_SETTINGS, Settings } from './settings'

export interface Consent {
  dreams: boolean
  journal: boolean
  spreads: boolean
}

@Table({ tableName: 'users' })
export class User extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  declare id: string

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  declare email: string

  @Column({ type: DataType.STRING, allowNull: false })
  declare name: string

  @Column({ type: DataType.STRING, allowNull: false })
  declare passwordHash: string

  // Дані народження для натальної карти (час і місце потрібні лише для асцендента)
  @Column({ type: DataType.DATEONLY })
  declare birthDate: string | null

  @Column({ type: DataType.STRING(5) })
  declare birthTime: string | null

  @Column({ type: DataType.STRING })
  declare birthPlace: string | null

  // Країна місця народження (ISO 3166-1 alpha-2): для державних свят
  @Column({ type: DataType.STRING(2) })
  declare country: string | null

  @Column({ type: DataType.FLOAT })
  declare birthLat: number | null

  @Column({ type: DataType.FLOAT })
  declare birthLon: number | null

  // Одноразові токени з листів зберігаємо лише хешем; passwordChangedAt робить старі токени входу недійсними
  @Column({ type: DataType.DATE })
  declare emailVerifiedAt: Date | null

  @Column({ type: DataType.STRING(64) })
  declare emailVerifyHash: string | null

  @Column({ type: DataType.STRING(64) })
  declare passwordResetHash: string | null

  @Column({ type: DataType.DATE })
  declare passwordResetExpires: Date | null

  @Column({ type: DataType.DATE })
  declare passwordChangedAt: Date | null

  // Stripe: клієнт і активна підписка (тариф вмикає вебхук); null — платної підписки немає
  @Column({ type: DataType.STRING(64) })
  declare stripeCustomerId: string | null

  @Column({ type: DataType.STRING(64) })
  declare stripeSubscriptionId: string | null

  // Час (за годинником Stripe) останньої застосованої події оплати: старіші події ігноруються
  @Column({ type: DataType.DATE })
  declare billingEventAt: Date | null

  @Column({ type: DataType.STRING(32) }) declare subscriptionStatus: string | null
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false }) declare cancelAtPeriodEnd: boolean
  @Column({ type: DataType.DATE }) declare currentPeriodEnd: Date | null

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'free' })
  declare plan: string

  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: DEFAULT_SETTINGS })
  declare settings: Settings

  // Згоди на використання записів в AI-аналізі (за замовчуванням нічого не дозволено)
  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: { dreams: false, journal: false, spreads: false } })
  declare consent: Consent

  @HasMany(() => Dream)
  declare dreams: Dream[]

  @HasMany(() => JournalEntry)
  declare journal: JournalEntry[]

  @HasMany(() => Spread)
  declare spreads: Spread[]

}
