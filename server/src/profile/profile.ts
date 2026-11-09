import { Body, Controller, Get, Module, Patch, Post, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiOkResponse, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger'
import { IsBoolean, IsDateString, IsIn, IsLatitude, IsLongitude, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { jsonbMerge } from '../common/jsonb'
import { Dream } from '../dreams/dream.model'
import { Report } from '../astrology/astrology'
import { Spread } from '../spreads/spread.model'
import { DEFAULT_SETTINGS, SETTING_OPTIONS, withDefaults } from '../users/settings'
import { User } from '../users/user.model'
import { JournalEntry } from '../journal/journal.model'
import { Message } from '../messages/message.model'

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
    @InjectModel(JournalEntry) private journal: typeof JournalEntry,
    @InjectModel(Message) private messages: typeof Message,
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
    return withDefaults((await this.users.findByPk(u.id)).settings)
  }

  @ApiOperation({ summary: 'Змінити налаштування', description: 'Змінює лише передані поля.' })
  @ApiOkResponse({ description: 'Усі налаштування після зміни' })
  @Patch('settings')
  async updateSettings(@CurrentUser() u: { id: string }, @Body() dto: UpdateSettingsDto) {
    // злиття робить база, а не код: одночасні запити не затирають зміни один одного
    await this.users.update({ settings: jsonbMerge(this.users.sequelize, 'settings', dto) }, { where: { id: u.id } })
    return withDefaults((await this.users.findByPk(u.id)).settings)
  }

  @ApiOperation({ summary: 'Експорт усіх власних даних без пароля й токенів' })
  @Get('profile/export')
  async exportData(@CurrentUser() u: { id: string }) {
    const user = await this.users.findByPk(u.id)
    const where = { userId: u.id }
    const [spreads, dreams, journal, reports, messages] = await Promise.all([
      this.spreads.findAll({ where }), this.dreams.findAll({ where }), this.journal.findAll({ where }),
      this.reports.findAll({ where }), this.messages.findAll({ where }),
    ])
    return {
      exportedAt: new Date().toISOString(), schemaVersion: 1,
      profile: { name: user.name, email: user.email, plan: user.plan, birthDate: user.birthDate,
        birthTime: user.birthTime, birthPlace: user.birthPlace, birthLat: user.birthLat, birthLon: user.birthLon, country: user.country },
      settings: withDefaults(user.settings), consent: user.consent,
      spreads, dreams, journal, reports, messages,
    }
  }

  @ApiOperation({ summary: 'Скинути лише налаштування, зберегти записи та згоди AI' })
  @Post('settings/reset')
  async resetSettings(@CurrentUser() u: { id: string }) {
    const user = await this.users.findByPk(u.id)
    user.settings = { ...DEFAULT_SETTINGS }
    await user.save()
    return user.settings
  }
}

@Module({ imports: [SequelizeModule.forFeature([User, Spread, Dream, Report, JournalEntry, Message])], controllers: [ProfileController] })
export class ProfileModule {}
