import { ApiPropertyOptional } from '@nestjs/swagger'
import { Type } from 'class-transformer'
import { IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { Op, WhereOptions } from 'sequelize'

/** Спільні параметри списків (сни, щоденник): пошук за текстом, період, сторінка. */
export class ListQueryDto {
  @ApiPropertyOptional({ description: 'Шукати в назві й тексті (без урахування регістру)', maxLength: 100 }) @IsOptional() @IsString() @MaxLength(100) q?: string
  @ApiPropertyOptional({ description: 'Від дати (YYYY-MM-DD або дата-час, включно)', example: '2026-01-01' }) @IsOptional() @IsDateString() from?: string
  @ApiPropertyOptional({ description: 'До дати (YYYY-MM-DD включно з усім днем, або дата-час)', example: '2026-12-31' }) @IsOptional() @IsDateString() to?: string
  @ApiPropertyOptional({ description: 'Скільки записів повернути (за замовчуванням усі, не більше 500)', minimum: 1, maximum: 500 }) @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(500) limit?: number
  @ApiPropertyOptional({ description: 'Скільки записів пропустити', minimum: 0 }) @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset?: number
}

/** У LIKE спецсимволи % _ і \ — звичайні літери пошуку, а не шаблон. */
export const escapeLike = (text: string) => text.replace(/[\\%_]/g, (c) => '\\' + c)

const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/

/** Умови списку: текст у зазначених колонках і період за датою запису. Порожні параметри умов не додають. */
export function listConditions(query: ListQueryDto, textColumns: string[]): WhereOptions[] {
  const conditions: WhereOptions[] = []
  const q = query.q?.trim()
  if (q) conditions.push({ [Op.or]: textColumns.map((column) => ({ [column]: { [Op.iLike]: `%${escapeLike(q)}%` } })) })
  const range: Record<symbol, Date> = {}
  if (query.from) range[Op.gte] = new Date(DAY_ONLY.test(query.from) ? `${query.from}T00:00:00.000Z` : query.from)
  if (query.to) range[Op.lte] = new Date(DAY_ONLY.test(query.to) ? `${query.to}T23:59:59.999Z` : query.to)
  if (Object.getOwnPropertySymbols(range).length) conditions.push({ date: range })
  return conditions
}
