import { Body, Controller, ForbiddenException, Get, Module, Post, UseGuards } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiBody, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'
import { IsIn } from 'class-validator'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { flagOn } from '../common/flags'
import { currentLocale, Locale, LOCALES } from '../i18n/locale'
import { msg } from '../i18n/messages'
import { stripeConfig, stripeMode } from '../billing/stripe'
import { User } from '../users/user.model'

export const PLAN_IDS = ['free', 'pro', 'premium'] as const
export type PlanId = (typeof PLAN_IDS)[number]

type T2 = [string, string]
const at = (t: T2, l: Locale) => t[LOCALES.indexOf(l)]

// Довідкові дані про тарифи (екран Pricing); id та ціна однакові в усіх мовах
const PLAN_TEXT: { id: PlanId; price: number; name: T2; tagline: T2; features: T2[]; cta: T2 }[] = [
  {
    id: 'free', price: 0, name: ['Free', 'Безкоштовний'], tagline: ['Basic access', 'Базовий доступ'], cta: ['Get Started', 'Почати'],
    features: [['Limited readings', 'Обмежена кількість розкладів'], ['Basic insights', 'Базові інсайти'], ['Daily tarot card', 'Щоденна карта таро']],
  },
  {
    id: 'pro', price: 5, name: ['Pro', 'Pro'], tagline: ['Most popular', 'Найпопулярніший'], cta: ['Upgrade', 'Оновити'],
    features: [['Unlimited readings', 'Необмежені розклади'], ['Full astrology', 'Повна астрологія'], ['Dream analysis', 'Аналіз снів'], ['AI Companion', 'AI-компаньйон']],
  },
  {
    id: 'premium', price: 10, name: ['Premium', 'Premium'], tagline: ['For deep explorers', 'Для глибоких дослідників'], cta: ['Choose', 'Обрати'],
    features: [['Everything in Pro', 'Усе з Pro'], ['Priority access', 'Пріоритетний доступ'], ['Advanced reports', 'Розширені звіти'], ['Early features', 'Ранній доступ до новинок']],
  },
]

export const plans = (locale: Locale) =>
  PLAN_TEXT.map((p) => ({ id: p.id, price: p.price, name: at(p.name, locale), tagline: at(p.tagline, locale), features: p.features.map((f) => at(f, locale)), cta: at(p.cta, locale) }))

/** Без підключеної оплати платний тариф не можна вмикати самому: безкоштовний — завжди, платні — лише в демо-режимі. */
export const canChoosePlan = (plan: PlanId, demoBilling: boolean) => plan === 'free' || demoBilling

export class PlanDto {
  @ApiProperty({ enum: PLAN_IDS }) @IsIn(PLAN_IDS as unknown as string[]) plan: PlanId
}

@ApiTags('plans')
@Controller()
export class PlansController {
  constructor(
    @InjectModel(User) private users: typeof User,
    private config: ConfigService,
  ) {}

  @ApiOperation({ summary: 'Тарифи (публічно), мовою з заголовка Accept-Language' })
  @ApiOkResponse({ description: 'Список тарифів з цінами й можливостями' })
  @Get('plans')
  list() {
    return plans(currentLocale())
  }

  @ApiOperation({
    summary: 'Обрати тариф',
    description: 'Безкоштовний тариф обирається вільно. Платні купуються через /billing/checkout; без жодних налаштувань Stripe їх можна вмикати без оплати лише з ALLOW_DEMO_BILLING=true (для розробки).',
  })
  @ApiBody({ type: PlanDto })
  @ApiOkResponse({ description: 'Поточний тариф' })
  @ApiAuthed()
  @UseGuards(JwtAuthGuard)
  @Post('billing/plan')
  async choose(@CurrentUser() u: { id: string }, @Body() dto: PlanDto) {
    if ((await this.users.findByPk(u.id)).stripeSubscriptionId) throw new ForbiddenException(msg(currentLocale(), 'billingManageInPortal'))
    // демо-режим лише поки про Stripe в .env немає нічого; інакше платний тариф купується тільки через Stripe
    const demo = flagOn(this.config.get('ALLOW_DEMO_BILLING')) && stripeMode(stripeConfig()) === 'off'
    if (!canChoosePlan(dto.plan, demo)) throw new ForbiddenException(msg(currentLocale(), 'paymentUnavailable'))
    await this.users.update({ plan: dto.plan }, { where: { id: u.id } })
    return { plan: dto.plan }
  }
}

@Module({ imports: [SequelizeModule.forFeature([User])], controllers: [PlansController] })
export class PlansModule {}
