import { Body, Controller, Get, Patch, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { ApiAuthed } from '../common/api-docs'
import { AuthResponse, ConsentDto, ForgotPasswordDto, LoginDto, PublicUser, RegisterDto, ResetPasswordDto, VerifyEmailDto } from './auth.dto'
import { AuthService } from './auth.service'
import { CurrentUser, JwtAuthGuard } from './jwt-auth.guard'
import { AuthThrottle } from './rate-limit'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private throttle: AuthThrottle,
  ) {}

  @ApiOperation({ summary: 'Реєстрація', description: 'Створює користувача й одразу повертає токен.' })
  @ApiCreatedResponse({ type: AuthResponse })
  @ApiConflictResponse({ description: 'Цей email уже зареєстровано' })
  @ApiBadRequestResponse({ description: 'Невалідні поля (email, пароль коротший за 8 символів тощо)' })
  @Post('register')
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    this.throttle.beforeRegister(req.ip ?? '')
    return this.auth.register(dto)
  }

  @ApiOperation({ summary: 'Вхід', description: 'Повертає токен. Однакова помилка для невідомого email і хибного пароля.' })
  @ApiCreatedResponse({ type: AuthResponse })
  @ApiUnauthorizedResponse({ description: 'Невірний email або пароль' })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip ?? ''
    this.throttle.beforeLogin(ip, dto.email)
    try {
      const result = await this.auth.login(dto)
      this.throttle.loginSucceeded(ip, dto.email)
      return result
    } catch (e) {
      if (e instanceof UnauthorizedException) this.throttle.loginFailed(ip, dto.email)
      throw e
    }
  }

  @ApiOperation({ summary: 'Скидання пароля: надіслати лист', description: 'Завжди відповідає однаково, є така пошта чи ні. Посилання діє годину.' })
  @ApiCreatedResponse({ description: '{ ok: true }' })
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    if (this.throttle.beforeForgot(req.ip ?? '', dto.email)) await this.auth.forgotPassword(dto.email)
    return { ok: true }
  }

  @ApiOperation({ summary: 'Скидання пароля: новий пароль за токеном з листа', description: 'Токен одноразовий. Після зміни всі раніше видані токени входу перестають діяти.' })
  @ApiCreatedResponse({ description: '{ ok: true }' })
  @ApiBadRequestResponse({ description: 'Токен недійсний або прострочений' })
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.auth.resetPassword(dto.token, dto.password)
    return { ok: true }
  }

  @ApiOperation({ summary: 'Підтвердити пошту за токеном з листа' })
  @ApiCreatedResponse({ type: PublicUser })
  @ApiBadRequestResponse({ description: 'Токен недійсний або прострочений' })
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.auth.verifyEmail(dto.token)
  }

  @ApiOperation({ summary: 'Надіслати лист підтвердження ще раз' })
  @ApiCreatedResponse({ description: '{ ok: true }' })
  @ApiAuthed()
  @UseGuards(JwtAuthGuard)
  @Post('resend-verification')
  async resendVerification(@CurrentUser() u: { id: string }) {
    this.throttle.beforeResendVerification(u.id)
    await this.auth.resendVerification(u.id)
    return { ok: true }
  }

  @ApiOperation({ summary: 'Поточний користувач' })
  @ApiOkResponse({ type: PublicUser })
  @ApiAuthed()
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() u: { id: string }) {
    return this.auth.me(u.id)
  }

  @ApiOperation({ summary: 'Змінити згоди на AI-аналіз', description: 'Змінює лише передані поля; решта лишається як була.' })
  @ApiOkResponse({ type: PublicUser })
  @ApiAuthed()
  @UseGuards(JwtAuthGuard)
  @Patch('consent')
  consent(@CurrentUser() u: { id: string }, @Body() dto: ConsentDto) {
    return this.auth.setConsent(u.id, dto)
  }
}
