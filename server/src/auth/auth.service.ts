import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectModel } from '@nestjs/sequelize'
import * as bcrypt from 'bcryptjs'
import { currentLocale } from '../i18n/locale'
import { msg } from '../i18n/messages'
import { User } from '../users/user.model'
import { REMEMBER_ME_EXPIRES } from './auth.constants'
import { ConsentDto, LoginDto, RegisterDto } from './auth.dto'

const publicUser = (u: User) => ({ id: u.id, email: u.email, name: u.name, consent: u.consent })

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User) private users: typeof User,
    private jwt: JwtService,
  ) {}

  private token(u: User, remember = false) {
    return this.jwt.sign({ sub: u.id, email: u.email }, remember ? { expiresIn: REMEMBER_ME_EXPIRES } : undefined)
  }

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase()
    if (await this.users.findOne({ where: { email } })) throw new ConflictException(msg(currentLocale(), 'emailTaken'))
    const user = await this.users.create({ email, name: dto.name.trim(), passwordHash: await bcrypt.hash(dto.password, 10) })
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
    const user = await this.users.findByPk(id)
    if (!user) throw new UnauthorizedException()
    user.consent = { ...user.consent, ...dto }
    await user.save()
    return publicUser(user)
  }
}
