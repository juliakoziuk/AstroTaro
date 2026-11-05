import { ApiProperty } from '@nestjs/swagger'
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript'
import { User } from '../users/user.model'

@Table({ tableName: 'messages', indexes: [{ fields: ['userId', 'createdAt'] }] })
export class Message extends Model {
  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, primaryKey: true })
  @ApiProperty({ format: 'uuid' })
  declare id: string

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  @ApiProperty({ format: 'uuid' })
  declare userId: string

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare user: User

  // З ким розмова (персона AI-компаньйона)
  @Column({ type: DataType.STRING, allowNull: false, defaultValue: 'Mystic Guide' })
  @ApiProperty({ example: 'Mystic Guide' })
  declare persona: string

  @Column({ type: DataType.ENUM('user', 'ai'), allowNull: false })
  @ApiProperty({ enum: ['user', 'ai'] })
  declare role: 'user' | 'ai'

  @Column({ type: DataType.TEXT, allowNull: false })
  @ApiProperty({})
  declare text: string
}
