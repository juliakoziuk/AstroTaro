import { useEffect, useRef, useState } from 'react'
import { get } from '../lib/api.js'
import { t, useLang } from '../i18n/index.js'
import { navProps } from './router.js'
import { ASPECT_GLYPHS, PLANET_GLYPHS } from './live/zodiacWheel.constants.js'

// Особистий прогноз: транзити до натальної карти користувача на сьогодні, тиждень і місяць (GET /astrology/forecast).
const TABS = [['today', 'Today'], ['week', 'Week'], ['month', 'Month']]
const DATE_LOCALES = { uk: 'uk-UA', en: 'en-GB' }
const GOOD_FROM = 65 // як на сервері: від 65 — сприятливо, до 35 — вимогливо
const HARD_UNTIL = 35
const MS_PER_MINUTE = 60 * 1000

const toneOfScore = (score) => (score >= GOOD_FROM ? 'good' : score <= HARD_UNTIL ? 'hard' : 'mixed')
/** «Сьогодні» за місцевим часом користувача (а не UTC): сервер рахує день від цієї дати. */
const localToday = () => new Date(Date.now() - new Date().getTimezoneOffset() * MS_PER_MINUTE).toISOString().slice(0, 10)
const dayLabel = (iso, lang) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(DATE_LOCALES[lang] ?? 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })

function Bars({ spheres, texts = false }) {
  return (
    <ul className="fc-bars">
      {spheres.map((s) => (
        <li key={s.id} className={`tone-${toneOfScore(s.score)}`}>
          <span>{s.name}</span>
          <div className="fc-bar" role="img" aria-label={`${s.name}: ${s.score}%`}><div style={{ width: `${s.score}%` }} /></div>
          <b>{s.score}%</b>
          {texts && <p>{s.text}</p>}
        </li>
      ))}
    </ul>
  )
}

/** Один транзит: «планета в небі — аспект — твоя натальна планета» і пояснення. */
function Hit({ h, when }) {
  return (
    <li className={`fc-hit tone-${h.tone}`}>
      <div>
        <b>{PLANET_GLYPHS[h.transit.id]} {h.transit.name}</b>
        <i title={`${h.typeName}, ${t('orb')} ${h.orb}°`}>{ASPECT_GLYPHS[h.type]}</i>
        <b>{PLANET_GLYPHS[h.natal.id]} {h.natal.name}</b>
        <small>{h.typeName}{when ? ` · ${when}` : ''}</small>
      </div>
      <p>{h.meaning}</p>
    </li>
  )
}

function Events({ events, lang }) {
  if (!events.length) return <p className="muted">{t('No tight transits to your chart in this period.')}</p>
  return (
    <ul className="fc-list">
      {events.map((e) => (
        <Hit key={`${e.transit.id}-${e.natal.id}-${e.type}`} h={e} when={e.from === e.to ? dayLabel(e.exact, lang) : `${t('exact')} ${dayLabel(e.exact, lang)}`} />
      ))}
    </ul>
  )
}

function MoonEvents({ events, lang }) {
  if (!events.length) return null
  return (
    <>
      <h3>{t('New and full moons')}</h3>
      <ul className="fc-list">
        {events.map((m) => (
          <li key={m.date} className={`fc-hit tone-${m.aspect?.tone ?? 'mixed'}`}>
            <div>
              <b>{m.id === 'New Moon' ? '●' : '○'} {m.name}</b>
              <small>{dayLabel(m.date, lang)} · {m.signName}</small>
            </div>
            {m.aspect && <p>{ASPECT_GLYPHS[m.aspect.type]} {m.aspect.typeName}: {PLANET_GLYPHS[m.aspect.natal.id]} {m.aspect.natal.name}. {m.aspect.meaning}</p>}
          </li>
        ))}
      </ul>
    </>
  )
}

function DayChips({ title, dates, days, lang }) {
  return (
    <div className="fc-chips">
      <h3>{title}</h3>
      {dates.map((d) => {
        const score = days.find((x) => x.date === d)?.overall ?? 0
        return <span key={d} className={`tone-${toneOfScore(score)}`}>{dayLabel(d, lang)} · {score}%</span>
      })}
    </div>
  )
}

function Score({ value, label }) {
  return (
    <div className={`fc-score tone-${toneOfScore(value)}`}>
      <b>{value}<small>%</small></b>
      <span>{label}</span>
    </div>
  )
}

function Today({ day }) {
  return (
    <>
      <Score value={day.overall} label={day.headline} />
      <p className="fc-moon">☽ {t('Moon')}: {day.moon.signName} · {day.moon.phase}</p>
      <Bars spheres={day.spheres} texts />
      <p className="fc-focus">
        <span className="tone-good">{t('Best for')}: {day.best.name}</span>
        <span className="tone-hard">{t('Take extra care with')}: {day.careful.name}</span>
      </p>
      <h3>{t('Key transits today')}</h3>
      <p className="muted">{t('Planets in the sky today meet the planets of your natal chart.')}</p>
      {day.aspects.length ? <ul className="fc-list">{day.aspects.map((h) => <Hit key={`${h.transit.id}-${h.natal.id}-${h.type}`} h={h} />)}</ul> : <p className="muted">{t('No tight transits to your chart today: a quiet background.')}</p>}
    </>
  )
}

/** Тиждень або місяць: оцінка періоду, смужка днів (висота й колір — оцінка дня), сфери, найкращі й складні дні, транзити й фази Місяця. */
function Period({ p, lang, long }) {
  return (
    <>
      <Score value={p.overall} label={p.headline} />
      <div className={`fc-strip${long ? ' long' : ''}`} role="list">
        {p.days.map((d) => (
          <div key={d.date} role="listitem" className={`fc-day tone-${toneOfScore(d.overall)}`} title={`${dayLabel(d.date, lang)}: ${d.overall}%`}>
            <div className="fc-day-bar"><i style={{ height: `${d.overall}%` }} /></div>
            {!long && <b>{d.overall}</b>}
            <small>{long ? new Date(`${d.date}T12:00:00Z`).getUTCDate() : dayLabel(d.date, lang)}</small>
          </div>
        ))}
      </div>
      <DayChips title={t('Best days')} dates={p.bestDays} days={p.days} lang={lang} />
      <DayChips title={t('Demanding days')} dates={p.hardDays} days={p.days} lang={lang} />
      <h3>{t('By life sphere')}</h3>
      <Bars spheres={p.spheres} />
      <h3>{t('Key transits')}</h3>
      <Events events={p.events} lang={lang} />
      <MoonEvents events={p.moonEvents} lang={lang} />
    </>
  )
}

/** Картка «Personal forecast» на сторінці Cosmic Today: вкладки сьогодні / тиждень / місяць за датою народження користувача. */
export default function ForecastCard({ active = false }) {
  const lang = useLang() // сервер віддає тексти мовою інтерфейсу: при зміні мови вантажимо знову
  const [state, setState] = useState({ status: 'loading' })
  const [tab, setTab] = useState('today')
  const ref = useRef(null)

  useEffect(() => {
    let live = true
    get(`/astrology/forecast?date=${localToday()}`).then(
      (data) => live && setState({ status: 'ok', data }),
      (error) => live && setState({ status: 'error', error: error.message }),
    )
    return () => {
      live = false
    }
  }, [lang])

  const ready = state.status !== 'loading'
  useEffect(() => {
    if (active && ready) ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [active, ready])

  const f = state.data
  return (
    <section id="forecast" ref={ref} className={`tcard wide forecast${active ? ' active' : ''}`}>
      <h2>{t('Personal forecast')}</h2>
      {state.status === 'loading' && <p className="muted">{t('Loading…')}</p>}
      {state.status === 'error' && (
        <>
          <p className="muted">{state.error}</p>
          <a className="more" {...navProps('/profile')}>{t('Open profile')}</a>
        </>
      )}
      {f && (
        <>
          <p className="muted">{t('Built from the planets in the sky and your natal chart.')}</p>
          <div className="fc-tabs" role="tablist">
            {TABS.map(([id, label]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? 'on' : ''} onClick={() => setTab(id)}>
                {t(label)}
                <small>{id === 'today' ? dayLabel(f.date, lang) : f[id] ? `${dayLabel(f[id].from, lang)} – ${dayLabel(f[id].to, lang)}` : `🔒 ${t('Pro')}`}</small>
              </button>
            ))}
          </div>
          {tab === 'today' && <Today day={f.day} />}
          {/* на безкоштовному тарифі сервер віддає тиждень і місяць як null (і список locked): замість порожнього екрана — підказка */}
          {tab !== 'today' && !f[tab] && (
            <p className="muted">
              {t('Week and month forecasts are part of the Pro plan.')} <a className="more" {...navProps('/pricing')}>{t('See plans')}</a>
            </p>
          )}
          {tab === 'week' && f.week && <Period p={f.week} lang={lang} />}
          {tab === 'month' && f.month && <Period p={f.month} lang={lang} long />}
        </>
      )}
    </section>
  )
}
