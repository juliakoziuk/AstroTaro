import { NotFoundException } from '@nestjs/common'
import { ModelCtor } from 'sequelize-typescript'
import { currentLocale } from '../i18n/locale'
import { msg } from '../i18n/messages'

// Базовий сервіс для записів, що належать користувачу: усі запити обмежені його userId,
// тож чужий запис не можна ні прочитати, ні змінити (віддаємо 404, а не 403).
export class OwnedService<T extends { id: string; userId: string } & import('sequelize-typescript').Model> {
  constructor(
    protected model: ModelCtor<T>,
    protected order: [string, 'ASC' | 'DESC'][] = [['date', 'DESC']],
  ) {}

  list(userId: string, filter: Record<string, unknown> = {}) {
    return this.model.findAll({ where: { ...filter, userId } as any, order: this.order })
  }

  create(userId: string, data: Record<string, unknown>) {
    return this.model.create({ ...data, userId } as any)
  }

  async get(userId: string, id: string) {
    const row = await this.model.findOne({ where: { id, userId } as any })
    if (!row) throw new NotFoundException(msg(currentLocale(), 'notFound'))
    return row
  }

  async update(userId: string, id: string, data: Record<string, unknown>) {
    const row = await this.get(userId, id)
    return row.update(data as any)
  }

  async remove(userId: string, id: string) {
    const row = await this.get(userId, id)
    await row.destroy()
  }
}
