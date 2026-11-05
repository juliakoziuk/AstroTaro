import { Body, Controller, Get, Module, Post, UseGuards } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiBody, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'
import { IsIn } from 'class-validator'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { currentLocale, Locale, LOCALES } from '../i18n/locale'
import { User } from '../users/user.model'

export const PLAN_IDS = ['free', 'pro', 'premium'] as const
export type PlanId = (typeof PLAN_IDS)[number]

type T3 = [string, string, string]
const at = (t: T3, l: Locale) => t[LOCALES.indexOf(l)]

// Довідкові дані про тарифи (екран Pricing); id та ціна однакові в усіх мовах
const PLAN_TEXT: { id: PlanId; price: number; name: T3; tagline: T3; features: T3[]; cta: T3 }[] = [
  {
    id: 'free', price: 0, name: ['Free', 'Безкоштовний', 'Gratis'], tagline: ['Basic access', 'Базовий доступ', 'Acceso básico'], cta: ['Get Started', 'Почати', 'Empezar'],
    features: [['Limited readings', 'Обмежена кількість розкладів', 'Lecturas limitadas'], ['Basic insights', 'Базові інсайти', 'Perspectivas básicas'], ['Daily tarot card', 'Щоденна карта таро', 'Carta de tarot diaria']],
  },
  {
    id: 'pro', price: 9.99, name: ['Pro', 'Pro', 'Pro'], tagline: ['Most popular', 'Найпопулярніший', 'Más popular'], cta: ['Upgrade', 'Оновити', 'Mejorar'],
    features: [['Unlimited readings', 'Необмежені розклади', 'Lecturas ilimitadas'], ['Full astrology', 'Повна астрологія', 'Astrología completa'], ['Dream analysis', 'Аналіз снів', 'Análisis de sueños'], ['AI Companion', 'AI-компаньйон', 'Compañero IA']],
  },
  {
    id: 'premium', price: 19.99, name: ['Premium', 'Premium', 'Premium'], tagline: ['For deep explorers', 'Для глибоких дослідників', 'Para exploradores profundos'], cta: ['Choose', 'Обрати', 'Elegir'],
    features: [['Everything in Pro', 'Усе з Pro', 'Todo lo de Pro'], ['Priority access', 'Пріоритетний доступ', 'Acceso prioritario'], ['Advanced reports', 'Розширені звіти', 'Informes avanzados'], ['Early features', 'Ранній доступ до новинок', 'Funciones anticipadas']],
  },
]

export const plans = (locale: Locale) =>
  PLAN_TEXT.map((p) => ({ id: p.id, price: p.price, name: at(p.name, locale), tagline: at(p.tagline, locale), features: p.features.map((f) => at(f, locale)), cta: at(p.cta, locale) }))

export class PlanDto {
  @ApiProperty({ enum: PLAN_IDS }) @IsIn(PLAN_IDS as unknown as string[]) plan: PlanId
}

@ApiTags('plans')
@Controller()
export class PlansController {
  constructor(@InjectModel(User) private users: typeof User) {}

  @ApiOperation({ summary: 'Тарифи (публічно), мовою з заголовка Accept-Language' })
  @ApiOkResponse({ description: 'Список тарифів з цінами й можливостями' })
  @Get('plans')
  list() {
    return plans(currentLocale())
  }

  @ApiOperation({ summary: 'Обрати тариф', description: 'Платіжної системи поки немає: тариф просто записується користувачу.' })
  @ApiBody({ type: PlanDto })
  @ApiOkResponse({ description: 'Поточний тариф' })
  @ApiAuthed()
  @UseGuards(JwtAuthGuard)
  @Post('billing/plan')
  async choose(@CurrentUser() u: { id: string }, @Body() dto: PlanDto) {
    await this.users.update({ plan: dto.plan }, { where: { id: u.id } })
    return { plan: dto.plan }
  }
}

@Module({ imports: [SequelizeModule.forFeature([User])], controllers: [PlansController] })
export class PlansModule {}
