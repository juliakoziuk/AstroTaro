// Екран Pricing: тарифи з сервера (GET /plans), кнопки вибору, повернення зі сторінки оплати Stripe.
import { getToken } from '../../lib/api.js'
import { t, useLang } from '../../i18n/index.js'
import AppPage from '../AppPage.jsx'
import { usePage } from '../usePage.js'
import { LoadError, Loading } from './parts.jsx'
import { choosePlan, loadPricing, openPortal } from './pricing.js'

export default function PricingPage() {
  useLang()
  const page = usePage(loadPricing)
  const { ctx } = page
  const d = page.data
  const guest = !getToken()

  return (
    <AppPage title={t('Choose your plan')} subtitle={t('Unlock the full MYSTIQ experience')}>
      <LoadError page={page} />
      {!d && page.status === 'loading' && <Loading />}
      {d && (
        <>
          <div className="ap-plans">
            {d.plans.map((plan, i) => {
              const current = !guest && plan.id === d.current
              return (
                <section key={plan.id} className={`ap-plan${i === 1 ? ' hot' : ''}${current ? ' current' : ''}`} aria-label={plan.name}>
                  <h2>{plan.name}</h2>
                  <span className="tag">{plan.tagline}</span>
                  <div className="price">${plan.price}<small> {t('/mo')}</small></div>
                  <ul>{plan.features.map((f) => <li key={f}>{f}</li>)}</ul>
                  {current ? (
                    <span className="ap-btn wide" aria-current="true">{t('Your plan')}</span>
                  ) : (
                    <button type="button" className={`ap-btn wide${i === 1 ? ' primary' : ''}`} onClick={() => ctx.run(() => choosePlan(plan, d, ctx))}>
                      {t(['Get Started', 'Upgrade', 'Choose'][i] ?? 'Choose')}
                    </button>
                  )}
                </section>
              )
            })}
          </div>
          {/* підписку змінюють чи скасовують у порталі Stripe: звичайний запит тарифу її не змінює */}
          {d.subscribed && (
            <div className="ap-actions" style={{ justifyContent: 'center' }}>
              <button type="button" className="ap-btn primary" onClick={() => ctx.run(openPortal)}>{t('Manage subscription')}</button>
            </div>
          )}
        </>
      )}
    </AppPage>
  )
}
