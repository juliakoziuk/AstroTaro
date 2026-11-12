import { useRef, useState } from 'react'
import { get, patch, post } from '../lib/api.js'
import { t, useLang } from '../i18n/index.js'
import { go } from './router.js'
import { session } from './live/common.js'
import { PlaceField } from './live/profile.jsx'
import { markOnboarded } from './onboardingGate.js'
import '../login/account.css'
import './onboarding.css'

// Знайомство після реєстрації: що цікавить → дані народження → «велика трійка» → перша карта.
// Будь-який крок можна пропустити; «Пропустити» теж зараховується як пройдений онбординг.

const STEPS = 4
const INTERESTS = [
  { id: 'tarot', glyph: '✦', title: 'Tarot', text: 'Readings that answer your questions' },
  { id: 'dreams', glyph: '☾', title: 'Dreams', text: 'A journal that finds the symbols' },
  { id: 'astrology', glyph: '☉', title: 'Astrology', text: 'Your chart and the sky today' },
  { id: 'reflection', glyph: '❍', title: 'Self-reflection', text: 'Notes, moods and your own patterns' },
]
// куди веде «Не зараз»: туди, що людина вибрала першим
const HOME = { dreams: '/dreams', astrology: '/astrology', tarot: '/tarot' }
const TODAY = () => new Date().toISOString().slice(0, 10)
const POINTS = [
  ['sun', 'Sun', '☉'],
  ['moon', 'Moon', '☾'],
  ['ascendant', 'Ascendant', '↑'],
]

export default function Onboarding() {
  useLang()
  const [step, setStep] = useState(0)
  const [interests, setInterests] = useState([])
  const [birth, setBirth] = useState({ date: '', time: '', unknownTime: false })
  const [pick, setPick] = useState(null) // обране місто: назва, координати, країна
  const [big, setBig] = useState(null)
  const [question, setQuestion] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const working = useRef(false) // кнопка блокується лише після перемальовування, а другий клік може прийти раніше

  const run = async (job) => {
    if (working.current) return
    working.current = true
    setBusy(true)
    setError('')
    try {
      await job()
    } catch (e) {
      setError(e.message)
    } finally {
      working.current = false
      setBusy(false)
    }
  }

  const toggle = (id) => setInterests((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]))

  /** Позначає онбординг пройденим (з інтересами, якщо вони є) і веде далі. */
  const finish = (to) =>
    run(async () => {
      await post('/profile/onboarding', { interests })
      markOnboarded()
      to()
    })

  const saveBirth = (e) => {
    e.preventDefault()
    const date = birth.date.trim()
    if (!date) return setError(t('Enter your date of birth, or skip this step.'))
    if (date > TODAY() || date < '1900-01-01') return setError(t('Check the date of birth.'))
    run(async () => {
      const body = { birthDate: date }
      if (birth.time && !birth.unknownTime) body.birthTime = birth.time
      if (pick) Object.assign(body, { birthPlace: pick.name, birthLat: pick.lat, birthLon: pick.lon, country: pick.country ?? null })
      await patch('/profile', body)
      setBig(await get('/astrology/big-three'))
      setStep(2)
    })
  }

  const drawFirst = () =>
    finish(() => {
      // дальше людина сама тягне карту на /draw: розклад «Карта дня», питання вже вписане
      session.set('draw', JSON.stringify({ spreadId: 'daily', mode: 'quick', question: question.trim() }))
      go('/draw')
    })

  const skipAll = () => finish(() => go('/dashboard'))
  const notNow = () => finish(() => go(HOME[interests[0]] ?? '/dashboard'))

  return (
    <div className="v-account">
      <main className="account-page">
        <section className="account-card wide onb" aria-labelledby="onb-title">
          <div className="account-brand" aria-hidden="true">MYSTIQ</div>
          <ol className="onb-dots" aria-label={t('Step {n} of {total}', { n: step + 1, total: STEPS })}>
            {Array.from({ length: STEPS }, (_, i) => (
              <li key={i} className={i === step ? 'now' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined} />
            ))}
          </ol>

          {step === 0 && (
            <>
              <h1 id="onb-title">{t('What draws you here?')}</h1>
              <p className="onb-sub">{t('Pick what interests you and we will start there.')}</p>
              <ul className="onb-choices">
                {INTERESTS.map((o) => (
                  <li key={o.id}>
                    <button type="button" className="onb-choice" aria-pressed={interests.includes(o.id)} onClick={() => toggle(o.id)}>
                      <i aria-hidden="true">{o.glyph}</i>
                      <b>{t(o.title)}</b>
                      <span>{t(o.text)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setStep(1)}>{t('Continue')}</button>
            </>
          )}

          {step === 1 && (
            <form onSubmit={saveBirth} noValidate>
              <h1 id="onb-title">{t('Your birth details')}</h1>
              <p className="onb-sub">{t('Your date of birth gives us your Sun and Moon. Add the time and the city, and we will also find your Ascendant.')}</p>
              <label>
                {t('Date of birth')}
                <input type="date" value={birth.date} min="1900-01-01" max={TODAY()} onChange={(e) => setBirth({ ...birth, date: e.target.value })} />
              </label>
              <label>
                {t('Time of birth')}
                <input type="time" value={birth.time} disabled={birth.unknownTime} onChange={(e) => setBirth({ ...birth, time: e.target.value })} />
              </label>
              <label className="onb-check">
                <input type="checkbox" checked={birth.unknownTime} onChange={(e) => setBirth({ ...birth, unknownTime: e.target.checked, time: e.target.checked ? '' : birth.time })} />
                {t('I do not know the time')}
              </label>
              <PlaceField profile={{ birthPlace: pick?.name ?? '' }} pick={pick} setPick={setPick} />
              {error && <p className="account-error" role="alert">{error}</p>}
              <button type="submit" disabled={busy}>{busy ? t('Saving…') : t('Continue')}</button>
              <button type="button" className="onb-link" onClick={() => (setError(''), setStep(3))}>{t('I will add it later')}</button>
            </form>
          )}

          {step === 2 && big && (
            <>
              <h1 id="onb-title">{t('Your big three')}</h1>
              <p className="onb-sub">{t('The three points astrologers read first.')}</p>
              <ul className="onb-big">
                {POINTS.map(([key, name, glyph]) => (
                  <li key={key} className={big[key] ? '' : 'locked'}>
                    <i aria-hidden="true">{glyph}</i>
                    <h2>{t(name)}{big[key] && <em>{big[key].signName}</em>}</h2>
                    {big[key] ? (
                      <p>{big[key].text}</p>
                    ) : (
                      <p>
                        {t('Add your birth time and city to reveal your Ascendant.')}{' '}
                        <button type="button" className="onb-link inline" onClick={() => setStep(1)}>{t('Add them now')}</button>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
              <button type="button" onClick={() => setStep(3)}>{t('Continue')}</button>
            </>
          )}

          {step === 3 && (
            <>
              <h1 id="onb-title">{t('Your first card')}</h1>
              <p className="onb-sub">{t('Think of something on your mind, or leave it open. Then choose the card that calls to you.')}</p>
              <input
                value={question}
                maxLength={300}
                placeholder={t('Your question (optional)')}
                aria-label={t('Your question (optional)')}
                onChange={(e) => setQuestion(e.target.value)}
              />
              {error && <p className="account-error" role="alert">{error}</p>}
              <button type="button" disabled={busy} onClick={drawFirst}>{busy ? t('Saving…') : t('Draw my first card')}</button>
              <button type="button" className="onb-link" disabled={busy} onClick={notNow}>{t('Not now')}</button>
            </>
          )}

          {step < 3 && (
            <button type="button" className="onb-link onb-skip" disabled={busy} onClick={skipAll}>{t('Skip for now')}</button>
          )}
        </section>
      </main>
    </div>
  )
}
