import { Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript'
import { User } from '../users/user.model'
@Table({ tableName: 'usage_events', updatedAt: false, indexes: [{ fields: ['userId', 'kind', 'createdAt'] }] })
export class UsageEvent extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true }) declare id: string
  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false, onDelete: 'CASCADE' }) declare userId: string
  @Column({ type: DataType.STRING(32), allowNull: false }) declare kind: 'reading' | 'ai_message'
  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW }) declare createdAt: Date
}
