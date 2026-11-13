import { t } from '../../i18n/index.js'

/** Помилка завантаження екрана з кнопкою «Спробувати ще раз»; нічого не малює, поки все гаразд. */
export function LoadError({ page }) {
  if (page.status !== 'error') return null
  return (
    <div className="ap-error" role="alert">
      {page.error}
      <button type="button" className="ap-btn" onClick={() => page.ctx.reload()}>{t('Retry')}</button>
    </div>
  )
}

export const Loading = () => <p className="ap-loading" role="status">{t('Loading…')}</p>

/** Перемикач-вимикач у рядку налаштувань. */
export function Toggle({ label, hint, on, onChange, disabled }) {
  return (
    <div className="ap-toggle">
      <div>
        <b>{label}</b>
        {hint && <div className="ap-muted">{hint}</div>}
      </div>
      <button type="button" role="switch" aria-checked={!!on} aria-label={label} className="ap-switch" disabled={disabled} onClick={() => onChange(!on)}><i /></button>
    </div>
  )
}
