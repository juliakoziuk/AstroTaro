// Логіка екрана тарифів: завантаження, повернення зі Stripe, дія кнопки тарифу.
import { get, getToken, post } from '../../lib/api.js'
import { hashParam } from '../../lib/hashParam.js'
import { t } from '../../i18n/index.js'
import { say } from '../toast.js'

export async function openPortal() {
  const { url } = await post('/billing/portal')
  if (!url) throw new Error(t('The payment page could not be opened. Try again in a moment.'))
  window.location.assign(url)
}

const CONFIRM_TRIES = 12
const CONFIRM_EVERY_MS = 2500
/** Після повернення зі Stripe чекає, поки вебхук ввімкне платний тариф, і чесно каже, що відбулося. */
async function confirmPayment() {
  say(t('Back from the payment page. Waiting for the confirmation…'))
  for (let i = 0; i < CONFIRM_TRIES; i++) {
    await new Promise((r) => setTimeout(r, CONFIRM_EVERY_MS))
    const plan = await get('/profile').then((p) => p.plan, () => 'free')
    if (plan !== 'free') return say(t('Payment confirmed: your plan is {name}.', { name: plan }))
  }
  say(t('The payment is not confirmed yet. If you paid, check again in a minute; if not, nothing was charged.'))
}

export async function loadPricing() {
  const plans = await get('/plans')
  // повернення зі сторінки оплати: адреса з ?checkout=success нічого не доводить, а тариф вмикає вебхук і з затримкою,
  // тож не кажемо «оплачено», а чекаємо, поки сервер справді покаже платний тариф
  if (hashParam('checkout') === 'success') confirmPayment()
  if (hashParam('checkout') === 'cancelled') say(t('Payment was cancelled. Nothing was charged.'))
  if (hashParam('checkout')) window.history.replaceState(window.history.state, '', '#/pricing') // щоб оновлення сторінки не повторювало
  const billing = getToken() ? await get('/billing').catch(() => null) : null
  return { plans, subscribed: !!billing?.options?.canManage, current: billing?.plan ?? null } // підписка, якою керують лише в порталі Stripe
}

/** Що робить кнопка тарифу; `ctx` — { go, say }. Кидає помилку з повідомленням, яке бачить людина. */
export async function choosePlan(plan, data, ctx) {
  if (!getToken()) return ctx.go('/register')
  if (!plan) throw new Error(t('Data is still loading'))
  if (plan.id === data.current) return ctx.say(t('This is your current plan.'))
  // з активною підпискою змінити чи скасувати тариф можна лише в порталі Stripe (checkout відповів би 409)
  if (data.subscribed) return openPortal()
  if (plan.price > 0) {
    // платний тариф: сервер створює сесію оплати Stripe й повертає адресу; тариф вмикається вебхуком після оплати.
    // Без підключеної оплати в демо-режимі сервер вмикає тариф одразу й адреси не дає.
    const res = await post('/billing/checkout', { plan: plan.id })
    if (res?.url) return window.location.assign(res.url)
    // без url іти на головну можна лише коли сервер прямо підтвердив демо-активацію (без оплати); будь-яка інша відповідь — помилка
    if (res?.activated === true && res?.plan === plan.id) {
      ctx.say(t('Demo mode: {name} was switched on without payment, because Stripe is not set up on the server.', { name: plan.name }))
      return ctx.go('/dashboard')
    }
    throw new Error(t('The payment page could not be opened. Try again in a moment.'))
  }
  await post('/billing/plan', { plan: plan.id })
  ctx.say(t('Plan: {name}', { name: plan.name }))
  ctx.go('/dashboard')
}

