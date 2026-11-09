import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'
import { MaxBytes } from './max-bytes'

export class RegisterDto {
  @ApiProperty({ example: 'Юля', maxLength: 80 })
  @IsString() @MinLength(1) @MaxLength(80)
  name: string

  @ApiProperty({ example: 'yulia@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'secret123', minLength: 8, description: 'Від 8 символів і не більше 72 байтів у UTF-8 (кирилиця — 2 байти на літеру): bcrypt не бачить решти' })
  @IsString() @MinLength(8) @MaxBytes(72)
  password: string
}

export class LoginDto {
  @ApiProperty({ example: 'yulia@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'secret123' })
  @IsString() @MaxLength(128) // старі акаунти могли мати довший пароль, але безмежний рядок хешувати не потрібно
  password: string

  @ApiPropertyOptional({ description: 'Запам’ятати мене: токен діє довше (30 днів замість JWT_EXPIRES)' })
  @IsOptional() @IsBoolean()
  remember?: boolean
}

export class ConsentDto {
  @ApiPropertyOptional({ description: 'Дозволити AI аналізувати сни' }) @IsOptional() @IsBoolean() dreams?: boolean
  @ApiPropertyOptional({ description: 'Дозволити AI аналізувати щоденник' }) @IsOptional() @IsBoolean() journal?: boolean
  @ApiPropertyOptional({ description: 'Дозволити AI аналізувати розклади таро' }) @IsOptional() @IsBoolean() spreads?: boolean
}

export class ConsentState {
  @ApiProperty() dreams: boolean
  @ApiProperty() journal: boolean
  @ApiProperty() spreads: boolean
}

// Відповіді (описують те, що віддає AuthService)
export class PublicUser {
  @ApiProperty({ format: 'uuid' }) id: string
  @ApiProperty({ example: 'yulia@example.com' }) email: string
  @ApiProperty({ example: 'Юля' }) name: string
  @ApiProperty({ type: ConsentState }) consent: ConsentState
}

export class AuthResponse {
  @ApiProperty({ description: 'JWT: передавайте в заголовку Authorization: Bearer <token>' }) token: string
  @ApiProperty({ type: PublicUser }) user: PublicUser
}
