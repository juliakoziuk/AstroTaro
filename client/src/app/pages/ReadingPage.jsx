import { get, patch, post } from '../../lib/api.js'
import { t, useLang } from '../../i18n/index.js'
import AppPage from '../AppPage.jsx'
import { cardImage } from '../live/cardimage.js'
import { session } from '../live/common.js'
import { Dialog } from '../live/parts.jsx'
import { BookmarkIcon, RefreshIcon } from '../icons.jsx'
import { usePage } from '../usePage.js'
import { LoadError, Loading } from './parts.jsx'

const MODE_LABEL = { quick: 'Quick', detailed: 'Detailed', depth: 'In depth' }
const LONG_SUMMARY = 420 // довший текст можна відкрити у великому вікні

async function load({ go }) {
  const id = session.get('readingId')
  let r = null
  try {
    const temporary = JSON.parse(session.get('temporaryReading') || 'null')
    if (temporary?.id === id) r = temporary
  } catch { /* попередній незавершений сеанс */ }
  if (id && !r) r = await get(`/spreads/${id}`).catch(() => null)
  if (!r) r = (await get('/spreads'))[0]
  if (!r) {
    go('/tarot', { replace: true })
    return null
  }
  const spreads = await get('/tarot/spreads') // назви розкладів мовою інтерфейсу
  return { reading: r, spreadName: spreads.find((s) => s.id === r.spreadId)?.name ?? '' }
}

const reversed = (c) => (c.reversed ? ` (${t('Reversed').toLowerCase()})` : '')

/** Повний опис карти в її позиції; що саме в ньому, залежить від режиму тлумачення (див. interpret() на сервері). */
function CardDetail({ row, card, mode, onClose }) {
  return (
    <Dialog title={`${row.card}${reversed(card)}`} onClose={onClose} wide>
      <div className="ap-card-dlg">
        <img src={cardImage(card.id)} alt={row.card} className={card.reversed ? 'rev' : ''} />
        <div>
          <p className="ap-muted">{row.label} · {t(MODE_LABEL[mode] ?? 'Quick')}</p>
          <p className="ap-prose">{row.detail}</p>
        </div>
      </div>
    </Dialog>
  )
}

export default function ReadingPage() {
  useLang()
  const page = usePage(load)
  const { ctx } = page
  const r = page.data?.reading
  const rows = r?.result.positions ?? []
  const single = rows.length === 1

  const save = () =>
    ctx.run(async () => {
      if (r.temporary) {
        await post('/spreads', { spreadId: r.spreadId, deck: r.deck, mode: r.mode, question: r.question, cards: r.cards, saved: true })
        session.set('temporaryReading', '')
      } else await patch(`/spreads/${r.id}`, { saved: true })
      ctx.say(t('Reading saved'))
      session.set('historyFilter', 'saved')
      ctx.go('/history')
    })

  return (
    <AppPage title={page.data?.spreadName || t('Tarot Reading')} subtitle={rows.map((p) => p.label).join(' • ')} back="back:/tarot">
      <LoadError page={page} />
      {!r && page.status === 'loading' && <Loading />}
      {r && (
        <div className="ap-cols">
          <section className="ap-panel">
            <div className="ap-cards">
              {rows.map((row, i) => (
                <figure key={i} className={`ap-card${single ? ' single' : ''}`} style={{ margin: 0 }}>
                  <img src={cardImage(r.cards[i].id)} alt={row.card} className={r.cards[i].reversed ? 'rev' : ''} />
                  <b>{row.label}</b>
                  <span>{row.card}{reversed(r.cards[i])}</span>
                </figure>
              ))}
            </div>
            {single ? (
              <p className="ap-prose">{rows[0].detail}</p>
            ) : (
              <ul className="ap-list">
                {rows.map((row, i) => (
                  <li key={i}>
                    <button type="button" className="ap-row" aria-label={`${row.label}: ${row.card}`} onClick={() => ctx.openModal({ name: 'card', index: i })}>
                      <span className="num" aria-hidden="true">{i + 1}</span>
                      <span className="grow">
                        <b>{row.label}: {row.card}</b>
                        <small>{row.meaning}</small>
                      </span>
                      <svg viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2 2 8 8-8 8" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <div className="ap-stack">
            <section className="ap-panel">
              <h2>{t('Interpretation')}</h2>
              <p className="ap-prose">{r.result.summary.length > LONG_SUMMARY ? `${r.result.summary.slice(0, LONG_SUMMARY).trimEnd()}…` : r.result.summary}</p>
              {r.result.summary.length > LONG_SUMMARY && (
                <button type="button" className="ap-linkish" onClick={() => ctx.openModal({ name: 'summary' })}>{t('Read in full')}</button>
              )}
              <div className="ap-actions">
                <button type="button" className="ap-btn" onClick={save}><BookmarkIcon />{t('Save Reading')}</button>
                <button type="button" className="ap-btn primary" onClick={() => ctx.go('/tarot')}><RefreshIcon />{t('New Spread')}</button>
              </div>
            </section>
          </div>
        </div>
      )}
      {ctx.modal?.name === 'card' && rows[ctx.modal.index] && <CardDetail row={rows[ctx.modal.index]} card={r.cards[ctx.modal.index]} mode={r.mode} onClose={ctx.closeModal} />}
      {ctx.modal?.name === 'summary' && r && (
        <Dialog title={t('Interpretation')} onClose={ctx.closeModal} wide>
          <div className="full-text">
            {r.result.summary.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
          </div>
        </Dialog>
      )}
    </AppPage>
  )
}
