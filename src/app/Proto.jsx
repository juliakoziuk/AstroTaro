import { useEffect, useRef, useState } from 'react'
import { SCREENS } from './screens.js'
import { go, navProps, useRoute } from './router.js'
import { t, useLang } from '../i18n/index.js'

// Перемикач екранів для демо: дрібна кнопка в правому нижньому куті відкриває список усіх екранів потоку.
// Клавіші: G — відкрити/закрити, Esc — закрити, [ і ] — попередній/наступний екран (коли фокус не в полі вводу).
// Ховається, якщо в адресі є ?clean (так знімаємо еталонні знімки для порівняння з макетами).
const css = `
.proto-btn {
  position: fixed; right: 14px; bottom: 14px; z-index: 50;
  width: 38px; height: 38px; padding: 0; border-radius: 50%;
  display: grid; place-items: center; cursor: pointer;
  color: #e4be80; background: rgba(8, 18, 32, 0.72);
  border: 1px solid rgba(228, 190, 128, 0.55);
  backdrop-filter: blur(6px);
  opacity: 0.55; transition: opacity 0.2s, transform 0.2s;
}
.proto-btn:hover, .proto-btn:focus-visible, .proto-btn[aria-expanded='true'] { opacity: 1; transform: scale(1.06); }
.proto-btn:focus-visible { outline: 2px solid #e4be80; outline-offset: 3px; }
.proto-panel {
  position: fixed; right: 14px; bottom: 62px; z-index: 50;
  width: 252px; max-height: calc(100vh - 90px); overflow: auto; padding: 10px;
  border-radius: 16px; color: #efe7d8;
  background: rgba(8, 18, 32, 0.94); border: 1px solid rgba(228, 190, 128, 0.45);
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.55); backdrop-filter: blur(10px);
  font: 14px/1.3 'Source Sans 3', 'Segoe UI', sans-serif;
}
.proto-panel h2 { margin: 2px 6px 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: #b9a07a; }
.proto-panel a {
  display: flex; align-items: baseline; gap: 10px; padding: 7px 10px; border-radius: 10px;
  color: inherit; text-decoration: none;
}
.proto-panel a:hover, .proto-panel a:focus-visible { background: rgba(228, 190, 128, 0.12); outline: none; }
.proto-panel a[aria-current='page'] { background: rgba(228, 190, 128, 0.2); color: #f5dca8; }
.proto-panel b { width: 18px; font-weight: 600; color: #b9a07a; text-align: right; font-variant-numeric: tabular-nums; }
.proto-panel small { margin-left: auto; color: #8d9aab; font-size: 12px; }
.proto-hint { margin: 8px 6px 2px; font-size: 11px; color: #8d9aab; }
`

const typing = () => {
  const el = document.activeElement
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)
}

export default function Proto() {
  useLang() // перемальовуємо при зміні мови
  const route = useRoute()
  const [open, setOpen] = useState(false)
  const btn = useRef(null)
  const hidden = new URLSearchParams(window.location.search).has('clean')

  useEffect(() => {
    if (hidden) return undefined
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (e.key === 'Escape') {
        setOpen(false)
        return
      }
      if (typing()) return
      const i = SCREENS.findIndex((s) => s.path === route)
      if (e.key === 'g' || e.key === 'G') setOpen((v) => !v)
      else if (e.key === ']' || e.key === '[') {
        setOpen(false)
        go(SCREENS[Math.max(0, Math.min(SCREENS.length - 1, i + (e.key === ']' ? 1 : -1)))].path)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [hidden, route])

  if (hidden) return null
  return (
    <>
      <style>{css}</style>
      <button ref={btn} className="proto-btn" type="button" aria-expanded={open} aria-controls="proto-panel" aria-label={t('All screens (G)')} title={t('All screens (G)')} onClick={() => setOpen((v) => !v)}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
        </svg>
      </button>
      {open && (
        <nav id="proto-panel" className="proto-panel" aria-label={t('All screens')} onClick={() => setOpen(false)}>
          <h2>{t('Screens')}</h2>
          {SCREENS.map((s, i) => (
            <a key={s.path} {...navProps(s.path)} aria-current={s.path === route ? 'page' : undefined}>
              <b>{i + 1}</b>
              {t(s.name)}
              <small>{s.path === '/' ? '#/' : '#' + s.path}</small>
            </a>
          ))}
          <p className="proto-hint">{t('G — menu · [ ] — previous / next screen')}</p>
        </nav>
      )}
    </>
  )
}
