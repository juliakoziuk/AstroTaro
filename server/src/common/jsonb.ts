import { literal, Sequelize } from 'sequelize'

/**
 * Вираз для UPDATE, що зливає `patch` у JSONB-колонку на боці бази: `колонка || патч`.
 * Читання, злиття в памʼяті й запис (read-modify-write) гублять зміни, коли два запити приходять одночасно
 * (другий записує старе значення поля, яке перший щойно змінив); тут злиття робить сама база атомарно.
 * `patch` має бути вже перевіреним DTO: значення екрануються, але ключі беруться як є.
 */
export function jsonbMerge(sequelize: Sequelize, column: string, patch: object) {
  const quoted = sequelize.getQueryInterface().quoteIdentifier(column)
  return literal(`${quoted} || ${sequelize.escape(JSON.stringify(patch))}::jsonb`)
}
