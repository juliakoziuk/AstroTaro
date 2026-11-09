import { BadRequestException, Body, ConflictException, Controller, ForbiddenException, Headers, HttpCode, Logger, Module, OnModuleInit, Post, RawBodyRequest, Req, ServiceUnavailableException, UseGuards, BadGatewayException } from '@nestjs/common'
import { InjectModel, SequelizeModule } from '@nestjs/sequelize'
import { ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger'
import { IsIn } from 'class-validator'
import { Request } from 'express'
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard'
import { ApiAuthed } from '../common/api-docs'
import { flagOn } from '../common/flags'
import { currentLocale } from '../i18n/locale'
import { msg } from '../i18n/messages'
import { User } from '../users/user.model'
import { stripeConfig, StripeConfig, stripeLocale, stripePost, stripeProblems, verifyStripeSignature } from './stripe'

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
    const problems = stripeProblems(cfg)
    const demo = flagOn(process.env.ALLOW_DEMO_BILLING)
    if (!problems.length) {
      this.log.log(`Stripe is configured (${cfg.secretKey!.includes('_live_') ? 'LIVE mode' : 'test mode'}), prices for pro and premium and the webhook secret are set. API: ${cfg.apiBase}`)
      return
    }
    this.log.warn(`Stripe is NOT fully configured:\n  - ${problems.join('\n  - ')}`)
    this.log.warn(demo ? 'ALLOW_DEMO_BILLING=true: paid plans are activated WITHOUT payment until the secret key and both prices are valid' : 'Paid plans cannot be bought until Stripe is configured')
  }

  constructor(@InjectModel(User) private users: typeof User) {}

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
    const price = this.priceOf(cfg, dto.plan)
    this.log.log(`Checkout requested: user=${user.id} plan=${dto.plan} (secret key set: ${!!cfg.secretKey}, price set: ${!!price}, demo billing: ${flagOn(process.env.ALLOW_DEMO_BILLING)})`)
    if (!cfg.secretKey || !price) {
      if (!flagOn(process.env.ALLOW_DEMO_BILLING)) {
        this.log.warn(`Checkout refused: Stripe is not configured and demo billing is off`)
        throw new ForbiddenException(msg(currentLocale(), 'paymentUnavailable'))
      }
      this.log.warn(`DEMO: Stripe is not configured (${stripeProblems(cfg).join('; ')}), so the plan "${dto.plan}" was activated for user ${user.id} WITHOUT payment`)
      await user.update({ plan: dto.plan })
      return { activated: true, plan: dto.plan }
    }
    try {
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
      })
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
    let event: { type?: string; data?: { object?: any } }
    try {
      event = JSON.parse(raw.toString('utf8'))
    } catch {
      throw new BadRequestException('Invalid payload')
    }
    this.log.log(`Webhook received: ${event.type ?? 'unknown type'}`)
    await this.handle(event, cfg)
    return { received: true }
  }

  /** Події повторюються й можуть прийти не по порядку: кожна просто виставляє стан, тож повтор нічого не псує. Невідомий користувач чи подія — без помилки, щоб Stripe не повторював її вічно. */
  private async handle(event: { type?: string; data?: { object?: any } }, cfg: StripeConfig) {
    const obj = event.data?.object ?? {}
    switch (event.type) {
      case 'checkout.session.completed': {
        const plan = PAID.find((p) => p === obj.metadata?.plan)
        const id = String(obj.client_reference_id ?? '')
        if (obj.mode !== 'subscription' || !['paid', 'no_payment_required'].includes(obj.payment_status) || !plan || !UUID.test(id)) {
          this.log.warn(`checkout.session.completed ignored: mode=${obj.mode} payment_status=${obj.payment_status} plan=${obj.metadata?.plan} client_reference_id valid=${UUID.test(id)}`)
          return
        }
        const [changed] = await this.users.update({ plan, stripeCustomerId: obj.customer ?? null, stripeSubscriptionId: obj.subscription ?? null }, { where: { id } })
        this.log.log(changed ? `Plan "${plan}" turned on for user=${id} (subscription ${obj.subscription})` : `checkout.session.completed: no user with id ${id}, nothing changed`)
        return
      }
      case 'customer.subscription.deleted':
        await this.endSubscription(String(obj.id ?? ''))
        return
      case 'customer.subscription.updated': {
        const id = String(obj.id ?? '')
        if (ENDED.includes(obj.status)) return this.endSubscription(id)
        const price = obj.items?.data?.[0]?.price?.id
        const plan = PAID.find((p) => cfg.prices[p] && cfg.prices[p] === price)
        if (plan && obj.status === 'active') await this.users.update({ plan }, { where: { stripeSubscriptionId: id } })
        return
      }
      default:
    }
  }

  private async endSubscription(subscriptionId: string) {
    if (!subscriptionId) return
    const [changed] = await this.users.update({ plan: 'free', stripeSubscriptionId: null }, { where: { stripeSubscriptionId: subscriptionId } })
    this.log.log(changed ? `Subscription ${subscriptionId} ended: the plan is back to free` : `Subscription ${subscriptionId} ended: no user has it, nothing changed`)
  }
}

@Module({ imports: [SequelizeModule.forFeature([User])], controllers: [BillingController] })
export class BillingModule {}

