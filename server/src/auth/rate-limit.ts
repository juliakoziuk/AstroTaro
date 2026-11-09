import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import { currentLocale } from '../i18n/locale'
import { msg } from '../i18n/messages'

const MINUTE = 60_000

/**
 * Лічильник у фіксованому вікні: не більше `max` подій на ключ за `windowMs`.
 * Лежить у памʼяті процесу: для одного екземпляра сервера цього досить; за кількох екземплярів лічильники треба
 * винести в спільне сховище (Redis тощо).
 */
export class RateLimiter {
  private hits = new Map<string, { count: number; resetAt: number }>()

  constructor(
    private max: number,
    private windowMs: number,
    private now: () => number = Date.now,
  ) {}

  /** Скільки секунд лишилось до зняття ліміту; 0 — ліміт не вичерпано. */
  blockedFor(key: string): number {
    const hit = this.live(key)
    return hit && hit.count >= this.max ? Math.ceil((hit.resetAt - this.now()) / 1000) : 0
  }

  /** Записує подію; повертає true, якщо після неї ліміт вичерпано. */
  record(key: string): boolean {
    this.sweep()
    const hit = this.live(key) ?? { count: 0, resetAt: this.now() + this.windowMs }
    hit.count++
    this.hits.set(key, hit)
    return hit.count >= this.max
  }

  reset(key: string) {
    this.hits.delete(key)
  }

  clear() {
    this.hits.clear()
  }

  private live(key: string) {
    const hit = this.hits.get(key)
    if (hit && hit.resetAt <= this.now()) {
      this.hits.delete(key)
      return undefined
    }
    return hit
  }

  /** Прибирає прострочені ключі, щоб памʼять не росла від випадкових адрес. */
  private sweep() {
    if (this.hits.size < 5000) return
    for (const key of this.hits.keys()) this.live(key)
  }
}

const tooMany = (seconds: number) =>
  new HttpException(
    { statusCode: HttpStatus.TOO_MANY_REQUESTS, message: msg(currentLocale(), 'tooManyAttempts', { minutes: String(Math.max(1, Math.ceil(seconds / 60))) }), retryAfter: seconds },
    HttpStatus.TOO_MANY_REQUESTS,
  )

/**
 * Захист входу й реєстрації від підбору паролів і масового створення акаунтів.
 * Вхід: до 30 спроб за 15 хв з однієї адреси й до 8 невдалих для пари «адреса + пошта» (успішний вхід обнуляє
 * лічильник невдач; пошта в парі, щоб чужими спробами не можна було заблокувати акаунт з іншої адреси).
 * Реєстрація: до 10 за годину з однієї адреси.
 * За зворотним проксі адреса в req.ip — це проксі: у такому разі налаштуйте `trust proxy` в Express.
 */
@Injectable()
export class AuthThrottle {
  private loginByIp = new RateLimiter(30, 15 * MINUTE)
  private loginFails = new RateLimiter(8, 15 * MINUTE)
  private registerByIp = new RateLimiter(10, 60 * MINUTE)
  private forgotByIp = new RateLimiter(10, 60 * MINUTE)
  private forgotByEmail = new RateLimiter(3, 60 * MINUTE)
  private verifyByUser = new RateLimiter(3, 60 * MINUTE)

  /** Обнулити всі лічильники (наскрізні тести створюють багато акаунтів з однієї адреси). */
  reset() {
    for (const limiter of [this.loginByIp, this.loginFails, this.registerByIp, this.forgotByIp, this.forgotByEmail, this.verifyByUser]) limiter.clear()
  }

  private pair = (ip: string, email: string) => `${ip}|${email.trim().toLowerCase()}`

  /** Викликати до перевірки пароля: кидає 429, якщо ліміт уже вичерпано. */
  beforeLogin(ip: string, email: string) {
    const wait = Math.max(this.loginByIp.blockedFor(ip), this.loginFails.blockedFor(this.pair(ip, email)))
    if (wait) throw tooMany(wait)
    this.loginByIp.record(ip)
  }

  loginFailed(ip: string, email: string) {
    this.loginFails.record(this.pair(ip, email))
  }

  loginSucceeded(ip: string, email: string) {
    this.loginFails.reset(this.pair(ip, email))
  }

  /**
   * Запит на скидання пароля: до 10 за годину з адреси (далі 429) і до 3 листів на одну пошту за годину.
   * Для пошти ліміт мовчазний (false — листа не слати), щоб відповідь не показувала, що з цією поштою щось відбувається.
   */
  beforeForgot(ip: string, email: string): boolean {
    const wait = this.forgotByIp.blockedFor(ip)
    if (wait) throw tooMany(wait)
    this.forgotByIp.record(ip)
    const key = email.trim().toLowerCase()
    if (this.forgotByEmail.blockedFor(key)) return false
    this.forgotByEmail.record(key)
    return true
  }

  /** Повторний лист підтвердження: до 3 за годину для користувача. */
  beforeResendVerification(userId: string) {
    const wait = this.verifyByUser.blockedFor(userId)
    if (wait) throw tooMany(wait)
    this.verifyByUser.record(userId)
  }

  beforeRegister(ip: string) {
    const wait = this.registerByIp.blockedFor(ip)
    if (wait) throw tooMany(wait)
    this.registerByIp.record(ip)
  }
}
