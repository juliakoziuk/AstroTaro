import { useEffect, useState } from 'react'
import { get } from '../lib/api.js'
import { formatDay, formatTime } from './format.js'
import { t, useLang } from '../i18n/index.js'
import { navProps } from './router.js'
import './today.css'

/** Завантаження однієї картки: помилка однієї не ламає решту. */
function useLoad(load) {
  const [state, setState] = useState({ status: 'loading' })
  useEffect(() => {
    let live = true
    load().then(
      (data) => live && setState({ status: 'ok', data }),
      (error) => live && setState({ status: 'error', error: error.message }),
    )
    return () => {
      live = false
    }
  }, [load])
  return state
}

function Card({ title, state, children, className = '' }) {
  return (
    <section className={`tcard ${className}`}>
      <h2>{title}</h2>
      {state.status === 'loading' && <p className="muted">{t('Loading…')}</p>}
      {state.status === 'error' && <p className="muted">{t('Couldn’t load this right now.')} {state.error}</p>}
      {state.status === 'ok' && children(state.data)}
    </section>
  )
}

const loadSky = () => get('/astrology')
const loadApod = () => get('/cosmos/apod')
const loadQuote = () => get('/cosmos/quote')
const loadHolidays = () => get('/cosmos/holidays')
const loadBase = () => Promise.all([get('/profile'), get('/settings')])

function Apod({ a }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      {a.mediaType === 'image' ? <img className="apod" src={a.url} alt={a.title} loading="lazy" /> : <a className="link" href={a.url} target="_blank" rel="noreferrer">{t('Watch today’s video')} ↗</a>}
      <h3>{a.title}</h3>
      <p className={`muted prose${open ? '' : ' clamp'}`}>{a.explanation}</p>
      <button type="button" className="more" onClick={() => setOpen(!open)}>{open ? t('Less') : t('More')}</button>
      <p className="credit">{t('NASA Astronomy Picture of the Day')} · {a.date}{a.copyright ? ` · © ${a.copyright}` : ''}</p>
    </>
  )
}

function Sun({ profile, fmt }) {
  const [here, setHere] = useState(null)
  const [error, setError] = useState('')
  const spot = here ?? (profile.birthLat != null ? { lat: profile.birthLat, lon: profile.birthLon, label: (profile.birthPlace ?? '').split(',')[0] } : null)
  const [sun, setSun] = useState({ status: spot ? 'loading' : 'none' })

  const lat = spot?.lat
  const lon = spot?.lon
  useEffect(() => {
    if (lat == null) return undefined
    let live = true
    get(`/cosmos/sun?lat=${lat}&lon=${lon}`).then(
      (data) => live && setSun({ status: 'ok', data }),
      (e) => live && setSun({ status: 'error', error: e.message }),
    )
    return () => {
      live = false
    }
  }, [lat, lon])

  const locate = () =>
    navigator.geolocation?.getCurrentPosition(
      (p) => (setSun({ status: 'loading' }), setHere({ lat: p.coords.latitude, lon: p.coords.longitude, label: t('your location') })),
      () => setError(t('Location permission was denied')),
    )

  return (
    <>
      {sun.status === 'ok' && (
        <>
          <div className="pair"><span>{t('Sunrise')}</span><b>{formatTime(sun.data.sunrise, fmt, sun.data.timeZone)}</b></div>
          <div className="pair"><span>{t('Sunset')}</span><b>{formatTime(sun.data.sunset, fmt, sun.data.timeZone)}</b></div>
          <p className="credit">{spot.label || t('Your place')} · {sun.data.timeZone}</p>
        </>
      )}
      {sun.status === 'loading' && <p className="muted">{t('Loading…')}</p>}
      {sun.status === 'error' && <p className="muted">{t('Couldn’t load sun times.')} {sun.error}</p>}
      {sun.status === 'none' && <p className="muted">{t('Choose your birth city in Profile, or use your current location.')}</p>}
      <button type="button" className="more" onClick={locate}>{t('Use my location')}</button>
      {error && <p className="muted">{error}</p>}
    </>
  )
}

export default function Today() {
  useLang() // перемальовуємо при зміні мови
  const base = useLoad(loadBase)
  const sky = useLoad(loadSky)
  const apod = useLoad(loadApod)
  const quote = useLoad(loadQuote)
  const holidays = useLoad(loadHolidays)
  const fmts = base.status === 'ok' ? base.data[1] : { dateFormat: 'DD/MM/YYYY', timeFormat: '24-hour' }

  return (
    <div className="v-app">
      <main className="today">
        <header>
          <a className="back" {...navProps('/dashboard')}>← {t('Home')}</a>
          <h1>{t('Cosmic Today')}</h1>
          <p className="muted">{t('The sky, a picture from space and a thought for the day.')}</p>
        </header>

        <div className="grid">
          <Card title={t('The sky now')} state={sky}>
            {(a) => (
              <>
                <p className="insight">{a.insight}</p>
                {a.current.map((p) => (
                  <div className="pair" key={p.name}><span>{p.planet}</span><b>{p.signName}</b></div>
                ))}
              </>
            )}
          </Card>

          <Card title={t('Moon & calendar')} state={sky}>
            {(a) => (
              <>
                {a.events.map((e) => (
                  <div className="pair" key={e.name}><span>{e.name}</span><b>{formatDay(e.date, fmts.dateFormat)}</b></div>
                ))}
                <h3>{t('Public holidays')}</h3>
                {holidays.status === 'loading' && <p className="muted">Loading…</p>}
                {holidays.status === 'error' && <p className="muted">{t('Holidays are unavailable right now.')}</p>}
                {holidays.status === 'ok' && !holidays.data.country && <p className="muted">{t('Choose your birth city in Profile to see your country’s holidays.')}</p>}
                {holidays.status === 'ok' && holidays.data.holidays.map((h) => (
                  <div className="pair" key={h.date + h.name}><span title={h.name}>{h.localName}</span><b>{formatDay(h.date, fmts.dateFormat)}</b></div>
                ))}
              </>
            )}
          </Card>

          <Card title={t('Sunrise & sunset')} state={base}>{([profile, s]) => <Sun profile={profile} fmt={s.timeFormat} />}</Card>

          <Card title={t('Quote of the day')} state={quote}>
            {(q) => (
              <>
                <blockquote>“{q.text}”</blockquote>
                <p className="credit">— {q.author} · <a href={q.source} target="_blank" rel="noreferrer">{t('Inspirational quotes by ZenQuotes.io')}</a></p>
              </>
            )}
          </Card>

          <Card title={t('Picture of the day')} state={apod} className="wide">{(a) => <Apod a={a} />}</Card>
        </div>
      </main>
    </div>
  )
}
