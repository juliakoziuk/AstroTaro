import { useState } from 'react'
import { get, getToken } from '../../lib/api.js'
import { t, useLang } from '../../i18n/index.js'
import AppPage from '../AppPage.jsx'
import { go } from '../router.js'
import { say } from '../toast.js'
import { usePage } from '../usePage.js'
import { LoadError, Loading } from './parts.jsx'
import { startReading } from './tarotStart.js'

const MODES = [['quick', 'Quick'], ['detailed', 'Detailed'], ['depth', 'In depth']]

async function load() {
  // ліміти тарифу потрібні лише для підказки про режим; якщо запит не вдався, пускаємо далі й рішення лишається за сервером
  const [all, billing] = await Promise.all([get('/tarot/spreads'), getToken() ? get('/billing').catch(() => null) : null])
  // «Власний розклад» (custom) лишився лише в старих записах історії
  return { spreads: all.filter((s) => s.id !== 'custom'), limits: billing?.limits ?? null }
}

export default function TarotStudio() {
  useLang()
  const page = usePage(load)
  const [picked, setPicked] = useState('three')
  const [mode, setMode] = useState('quick')
  const spreads = page.data?.spreads ?? []
  const start = () => {
    try {
      startReading(picked, mode, page.data?.limits)
    } catch (e) {
      say(e.message)
    }
  }
  return (
    <AppPage title={t('Tarot Studio')} subtitle={t('Choose a spread and get your reading')}>
      <LoadError page={page} />
      {!page.data && page.status === 'loading' && <Loading />}
      <div className="ap-cols even">
        <section className="ap-panel">
          <h2>{t('Spreads')}</h2>
          <ul className="ap-list">
            {spreads.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className="ap-row"
                  aria-pressed={s.id === picked}
                  onClick={() => (s.id === 'daily' ? go('/daily') : setPicked(s.id))} // карта дня — не розклад із вибором, а окрема сторінка з серією
                >
                  <span className="grow">
                    <b>{s.name}</b>
                    <small>{s.positions.join(' • ')}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
        <section className="ap-panel">
          <h2>{t('Reading mode')}</h2>
          <div className="ap-modes" role="radiogroup" aria-label={t('Reading mode')}>
            {MODES.map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={mode === id} className="ap-mode" onClick={() => setMode(id)}>{t(label)}</button>
            ))}
          </div>
          <div className="ap-actions">
            <button type="button" className="ap-btn primary wide" disabled={!page.data} onClick={start}>{t('Start Reading')}</button>
          </div>
        </section>
      </div>
    </AppPage>
  )
}
