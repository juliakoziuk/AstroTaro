import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common'
import { ApiBadRequestResponse, ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger'
import { ApiAuthed } from '../common/api-docs'
import { AuthResponse, ConsentDto, LoginDto, PublicUser, RegisterDto } from './auth.dto'
import { AuthService } from './auth.service'
import { CurrentUser, JwtAuthGuard } from './jwt-auth.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @ApiOperation({ summary: 'Реєстрація', description: 'Створює користувача й одразу повертає токен.' })
  @ApiCreatedResponse({ type: AuthResponse })
  @ApiConflictResponse({ description: 'Цей email уже зареєстровано' })
  @ApiBadRequestResponse({ description: 'Невалідні поля (email, пароль коротший за 8 символів тощо)' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @ApiOperation({ summary: 'Вхід', description: 'Повертає токен. Однакова помилка для невідомого email і хибного пароля.' })
  @ApiCreatedResponse({ type: AuthResponse })
  @ApiUnauthorizedResponse({ description: 'Невірний email або пароль' })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
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
