import { BadRequestException, ConflictException, Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { createHash, randomBytes } from 'node:crypto'
import { JwtService } from '@nestjs/jwt'
import { InjectModel } from '@nestjs/sequelize'
import * as bcrypt from 'bcryptjs'
import { jsonbMerge } from '../common/jsonb'
import { MailService } from '../mail/mail'
import { currentLocale } from '../i18n/locale'
import { msg } from '../i18n/messages'
import { User } from '../users/user.model'
import { REMEMBER_ME_EXPIRES } from './auth.constants'
import { ConsentDto, LoginDto, RegisterDto } from './auth.dto'

const publicUser = (u: User) => ({ id: u.id, email: u.email, name: u.name, consent: u.consent, emailVerified: !!u.emailVerifiedAt })

const RESET_TTL_MS = 60 * 60 * 1000
const VERIFY_TTL_MS = 3 * 24 * 60 * 60 * 1000
/** У базі лежить лише хеш токена: з витоку бази посилання не відновити. Токен — 256 випадкових біт, тож швидкого SHA-256 досить. */
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex')
const newToken = () => randomBytes(32).toString('base64url')
const appLink = (route: string, token: string) => `${(process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')}/app.html#/${route}?token=${token}`

@Injectable()
export class AuthService {
  private log = new Logger('Auth')

  constructor(
    @InjectModel(User) private users: typeof User,
    private jwt: JwtService,
    private mail: MailService,
  ) {}

  private token(u: User, remember = false) {
    return this.jwt.sign({ sub: u.id, email: u.email }, remember ? { expiresIn: REMEMBER_ME_EXPIRES } : undefined)
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase()
    if (await this.users.findOne({ where: { email } })) throw new ConflictException(msg(currentLocale(), 'emailTaken'))
    const user = await this.users.create({ email, name: dto.name.trim(), passwordHash: await bcrypt.hash(dto.password, 10) })
    await this.sendVerification(user) // не блокує реєстрацію: пошту можна підтвердити пізніше
    return { token: this.token(user), user: publicUser(user) }
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({ where: { email: dto.email.trim().toLowerCase() } })
    // Однакова відповідь для невідомого email і хибного пароля
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) throw new UnauthorizedException(msg(currentLocale(), 'badCredentials'))
    return { token: this.token(user, dto.remember), user: publicUser(user) }
  }

  async me(id: string) {
    const user = await this.users.findByPk(id)
    if (!user) throw new UnauthorizedException()
    return publicUser(user)
  }

  async setConsent(id: string, dto: ConsentDto) {
    // злиття робить база, а не код: одночасні запити не затирають зміни один одного
    await this.users.update({ consent: jsonbMerge(this.users.sequelize, 'consent', dto) }, { where: { id } })
    const user = await this.users.findByPk(id)
    if (!user) throw new UnauthorizedException()
    return publicUser(user)
  }

  private async deliver(user: User, kind: 'reset' | 'verify', token: string) {
    const locale = currentLocale()
    const link = appLink(kind === 'reset' ? 'reset-password' : 'verify-email', token)
    try {
      await this.mail.send({
        to: user.email,
        subject: msg(locale, kind === 'reset' ? 'resetMailSubject' : 'verifyMailSubject'),
        text: msg(locale, kind === 'reset' ? 'resetMailBody' : 'verifyMailBody', { name: user.name, link }),
      })
    } catch (e) {
      // відповідь API не залежить від пошти (і не видає, чи є така адреса): збій лише в журнал
      this.log.warn(`Could not send the ${kind} email: ${(e as Error).message}`)
    }
  }

  private async sendVerification(user: User) {
    const token = newToken()
    await user.update({ emailVerifyHash: hashToken(token) })
    await this.deliver(user, 'verify', token)
  }

  /** Лист із посиланням на скидання пароля. Для відомої й невідомої пошти робить те саме, тож адреси не вгадати. */
  async forgotPassword(emailRaw: string) {
    const user = await this.users.findOne({ where: { email: emailRaw.trim().toLowerCase() } })
    if (!user) return
    const token = newToken()
    await user.update({ passwordResetHash: hashToken(token), passwordResetExpires: new Date(Date.now() + RESET_TTL_MS) })
    await this.deliver(user, 'reset', token)
  }

  /** Новий пароль за токеном з листа. Токен одноразовий; усі раніше видані токени входу після цього недійсні. */
  async resetPassword(token: string, password: string) {
    const user = await this.users.findOne({ where: { passwordResetHash: hashToken(token) } })
    if (!user || !user.passwordResetExpires || user.passwordResetExpires.getTime() < Date.now()) throw new BadRequestException(msg(currentLocale(), 'badToken'))
    await user.update({ passwordHash: await bcrypt.hash(password, 10), passwordResetHash: null, passwordResetExpires: null, passwordChangedAt: new Date() })
  }

  async verifyEmail(token: string) {
    const user = await this.users.findOne({ where: { emailVerifyHash: hashToken(token) } })
    if (!user || (Date.now() - user.createdAt.getTime() > VERIFY_TTL_MS && !user.emailVerifiedAt)) throw new BadRequestException(msg(currentLocale(), 'badToken'))
    await user.update({ emailVerifiedAt: user.emailVerifiedAt ?? new Date(), emailVerifyHash: null })
    return publicUser(user)
  }

  async resendVerification(id: string) {
    const user = await this.users.findByPk(id)
    if (!user) throw new UnauthorizedException()
    if (user.emailVerifiedAt) throw new BadRequestException(msg(currentLocale(), 'alreadyVerified'))
    await this.sendVerification(user)
  }
}
