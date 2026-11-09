import { useEffect, useRef, useState } from 'react'
import { get, post } from '../../lib/api.js'
import { t, useLang } from '../../i18n/index.js'
import { formatDate } from '../format.js'

// Вкладка «Billing» у налаштуваннях: тариф і статус підписки, скільки вже використано, що входить у тариф та дії,
// доречні саме цьому стану (безкоштовний, підписка, скасовується, проблема з оплатою, демо). Дані — GET /billing.

const PLAN_NAMES = { free: 'Free', pro: 'Pro', premium: 'Premium' }
const MODE_NAMES = { quick: 'Quick readings', detailed: 'Detailed readings', depth: 'Depth readings' }
const RANGE_NAMES = { day: 'Forecast for today', week: 'Forecast for the week', month: 'Forecast for the month' }

/** Один показник: «2 з 5» з шкалою або «Необмежено» без неї; на 100 % шкала попереджає. */
function Meter({ id, label, used, max, resets, fmt }) {
  if (max === null) {
    return (
      <div className="billing-meter">
        <div className="billing-meter-head"><span id={id}>{label}</span><b>{t('Unlimited')}</b></div>
      </div>
    )
  }
  const percent = Math.min(100, Math.round((used / max) * 100))
  const full = used >= max
  return (
    <div className={`billing-meter${full ? ' full' : ''}`}>
      <div className="billing-meter-head">
        <span id={id}>{label}</span>
        <b>{t('{used} of {max}', { used, max })}</b>
      </div>
      <div className="billing-bar" role="progressbar" aria-labelledby={id} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(used, max)}>
        <i style={{ width: `${percent}%` }} />
      </div>
      {resets && <small>{t('Resets {date}', { date: formatDate(resets, fmt) })}</small>}
      {full && <p className="billing-hint">{t('You have used all of it. See plans to get more.')}</p>}
    </div>
  )
}

const Included = ({ yes, children }) => (
  <li className={yes ? 'yes' : 'no'}>
    <span aria-hidden="true">{yes ? '✓' : '–'}</span>
    <span className="sr-only">{yes ? t('Included') : t('Not included')}: </span>
    {children}
  </li>
)

export function BillingPanel({ ctx }) {
  const lang = useLang()
  const [state, setState] = useState({ status: 'loading' })
  const [portalError, setPortalError] = useState('')
  const [opening, setOpening] = useState(false)
  const lock = useRef(false)
  const fmt = ctx.data?.settings?.dateFormat

  useEffect(() => {
    let live = true
    get('/billing').then(
      (data) => live && setState({ status: 'ok', data }),
      (e) => live && setState({ status: 'error', error: e.message }),
    )
    return () => {
      live = false
    }
  }, [lang])

  const openPortal = async () => {
    if (lock.current) return
    lock.current = true
    setOpening(true)
    setPortalError('')
    try {
      const { url } = await post('/billing/portal')
      if (!url) throw new Error(t('The payment page could not be opened. Try again in a moment.'))
      window.location.assign(url)
    } catch (e) {
      setPortalError(e.message)
    } finally {
      lock.current = false
      setOpening(false)
    }
  }

  if (state.status === 'loading') return <p>{t('Loading…')}</p>
  if (state.status === 'error') return <p className="settings-error" role="alert">{state.error}</p>

  const b = state.data
  const sub = b.subscription
  const planName = t(PLAN_NAMES[b.plan] ?? b.planName)
  const demo = b.plan !== 'free' && !sub
  const canceling = !!sub?.cancelAtPeriodEnd
  const until = sub?.currentPeriodEnd ? formatDate(sub.currentPeriodEnd, fmt) : ''

  let badge = { tone: 'free', text: t('Free') }
  if (b.options.needsPaymentFix) badge = { tone: 'problem', text: t('Payment problem') }
  else if (canceling) badge = { tone: 'ending', text: until ? t('Cancels on {date}', { date: until }) : t('Cancels at the end of the period') }
  else if (sub) badge = { tone: 'active', text: t('Active') }
  else if (demo) badge = { tone: 'demo', text: t('Demo') }

  return (
    <div className="billing">
      <div className="billing-card" aria-label={t('Current plan')}>
        <div>
          <h3>{planName}</h3>
          <p className="billing-price">{b.price > 0 ? t('${price} per month', { price: b.price }) : t('Free forever')}</p>
        </div>
        <span className={`billing-badge ${badge.tone}`}>{badge.text}</span>
        {sub && until && !canceling && <p className="billing-line">{t('Renews on {date}', { date: until })}</p>}
        {sub && until && canceling && <p className="billing-line">{t('Access until {date}', { date: until })}</p>}
      </div>

      {b.options.needsPaymentFix && (
        <div className="billing-warning" role="alert">
          <p>{t('We could not charge your card. Update the payment method to keep {plan}.', { plan: planName })}</p>
        </div>
      )}
      {demo && <p className="settings-note">{t('This plan was switched on in demo mode, without payment.')}</p>}

      <h3 className="billing-title">{t('Usage')}</h3>
      <Meter id="meter-readings" label={t('Readings this month')} used={b.usage.readingsThisMonth} max={b.limits.readingsPerMonth} resets={b.resets.readings} fmt={fmt} />
      <Meter id="meter-dreams" label={t('Dreams kept')} used={b.usage.dreamsTotal} max={b.limits.dreamsTotal} />
      <Meter id="meter-ai" label={t('AI messages today')} used={b.usage.aiMessagesToday} max={b.limits.aiMessagesPerDay} resets={b.resets.aiMessages} fmt={fmt} />

      <h3 className="billing-title">{t('What your plan includes')}</h3>
      <ul className="billing-includes">
        {['quick', 'detailed', 'depth'].map((mode) => <Included key={mode} yes={b.limits.readingModes.includes(mode)}>{t(MODE_NAMES[mode])}</Included>)}
        {['day', 'week', 'month'].map((range) => <Included key={range} yes={b.limits.forecastRanges.includes(range)}>{t(RANGE_NAMES[range])}</Included>)}
        <Included yes={b.limits.compatibility}>{t('Compatibility')}</Included>
        <Included yes={b.limits.fullReports}>{t('Full astrology reports')}</Included>
      </ul>

      <div className="billing-actions">
        {b.plan === 'free' && <button type="button" className="selected" onClick={() => ctx.go('/pricing')}>{t('Upgrade')}</button>}
        {b.options.canManage && <button type="button" className="selected" disabled={opening} onClick={openPortal}>{t('Manage subscription, payment method and invoices')}</button>}
        {b.options.canManage && b.options.canUpgradeTo.length > 0 && <button type="button" onClick={() => ctx.go('/pricing')}>{t('See plans')}</button>}
      </div>
      {portalError && <p className="settings-error" role="alert">{portalError}</p>}
    </div>
  )
}
