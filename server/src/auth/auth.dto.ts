import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator'

export class RegisterDto {
  @ApiProperty({ example: 'Юля', maxLength: 80 })
  @IsString() @MinLength(1) @MaxLength(80)
  name: string

  @ApiProperty({ example: 'yulia@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'secret123', minLength: 8, maxLength: 128 })
  @IsString() @MinLength(8) @MaxLength(128)
  password: string
}

export class LoginDto {
  @ApiProperty({ example: 'yulia@example.com' })
  @IsEmail()
  email: string

  @ApiProperty({ example: 'secret123' })
  @IsString()
  password: string
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
