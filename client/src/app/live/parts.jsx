import { useEffect, useState } from 'react'
import { t } from '../../i18n/index.js'
import './live.css'

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
