import { registerDecorator, ValidationOptions } from 'class-validator'

/**
 * Не більше `max` байтів у UTF-8. bcrypt хешує лише перші 72 байти: довший пароль приймався б, але два паролі з однаковим
 * початком відкривали б той самий акаунт. Кирилична літера займає 2 байти, тож 72 байти — це 36 літер.
 * Ключ обмеження — maxBytes (шаблони повідомлень у i18n/messages.ts); число для повідомлення береться з тексту помилки.
 */
export function MaxBytes(max: number, options?: ValidationOptions) {
  return (target: object, property: string) =>
    registerDecorator({
      name: 'maxBytes',
      target: target.constructor,
      propertyName: property,
      options: options,
      constraints: [max],
      validator: { validate: (value: unknown) => typeof value === 'string' && Buffer.byteLength(value, 'utf8') <= max, defaultMessage: () => `${property} must be at most ${max} bytes` },
    })
}
