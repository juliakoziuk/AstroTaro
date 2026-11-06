import { useEffect, useState } from 'react'
import { t } from '../../i18n/index.js'
import './live.css'

/** Прямокутник у сітці макета (одиниці 1536x1024); s = 1 — зсув разом із центральною частиною на широких екранах. */
export const box = (x, y, w, h, r = 0, s = 1) => ({ '--x': x, '--y': y, '--w': w, '--h': h, '--r': r, '--s': s })

export function Ov({ at, className = '', style, children, ...rest }) {
  return (
    <div className={`ov ${className}`} style={{ ...box(...at), ...style }} {...rest}>
      {children}
    </div>
  )
}

/** Прозора кнопка-зона поверх намальованого елемента. */
export function Zone({ at, label, onClick, className = '' }) {
  return <button type="button" className={`hit act ${className}`} aria-label={t(label)} style={box(...at)} onClick={onClick} />
}

/**
 * Рамки рядків списку: намальована підсвітка належить рядку `painted` (зазвичай 0). Якщо виділено інший рядок —
 * закриваємо намальовану підсвітку й малюємо свою біля виділеного.
 */
export function RowFrames({ rows, selected, painted = 0, dim = false }) {
  return (
    <>
      {selected !== painted && <Ov at={rows[painted]} className={`${dim ? 'row-dim' : 'row-off'} ov-none`} />}
      {selected >= 0 && selected !== painted && <Ov at={rows[selected]} className="row-on ov-none" />}
    </>
  )
}

export function Modal({ title, onClose, onSubmit, submitLabel = 'Save', children }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onSubmit(new FormData(e.currentTarget))
      onClose()
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }
  return (
    <div className="mdl-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className="mdl" role="dialog" aria-modal="true" aria-label={title} onSubmit={submit} onKeyDown={(e) => e.key === 'Escape' && onClose()}>
        <h2>{title}</h2>
        {children}
        {error && <p className="err" role="alert">{error}</p>}
        <div className="actions">
          <button type="button" onClick={onClose}>{t('Cancel')}</button>
          <button type="submit" className="primary" disabled={busy}>{t(submitLabel)}</button>
        </div>
      </form>
    </div>
  )
}

export const Field = ({ label, hint, ...props }) => (
  <>
    <label>
      {label}
      {props.rows ? <textarea {...props} /> : <input {...props} />}
    </label>
    {hint && <p className="hint">{hint}</p>}
  </>
)

/** Однакова мініатюра-плитка для списків (замість намальованих картинок конкретних снів). */
export const TILE = '✦'

/** Прокручуваний абзац у прямокутнику макета: fs/lh — кегль і міжрядковий інтервал в одиницях макета. */
export function Prose({ at, text, fs, lh, color }) {
  return (
    <div className="ov prose" style={{ ...box(...at), '--fs': fs, '--lh': lh, ...(color ? { '--c': color } : {}) }}>
      {text}
    </div>
  )
}

/** Вікно без форми (перегляд, пояснення): той самий вигляд, що й у Modal, закривається Esc і кліком поза вікном. */
export function Dialog({ title, onClose, actions, wide = false, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="mdl-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`mdl${wide ? ' wide' : ''}`} role="dialog" aria-modal="true" aria-label={title}>
        <h2>{title}</h2>
        {children}
        <div className="actions">
          {actions}
          <button type="button" onClick={onClose}>{t('Close')}</button>
        </div>
      </div>
    </div>
  )
}
