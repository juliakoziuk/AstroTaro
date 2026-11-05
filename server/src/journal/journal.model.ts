import { ApiProperty } from '@nestjs/swagger'
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript'
import { User } from '../users/user.model'

@Table({ tableName: 'journal_entries', indexes: [{ fields: ['userId', 'date'] }] })
export class JournalEntry extends Model {
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

  // Настрій 1–5
  @Column({ type: DataType.SMALLINT, allowNull: false })
  @ApiProperty({ minimum: 1, maximum: 5 })
  declare mood: number

  @Column({ type: DataType.TEXT, allowNull: false })
  @ApiProperty({})
  declare text: string

  // Прив'язки до снів/розкладів: [{ type: 'dream' | 'spread', id }]
  @Column({ type: DataType.JSONB, allowNull: false, defaultValue: [] })
  @ApiProperty({ type: 'array', items: { type: 'object', properties: { type: { enum: ['dream', 'spread'] }, id: { type: 'string' } } } })
  declare links: { type: 'dream' | 'spread'; id: string }[]
}
