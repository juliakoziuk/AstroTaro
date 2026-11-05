import { applyDecorators } from '@nestjs/common'
import { ApiBearerAuth, ApiNotFoundResponse, ApiUnauthorizedResponse } from '@nestjs/swagger'

// Спільні відповіді Swagger для захищених ендпоїнтів
export const ApiAuthed = () => applyDecorators(ApiBearerAuth(), ApiUnauthorizedResponse({ description: 'Немає токена або він недійсний' }))

// Для ендпоїнтів з :id — чужий запис віддає 404, а не 403
export const ApiOwnedNotFound = () => ApiNotFoundResponse({ description: 'Запис не знайдено (або він належить іншому користувачу)' })
