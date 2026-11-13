import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { InjectModel } from '@nestjs/sequelize'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { User } from '../users/user.model'
import { cachedPasswordChange, rememberPasswordChange } from './session-cache'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    cfg: ConfigService,
    @InjectModel(User) private users: typeof User,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.getOrThrow('JWT_SECRET'),
    })
  }

  /** Токен діє, лише поки користувач існує й не змінював пароль після його видачі (після скидання пароля старі сеанси закриваються). */
  async validate(payload: { sub: string; email: string; iat?: number }) {
    let changed = cachedPasswordChange(payload.sub)
    if (changed === undefined) {
      const user = await this.users.findByPk(payload.sub, { attributes: ['id', 'passwordChangedAt'] })
      if (!user) throw new UnauthorizedException()
      changed = user.passwordChangedAt ? Math.floor(user.passwordChangedAt.getTime() / 1000) : 0
      rememberPasswordChange(payload.sub, changed)
    }
    if ((payload.iat ?? 0) < changed) throw new UnauthorizedException()
    return { id: payload.sub, email: payload.email }
  }
}
