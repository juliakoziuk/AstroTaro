import { UsageModule, UsageService } from '../plans/usage'
import { limitsOf, planOf, remainingOf, usageWindows } from '../plans/limits'
import { plans } from '../plans/plans'
import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Get, Headers, HttpCode, Logger, Module, OnModuleInit, Post, RawBodyRequest, Req, ServiceUnavailableException, UseGuards, BadGatewayException } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'
import { IsIn } from 'class-validator'
import { Request } from 'express'
import { Op } from 'sequelize'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { flagOn } from '../common/flags'
import { currentLocale } from '../i18n/locale'
import { msg } from '../i18n/messages'
import { User } from '../users/user.model'
import { stripeConfig, StripeConfig, stripeLocale, stripeMode, stripePost, stripeProblems, verifyStripeSignature } from './stripe'

const PAID = ['pro', 'premium'] as const
type PaidPlan = (typeof PAID)[number]
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Стани підписки, за яких платний доступ більше не належить людині. */
const ENDED = ['canceled', 'unpaid', 'incomplete_expired']

export class CheckoutDto {
  @ApiProperty({ enum: PAID }) @IsIn(PAID as unknown as string[]) plan: PaidPlan
}

const appUrl = () => (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')

/**
 * Оплата тарифів через Stripe Checkout (підписка). Тариф людині вмикає лише вебхук від Stripe з перевіреним підписом, а не
 * відповідь клієнта чи повернення на сторінку успіху. Налаштування: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
 * STRIPE_PRICE_PRO, STRIPE_PRICE_PREMIUM (див. .env.example); без них платні тарифи недоступні (або вмикаються без оплати
 * лише з ALLOW_DEMO_BILLING=true для розробки).
 */
@ApiTags('billing')
@Controller('billing')
export class BillingController implements OnModuleInit {
  private log = new Logger('Billing')

  /** Під час старту одним повідомленням: чи налаштовано Stripe, чого бракує, і що тоді станеться з платними тарифами. */
  onModuleInit() {
    const cfg = stripeConfig()
    const mode = stripeMode(cfg)
    const demo = flagOn(process.env.ALLOW_DEMO_BILLING)
    if (mode === 'ready') {
      this.log.log(`Stripe is configured (${cfg.secretKey!.includes('_live_') ? 'LIVE mode' : 'test mode'}), prices for pro and premium and the webhook secret are set. API: ${cfg.apiBase}`)
      if (demo) this.log.warn('ALLOW_DEMO_BILLING=true is ignored while Stripe is configured: paid plans are only bought through Stripe')
    } else if (mode === 'broken') {
      this.log.error(`Stripe is configured only PARTLY, so paid plans are refused (no demo fallback either):\n  - ${stripeProblems(cfg).join('\n  - ')}`)
    } else {
      this.log.warn(demo ? 'Stripe is not configured (nothing in .env): ALLOW_DEMO_BILLING=true, so paid plans are switched on WITHOUT payment' : 'Stripe is not configured: paid plans cannot be bought')
    }
  }

  constructor(@InjectModel(User) private users: typeof User, private usage: UsageService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async details(@CurrentUser() u: { id: string }) {
    const user = await this.users.findByPk(u.id)
    const plan = planOf(user.plan), limits = limitsOf(plan), usage = await this.usage.usageOf(u.id)
    const info = plans(currentLocale()).find((p) => p.id === plan)!
    const windows = usageWindows()
    return {
      plan, planName: info.name, price: info.price, interval: 'month',
      subscription: user.stripeSubscriptionId ? { status: user.subscriptionStatus, cancelAtPeriodEnd: user.cancelAtPeriodEnd, currentPeriodEnd: user.currentPeriodEnd } : null,
      limits, usage, remaining: remainingOf(limits, usage),
      resets: { readings: windows.readings.toISOString() },
      options: { canUpgradeTo: plan === 'free' ? ['pro', 'premium'] : plan === 'pro' ? ['premium'] : [], canManage: !!(user.stripeCustomerId && user.stripeSubscriptionId), needsPaymentFix: ['past_due', 'unpaid'].includes(user.subscriptionStatus ?? '') },
    }
  }

  private priceOf(cfg: StripeConfig, plan: PaidPlan) {
    return cfg.prices[plan]
  }

  @ApiOperation({
    summary: 'Оплатити тариф: створити сесію Stripe Checkout',
    description: 'Повертає { url }: на неї треба перенаправити людину. Тариф вмикається після оплати, коли Stripe надішле вебхук. Без налаштованого Stripe: 403 (або { activated: true } у демо-режимі).',
  })
  @ApiCreatedResponse({ description: '{ url } або, у демо-режимі без Stripe, { activated: true, plan }' })
  @ApiAuthed()
  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  async checkout(@CurrentUser() u: { id: string }, @Body() dto: CheckoutDto) {
    const cfg = stripeConfig()
    const user = await this.users.findByPk(u.id)
    if (user.stripeSubscriptionId) throw new ConflictException(msg(currentLocale(), 'billingAlreadySubscribed'))
    const mode = stripeMode(cfg)
    const price = this.priceOf(cfg, dto.plan)!
    this.log.log(`Checkout requested: user=${user.id} plan=${dto.plan} (Stripe: ${mode}, demo billing: ${flagOn(process.env.ALLOW_DEMO_BILLING)})`)
    if (mode === 'off') {
      if (!flagOn(process.env.ALLOW_DEMO_BILLING)) {
        this.log.warn('Checkout refused: Stripe is not configured and demo billing is off')
        throw new ForbiddenException(msg(currentLocale(), 'paymentUnavailable'))
      }
      this.log.warn(`DEMO: Stripe is not configured, so the plan "${dto.plan}" was activated for user ${user.id} WITHOUT payment`)
      await user.update({ plan: dto.plan })
      return { activated: true, plan: dto.plan }
    }
    if (mode === 'broken') {
      // платіж без секрету вебхука чи з хибною ціною: людина заплатила б, а тариф не ввімкнувся б
      this.log.error(`Checkout refused: Stripe is configured only partly:\n  - ${stripeProblems(cfg).join('\n  - ')}`)
      throw new ServiceUnavailableException(msg(currentLocale(), 'paymentUnavailable'))
    }
    try {
      // той самий ключ для того самого користувача, тарифу й мови протягом 10 хвилин: повторні кліки чи друга вкладка
      // отримують ту саму сесію Stripe, а не нову (інакше можна було б оформити дві підписки)
      const idempotencyKey = `checkout-${user.id}-${dto.plan}-${stripeLocale(currentLocale())}-${Math.floor(Date.now() / 600_000)}`
      const session = await stripePost<{ url: string }>(cfg, '/v1/checkout/sessions', {
        mode: 'subscription',
        line_items: [{ price, quantity: 1 }],
        success_url: `${appUrl()}/app.html#/pricing?checkout=success`,
        cancel_url: `${appUrl()}/app.html#/pricing?checkout=cancelled`,
        client_reference_id: user.id,
        ...(user.stripeCustomerId ? { customer: user.stripeCustomerId } : { customer_email: user.email }),
        locale: stripeLocale(currentLocale()),
        metadata: { userId: user.id, plan: dto.plan },
        subscription_data: { metadata: { userId: user.id, plan: dto.plan } },
      }, undefined, idempotencyKey)
      this.log.log(`Stripe Checkout session created for user=${user.id} plan=${dto.plan}: redirecting to Stripe`)
      return { url: session.url }
    } catch (e) {
      this.log.warn(`Stripe checkout failed: ${(e as Error).message}`)
      throw new BadGatewayException(msg(currentLocale(), 'upstreamDown', { name: 'Stripe' }))
    }
  }

  @ApiOperation({ summary: 'Керувати підпискою: сесія порталу Stripe (змінити картку чи тариф, скасувати)', description: 'Повертає { url } для перенаправлення. Потрібна вже оформлена підписка.' })
  @ApiCreatedResponse({ description: '{ url }' })
  @ApiAuthed()
  @UseGuards(JwtAuthGuard)
  @Post('portal')
  async portal(@CurrentUser() u: { id: string }) {
    const cfg = stripeConfig()
    const user = await this.users.findByPk(u.id)
    if (!user.stripeCustomerId) throw new BadRequestException(msg(currentLocale(), 'billingNoCustomer'))
    if (!cfg.secretKey) throw new ServiceUnavailableException(msg(currentLocale(), 'paymentUnavailable'))
    try {
      const session = await stripePost<{ url: string }>(cfg, '/v1/billing_portal/sessions', { customer: user.stripeCustomerId, return_url: `${appUrl()}/app.html#/pricing` })
      return { url: session.url }
    } catch (e) {
      this.log.warn(`Stripe portal failed: ${(e as Error).message}`)
      throw new BadGatewayException(msg(currentLocale(), 'upstreamDown', { name: 'Stripe' }))
    }
  }

  @ApiOperation({ summary: 'Вебхук Stripe (викликає лише Stripe)', description: 'Перевіряє підпис Stripe-Signature за сирим тілом; без правильного підпису — 400. Вмикає й вимикає платні тарифи.' })
  @ApiOkResponse({ description: '{ received: true }' })
  @ApiBadRequestResponse({ description: 'Підпис відсутній, хибний або прострочений' })
  @HttpCode(200)
  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature?: string) {
    const cfg = stripeConfig()
    const raw = req.rawBody
    const refuse = !cfg.webhookSecret ? 'STRIPE_WEBHOOK_SECRET is not set' : !raw ? 'no raw body (rawBody is off)' : !signature ? 'no Stripe-Signature header' : !verifyStripeSignature(raw, signature, cfg.webhookSecret) ? 'the signature does not match: STRIPE_WEBHOOK_SECRET must be the whsec_ that `stripe listen` printed (or of the dashboard endpoint), and the event must be fresh' : ''
    if (refuse) {
      this.log.warn(`Webhook refused (400): ${refuse}`)
      throw new BadRequestException('Invalid signature')
    }
    let event: { type?: string; created?: number; data?: { object?: any } }
    try {
      event = JSON.parse(raw.toString('utf8'))
    } catch {
      throw new BadRequestException('Invalid payload')
    }
    this.log.log(`Webhook received: ${event.type ?? 'unknown type'}`)
    await this.handle(event, cfg)
    return { received: true }
  }

  /**
   * Події повторюються й можуть прийти не по порядку. Тому кожна застосовується, лише якщо вона не старіша за останню вже
   * застосовану для цього користувача (billingEventAt, час події за годинником Stripe): повторна доставка давнього
   * checkout.session.completed після скасування підписки тариф не воскресить. Невідомий користувач чи подія — без помилки,
   * щоб Stripe не повторював її вічно.
   */
  private async handle(event: { type?: string; created?: number; data?: { object?: any } }, cfg: StripeConfig) {
    const obj = event.data?.object ?? {}
    const at = new Date(typeof event.created === 'number' ? event.created * 1000 : Date.now())
    const notNewer = { [Op.or]: [{ billingEventAt: null }, { billingEventAt: { [Op.lte]: at } }] }
    switch (event.type) {
      case 'checkout.session.completed': {
        const plan = PAID.find((p) => p === obj.metadata?.plan)
        const id = String(obj.client_reference_id ?? '')
        if (obj.mode !== 'subscription' || !['paid', 'no_payment_required'].includes(obj.payment_status) || !plan || !UUID.test(id)) {
          this.log.warn(`checkout.session.completed ignored: mode=${obj.mode} payment_status=${obj.payment_status} plan=${obj.metadata?.plan} client_reference_id valid=${UUID.test(id)}`)
          return
        }
        const user = await this.users.findOne({ where: { id, ...notNewer } })
        if (!user) {
          this.log.warn(`checkout.session.completed ignored: no user ${id}, or a newer billing event was already applied`)
          return
        }
        if (user.stripeSubscriptionId && obj.subscription && user.stripeSubscriptionId !== obj.subscription) {
          // друга оплата за вже діючою підпискою (дві вкладки, повтор): другу не підміняємо, її треба скасувати й повернути вручну
          this.log.error(`DUPLICATE subscription for user=${id}: ${obj.subscription} was paid while ${user.stripeSubscriptionId} is active. Kept the active one; cancel and refund ${obj.subscription} in Stripe`)
          return
        }
        await user.update({ plan, subscriptionStatus: 'active', stripeCustomerId: obj.customer ?? null, stripeSubscriptionId: obj.subscription ?? null, billingEventAt: at })
        this.log.log(`Plan "${plan}" turned on for user=${id} (subscription ${obj.subscription})`)
        return
      }
      case 'customer.subscription.deleted':
        await this.endSubscription(String(obj.id ?? ''), at, notNewer)
        return
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const id = String(obj.id ?? '')
        if (ENDED.includes(obj.status)) return this.endSubscription(id, at, notNewer)
        const price = obj.items?.data?.[0]?.price?.id
        const plan = PAID.find((p) => cfg.prices[p] && cfg.prices[p] === price)
        if (id) {
          const [changed] = await this.users.update({ ...(plan && obj.status === 'active' ? { plan } : {}), subscriptionStatus: obj.status ?? null, cancelAtPeriodEnd: !!obj.cancel_at_period_end, currentPeriodEnd: typeof (obj.current_period_end ?? obj.items?.data?.[0]?.current_period_end) === 'number' ? new Date((obj.current_period_end ?? obj.items.data[0].current_period_end) * 1000) : null, billingEventAt: at }, { where: { stripeSubscriptionId: id, ...notNewer } })
          this.log.log(changed ? `Subscription ${id} moved to plan "${plan}"` : `customer.subscription.updated: no user has subscription ${id}, or the event is older than the last one applied`)
        }
        return
      }
      default:
    }
  }

  private async endSubscription(subscriptionId: string, at: Date, notNewer: object) {
    if (!subscriptionId) return
    const [changed] = await this.users.update({ plan: 'free', stripeSubscriptionId: null, subscriptionStatus: null, cancelAtPeriodEnd: false, currentPeriodEnd: null, billingEventAt: at }, { where: { stripeSubscriptionId: subscriptionId, ...notNewer } })
    this.log.log(changed ? `Subscription ${subscriptionId} ended: the plan is back to free` : `Subscription ${subscriptionId} ended: no user has it (or the event is old), nothing changed`)
  }
}

@Module({ imports: [UsageModule, SequelizeModule.forFeature([User])], controllers: [BillingController] })
export class BillingModule {}

