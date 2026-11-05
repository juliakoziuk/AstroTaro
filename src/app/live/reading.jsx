// Екран Reading: розклад, який сформував сервер (POST /tarot/readings), показуємо в намальованій розкладці.
import { Fragment, useEffect } from 'react'
import { get, patch } from '../../lib/api.js'
import { t } from '../../i18n/index.js'
import { cardImage } from './cardimage.js'
import { box, Ov, Prose, Zone } from './parts.jsx'
import { BookmarkIcon, RefreshIcon } from '../icons.jsx'
import { session } from './common.js'

const CARDS = [[362, 311, 152, 196], [559, 311, 150, 196], [751, 311, 150, 196]]
const ICONS = [[354, 631, 66, 66], [354, 722, 66, 66], [354, 815, 66, 66]]

// рядки списку: у макеті пояснення займає один рядок, а наше може бути довшим: менший кегль і два рядки, що не налазять на розділювач
const ROW_TEXT = { flow: 2, width: 46, fs: 18.5, lh: 23 }
const ROWS = ICONS.map(([x, y]) => [x - 26, y - 14, 592, 94]) // клікабельні рядки списку: від x 328 до 920, у межах панелі (317…931)
const CHEVRONS = ICONS.map(([, y]) => [884, y + 18, 20, 30]) // стрілка праворуч у рядку
const DIVIDERS = [[340, 706, 572, 2], [340, 797, 572, 2]] // розділювачі між рядками
// розклад із однієї карти (Карта дня, Так/Ні): картка по центру панелі (її краї x 317…931), а трактування — одним блоком на весь список
const SINGLE_CARD = [548, 311, 152, 196]
const SINGLE_CAPTION = [474, 513, 300, 84]
const SINGLE_TEXT = [345, 628, 570, 250]
// «Поділитися» прибрано, тому «Новий розклад» стоїть одразу під «Зберегти»
const BUTTONS = { save: [970, 590, 490, 72, 36], again: [970, 690, 490, 72, 36] }
const MODE_LABEL = { quick: 'Quick', detailed: 'Detailed', depth: 'In depth' }

const label = (i) => ({ find: ['Past', 'Present', 'Future'][i], key: `p${i}.label` })

/** Повний опис карти в її позиції; що саме в ньому, залежить від режиму тлумачення (див. interpret() на сервері). */
function CardDetail({ row, card, mode, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="mdl-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mdl cardmdl" role="dialog" aria-modal="true" aria-label={row.card}>
        <img src={cardImage(card.id)} alt={row.card} className={card.reversed ? 'rev' : ''} />
        <div>
          <p className="where">{row.label} · {t(MODE_LABEL[mode] ?? 'Quick')}</p>
          <h2>{row.card}{card.reversed ? ` (${t('Reversed').toLowerCase()})` : ''}</h2>
          <p className="detail">{row.detail}</p>
          <div className="actions"><button type="button" className="primary" onClick={onClose}>{t('Close')}</button></div>
        </div>
      </div>
    </div>
  )
}

export const reading = {
  bind: [
    { find: 'Three Cards', key: 'spread' },
    { find: 'Past • Present • Future', key: 'positions' },
    { ...label(0), nth: 0 }, { find: 'The Moon', key: 'p0.card' },
    { ...label(1), nth: 0 }, { find: 'The Star', key: 'p1.card' },
    { ...label(2), nth: 0 }, { find: 'The Sun', key: 'p2.card' },
    { ...label(0), nth: 1 }, { find: 'A time of uncertainty and inner search.', ...ROW_TEXT, key: 'p0.meaning' },
    { ...label(1), nth: 1 }, { find: 'Renewed hope and inspiration.', ...ROW_TEXT, key: 'p1.meaning' },
    { ...label(2), nth: 1 }, { find: 'Success, clarity, and new possibilities.', ...ROW_TEXT, key: 'p2.meaning' },
    { find: 'A period of inner change is coming to an end.', drop: 4 }, // замінює <Prose> нижче
    { find: 'Save Reading', drop: 3 }, // намальовані підписи кнопок (Save Reading, Share, New Spread): кнопки малює сторінка
  ],
  async load({ go }) {
    const id = session.get('readingId')
    let r = null
    if (id) r = await get(`/spreads/${id}`).catch(() => null)
    if (!r) r = (await get('/spreads'))[0]
    if (!r) {
      go('/tarot', { replace: true })
      return { values: {} }
    }
    const spreads = await get('/tarot/spreads') // назви розкладів мовою інтерфейсу
    const values = { spread: spreads.find((s) => s.id === r.spreadId)?.name ?? '', positions: r.result.positions.map((p) => p.label).join(' • ') }
    const single = r.result.positions.length === 1 // підписи й трактування однієї карти малює сторінка (Over)
    r.result.positions.slice(0, 3).forEach((p, i) => {
      values[`p${i}.label`] = single ? '' : p.label
      values[`p${i}.card`] = single ? '' : p.card
      values[`p${i}.meaning`] = single ? '' : p.meaning
    })
    return { values, data: { reading: r } }
  },
  Over({ ctx }) {
    const r = ctx.data?.reading
    const rows = r?.result.positions.slice(0, 3) ?? []
    const single = rows.length === 1
    const save = async () => {
      try {
        await patch(`/spreads/${r.id}`, { saved: true })
        ctx.say(t('Reading saved'))
        session.set('historyFilter', 'saved')
        ctx.go('/history')
      } catch (e) {
        ctx.fail(e)
      }
    }
    return (
      <>
        {/* картки, номери, стрілки й розділювачі малюємо лише для позицій розкладу: у плиті їх немає (див. specs/reading.mjs) */}
        {single && (
          <>
            <Ov at={[...SINGLE_CARD, 14]} className="cardimg">
              <img src={cardImage(r.cards[0].id)} alt={rows[0].card} className={r.cards[0].reversed ? 'rev' : ''} />
            </Ov>
            <Ov at={SINGLE_CAPTION} className="cap ov-none">
              <b>{rows[0].label}</b>
              <span>{rows[0].card}{r.cards[0].reversed ? ` (${t('Reversed').toLowerCase()})` : ''}</span>
            </Ov>
            <Ov at={SINGLE_TEXT} className="single">
              <h3>{rows[0].label}</h3>
              <p>{rows[0].detail}</p>
            </Ov>
          </>
        )}
        {!single && rows.map((row, i) => {
          const c = r.cards[i]
          return (
            <Fragment key={i}>
              <Ov at={[...CARDS[i], 14]} className="cardimg">
                <img src={cardImage(c.id)} alt={row.card} className={c.reversed ? 'rev' : ''} />
              </Ov>
              <Ov at={[...ICONS[i], 33]} className="tile ov-none">{i + 1}</Ov>
              <Ov at={CHEVRONS[i]} className="chev ov-none">
                <svg viewBox="0 0 12 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m2 2 8 8-8 8" /></svg>
              </Ov>
              {i > 0 && <Ov at={DIVIDERS[i - 1]} className="divider ov-none" />}
            </Fragment>
          )
        })}
        {!single && rows.map((row, i) => (
          <Zone key={`row${i}`} at={[...ROWS[i], 18]} className="quiet" label={`${row.label}: ${row.card}`} onClick={() => ctx.openModal({ name: 'card', index: i })} />
        ))}
        {ctx.modal?.name === 'card' && rows[ctx.modal.index] && <CardDetail row={rows[ctx.modal.index]} card={r.cards[ctx.modal.index]} mode={r.mode} onClose={ctx.closeModal} />}
        {r && <Prose at={[997, 345, 455, 205]} text={r.result.summary} fs={23.85} lh={34} />}
        {r && (
          <>
            <button type="button" className="ov pill" style={box(...BUTTONS.save)} onClick={save}>
              <BookmarkIcon />
              {t('Save Reading')}
            </button>
            <button type="button" className="ov pill gold" style={box(...BUTTONS.again)} onClick={() => ctx.go('/tarot')}>
              <RefreshIcon />
              {t('New Spread')}
            </button>
          </>
        )}
      </>
    )
  },
}
