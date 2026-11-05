import { Body, Controller, Get, Module, Patch, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiOkResponse, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger'
import { IsBoolean, IsDateString, IsIn, IsLatitude, IsLongitude, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { Dream } from '../dreams/dream.model'
import { Report } from '../astrology/astrology'
import { Spread } from '../spreads/spread.model'
import { DEFAULT_SETTINGS, SETTING_OPTIONS } from '../users/settings'
import { User } from '../users/user.model'

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Yullia' }) @IsOptional() @IsString() @MinLength(1) @MaxLength(80) name?: string
  @ApiPropertyOptional({ example: '2004-06-22', description: 'YYYY-MM-DD' }) @IsOptional() @IsDateString({ strict: true }) birthDate?: string
  @ApiPropertyOptional({ example: '08:30', description: 'HH:mm, лише для асцендента' }) @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) birthTime?: string
  @ApiPropertyOptional({ example: 'Kyiv' }) @IsOptional() @IsString() @MaxLength(120) birthPlace?: string
  @ApiPropertyOptional({ example: 50.45, nullable: true }) @IsOptional() @IsLatitude() birthLat?: number | null
  @ApiPropertyOptional({ example: 30.52, nullable: true }) @IsOptional() @IsLongitude() birthLon?: number | null
  @ApiPropertyOptional({ example: 'UA', description: 'Країна місця народження (ISO 3166-1 alpha-2)', nullable: true }) @IsOptional() @Length(2, 2) country?: string | null
}

export class UpdateSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() notifications?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() insights?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() autosave?: boolean
  @ApiPropertyOptional() @IsOptional() @IsBoolean() companion?: boolean
  @ApiPropertyOptional({ enum: SETTING_OPTIONS.language }) @IsOptional() @IsIn(SETTING_OPTIONS.language) language?: string
  @ApiPropertyOptional({ enum: SETTING_OPTIONS.theme }) @IsOptional() @IsIn(SETTING_OPTIONS.theme) theme?: string
  @ApiPropertyOptional({ enum: SETTING_OPTIONS.defaultReading }) @IsOptional() @IsIn(SETTING_OPTIONS.defaultReading) defaultReading?: string
  @ApiPropertyOptional({ enum: SETTING_OPTIONS.timeFormat }) @IsOptional() @IsIn(SETTING_OPTIONS.timeFormat) timeFormat?: string
  @ApiPropertyOptional({ enum: SETTING_OPTIONS.dateFormat }) @IsOptional() @IsIn(SETTING_OPTIONS.dateFormat) dateFormat?: string
}

@ApiTags('profile')
@ApiAuthed()
@UseGuards(JwtAuthGuard)
@Controller()
export class ProfileController {
  constructor(
    @InjectModel(User) private users: typeof User,
    @InjectModel(Spread) private spreads: typeof Spread,
    @InjectModel(Dream) private dreams: typeof Dream,
    @InjectModel(Report) private reports: typeof Report,
  ) {}

  private async profile(id: string) {
    const u = await this.users.findByPk(id)
    const where = { userId: id }
    const [readings, dreams, reports] = await Promise.all([this.spreads.count({ where }), this.dreams.count({ where }), this.reports.count({ where })])
    return {
      name: u.name,
      email: u.email,
      plan: u.plan,
      birthDate: u.birthDate,
      birthTime: u.birthTime,
      birthPlace: u.birthPlace,
      birthLat: u.birthLat,
      birthLon: u.birthLon,
      country: u.country,
      activity: { readings, dreams, reports },
    }
  }

  @ApiOperation({ summary: 'Профіль і лічильники активності (екран Profile)' })
  @ApiOkResponse({ description: '{ name, email, plan, birthDate, …, activity: { readings, dreams, reports } }' })
  @Get('profile')
  get(@CurrentUser() u: { id: string }) {
    return this.profile(u.id)
  }

  @ApiOperation({ summary: 'Змінити імʼя та дані народження' })
  @ApiOkResponse({ description: 'Оновлений профіль' })
  @Patch('profile')
  async update(@CurrentUser() u: { id: string }, @Body() dto: UpdateProfileDto) {
    await this.users.update({ ...dto, ...(dto.name ? { name: dto.name.trim() } : {}) }, { where: { id: u.id } })
    return this.profile(u.id)
  }

  @ApiOperation({ summary: 'Налаштування (екрани Settings і Profile)' })
  @ApiOkResponse({ description: 'Усі налаштування користувача' })
  @Get('settings')
  async settings(@CurrentUser() u: { id: string }) {
    return { ...DEFAULT_SETTINGS, ...(await this.users.findByPk(u.id)).settings }
  }

  @ApiOperation({ summary: 'Змінити налаштування', description: 'Змінює лише передані поля.' })
  @ApiOkResponse({ description: 'Усі налаштування після зміни' })
  @Patch('settings')
  async updateSettings(@CurrentUser() u: { id: string }, @Body() dto: UpdateSettingsDto) {
    const user = await this.users.findByPk(u.id)
    user.settings = { ...DEFAULT_SETTINGS, ...user.settings, ...dto }
    await user.save()
    return user.settings
  }
}

@Module({ imports: [SequelizeModule.forFeature([User, Spread, Dream, Report])], controllers: [ProfileController] })
export class ProfileModule {}
