// Астрологічні звіти: перегляд щойно створеного, список «My Reports» і пояснення для безкоштовного тарифу.
import { useEffect, useState } from 'react'
import { get } from '../../lib/api.js'
import { t } from '../../i18n/index.js'
import { formatDate } from '../format.js'
import { Dialog } from './parts.jsx'

/** Текст звіту з сервера: блоки «## Розділ» з рядками; рядки, що починаються з «- », — пункти (аспекти). */
function ReportBody({ text }) {
  return text.split(/\n\n+/).map((block) => {
    const [first, ...lines] = block.split('\n')
    const heading = first.startsWith('## ')
    return (
      <section className="report-section" key={block.slice(0, 40)}>
        {heading && <h3>{first.slice(3)}</h3>}
        {(heading ? lines : [first, ...lines]).map((line) => (
          <p key={line.slice(0, 60)} className={line.startsWith('- ') ? 'bullet' : undefined}>{line.startsWith('- ') ? line.slice(2) : line}</p>
        ))}
      </section>
    )
  })
}

export const ReportDialog = ({ report, onClose }) => (
  <Dialog title={report.title} onClose={onClose} wide>
    <ReportBody text={report.text} />
  </Dialog>
)

export const UpgradeDialog = ({ onClose, onPlans }) => (
  <Dialog
    title={t('Full astrology report')}
    onClose={onClose}
    actions={<button type="button" className="primary" onClick={onPlans}>{t('See plans')}</button>}
  >
    <p className="report-text">{t('Full reports are part of Pro and Premium')}</p>
  </Dialog>
)

/** Усі звіти користувача; клік по назві розгортає текст. */
export function ReportsDialog({ onClose, dateFormat = 'DD/MM/YYYY' }) {
  const [state, setState] = useState({ status: 'loading', rows: [] })
  const [open, setOpen] = useState(null)
  useEffect(() => {
    let live = true
    get('/astrology/reports').then(
      (rows) => live && setState({ status: 'ok', rows }),
      (e) => live && setState({ status: 'error', rows: [], error: e.message }),
    )
    return () => {
      live = false
    }
  }, [])
  return (
    <Dialog title={t('My Reports')} onClose={onClose} wide>
      {state.status === 'loading' && <p className="report-text">{t('Loading…')}</p>}
      {state.status === 'error' && <p className="err" role="alert">{state.error}</p>}
      {state.status === 'ok' && state.rows.length === 0 && <p className="report-text">{t('No reports yet')}</p>}
      {state.rows.map((r) => (
        <div className="report-row" key={r.id}>
          <button type="button" aria-expanded={open === r.id} onClick={() => setOpen(open === r.id ? null : r.id)}>
            <span>{r.title}</span>
            <small>{formatDate(r.createdAt, dateFormat)}</small>
          </button>
          {open === r.id && <ReportBody text={r.text} />}
        </div>
      ))}
    </Dialog>
  )
}
