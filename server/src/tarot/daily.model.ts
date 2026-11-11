import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript'
import { User } from '../users/user.model'

/** Карта дня: по одній на людину на календарний день (унікальний індекс — захист від подвійного відкриття). */
@Table({ tableName: 'daily_cards', updatedAt: false, indexes: [{ unique: true, fields: ['userId', 'day'] }] })
export class DailyCard extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true }) declare id: string

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false }) declare userId: string

  @BelongsTo(() => User, { onDelete: 'CASCADE' }) declare user: User

  /** Календарний день людини, РРРР-ММ-ДД */
  @Column({ type: DataType.STRING(10), allowNull: false }) declare day: string

  @Column({ type: DataType.SMALLINT, allowNull: false }) declare cardId: number

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false }) declare reversed: boolean
}
