import { ApiProperty } from '@nestjs/swagger'
import { BelongsTo, Column, DataType, ForeignKey, Model, Table } from 'sequelize-typescript'
import { User } from '../users/user.model'

@Table({ tableName: 'dreams', indexes: [{ fields: ['userId', 'date'] }] })
export class Dream extends Model {
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

  @Column({ type: DataType.STRING, allowNull: false })
  @ApiProperty({ example: 'Політ над містом' })
  declare title: string

  @Column({ type: DataType.STRING })
  @ApiProperty({ example: 'calm', required: false })
  declare mood: string

  @Column({ type: DataType.TEXT, allowNull: false })
  @ApiProperty({})
  declare text: string

  // Тип і трактовка не зберігаються: DreamsService.present() рахує їх з тексту мовою запиту
  @ApiProperty({ description: 'Dream | Lucid Dream | Nightmare мовою запиту', required: false })
  declare kind?: string

  @ApiProperty({ type: Object, description: '{ interpretation, keyMeanings[] } мовою запиту', required: false })
  declare analysis?: { interpretation: string; keyMeanings: string[] }

  @Column({ type: DataType.ARRAY(DataType.STRING), allowNull: false, defaultValue: [] })
  @ApiProperty({ type: [String], example: ['вода', 'птах'] })
  declare symbols: string[]
}
