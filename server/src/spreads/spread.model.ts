import { ApiProperty } from '@nestjs/swagger'
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript'
import type { Situation } from '../tarot/sphere'
import { User } from '../users/user.model'

@Table({ tableName: 'spreads', indexes: [{ fields: ['userId', 'date'] }] })
export class Spread extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  @ApiProperty({ format: 'uuid' })
  declare id: string

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  @ApiProperty({ format: 'uuid' })
  declare userId: string

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  @ApiProperty({ type: String, format: 'date-time' })
  declare date: Date

  // Тип розкладу на фронті: 'one' | 'three' | ...
  @Column({ type: DataType.STRING, allowNull: false })
  @ApiProperty({ example: 'three-card' })
  declare spreadId: string

  @Column({ type: DataType.TEXT, allowNull: false, defaultValue: '' })
  @ApiProperty({})
  declare question: string

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'Classic Tarot' })
  @ApiProperty({ example: 'Classic Tarot' })
  declare deck: string

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'quick' })
  @ApiProperty({ enum: ['quick', 'detailed', 'depth'] })
  declare mode: string

  // Тлумачення не зберігається: presentSpread() рахує його з карт мовою запиту { positions: [{ label, card, reversed, meaning }], summary }
  @ApiProperty({ type: Object, required: false })
  declare result?: object | null

  // Тлумачення від моделі за мовами { en: '…', uk: '…' }; порожнє, якщо ключа немає — тоді працює локальний текст
  @Column({ type: DataType.JSONB, allowNull: true })
  declare narratives?: Record<string, string> | null

  // Сфера й тип питання, які визначила модель { sphere, kind, summary, source }; без неї движок читає питання за словами
  @Column({ type: DataType.JSONB, allowNull: true })
  declare situation?: Situation | null

  // Збережений у «Saved Readings» (профіль)
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  @ApiProperty()
  declare saved: boolean

  // Токен публічного посилання на розклад (NULL — не поширюється); людина може показати розклад іншим без входу
  @Column({ type: DataType.STRING(64), allowNull: true })
  @ApiProperty({ required: false, nullable: true, description: 'Токен публічного посилання; null, якщо розклад не поширюється' })
  declare shareToken?: string | null

  @Column({ type: DataType.DATE, allowNull: true })
  declare sharedAt?: Date | null

  // [{ id: number, reversed: boolean }]
  @Column({ type: DataType.JSONB, allowNull: false })
  @ApiProperty({ type: 'array', items: { type: 'object', properties: { id: { type: 'integer', minimum: 0, maximum: 77 }, reversed: { type: 'boolean' } } } })
  declare cards: { id: number; reversed: boolean }[]
}
