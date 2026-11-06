// Екрани Dream Journal і Dream Analysis: один набір даних (GET /dreams), різна розкладка.
import { useEffect, useState } from 'react'
import { api, get, post } from '../../lib/api.js'
import { formatDate, snippet } from '../format.js'
import { t } from '../../i18n/index.js'
import { Field, Modal, Ov, Prose, RowFrames, TILE, Zone } from './parts.jsx'
import { loadSettings, session, slots } from './common.js'

const rowsOf = (w) => [0, 1, 2, 3, 4].map((i) => [291, 309 + i * 121, w, 106, 22])
const ROWS = rowsOf(600)
const ROWS_ANALYSIS = rowsOf(543)
const THUMBS = [0, 1, 2, 3, 4].map((i) => [303, 320 + i * 121.5, 114, 86, 14])
const FIELDS = ['title', 'snip', 'date']

// Колір внутрішності панелей у плитах: ним закриваємо намальовані рядки, яким немає що показати
const COVER = '#091725'
const LIST_BOTTOM = 896 // нижче — рамка панелі списку
// Порожні зони: список (x, ширина) і права панель з деталями
const GEO = {
  dreams: { list: [284, 612], detail: [942, 217, 566, 723] },
  analysis: { list: [284, 562], detail: [884, 222, 624, 675] },
}

const LIST_DREAMS = [
  ['The Old House', 'A mysterious house from my childhood…', 'Oct 28, 2026'],
  ['The Forest', 'I was walking through a dark forest…', 'Oct 25, 2026'],
  ['The Flying Whale', 'A huge whale was flying in the sky…', 'Oct 21, 2026'],
  ['The Unknown Person', 'I met someone I didn’t recognize…', 'Oct 18, 2026'],
  ['The Stairs', 'I was climbing a long staircase…', 'Oct 15, 2026'],
]
const LIST_ANALYSIS = [
  ['Flying in the Sky', 'I was flying above the clouds…', 'Oct 28, 2026'],
  ['Water and the Ocean', 'I was standing by a vast ocean…', 'Oct 25, 2026'],
  ['The Lost City', 'I discovered an ancient city…', 'Oct 21, 2026'],
  ['A Mysterious Door', 'There was a door in a dark room…', 'Oct 18, 2026'],
  ['Meeting a Stranger', 'I met a person I didn’t know…', 'Oct 15, 2026'],
]

async function loadDreams() {
  const [dreams, settings] = await Promise.all([get('/dreams'), loadSettings()])
  const wanted = session.get('dreamId')
  const index = Math.max(0, dreams.findIndex((d) => d.id === wanted))
  const cur = dreams[index]
  const values = {}
  for (let i = 0; i < 5; i++) {
    const d = dreams[i]
    values[`l${i}.title`] = d?.title ?? ''
    values[`l${i}.snip`] = d ? snippet(d.text) : ''
    values[`l${i}.date`] = d ? formatDate(d.date, settings.dateFormat) : ''
  }
  const tags = cur?.symbols ?? []
  Object.assign(values, {
    title: cur?.title ?? '',
    date: cur ? formatDate(cur.date, settings.dateFormat) : '',
    kind: cur?.kind ?? '',
    tag0: tags[0] ?? '', tag1: tags[1] ?? '', tag2: tags[2] ?? '', tag3: tags[3] ?? '',
    key0: cur?.analysis?.keyMeanings[0] ?? '', key1: cur?.analysis?.keyMeanings[1] ?? '', key2: cur?.analysis?.keyMeanings[2] ?? '',
  })
  return { values, data: { dreams, index, cur } }
}

/** Картина з колекції Met Museum (суспільне надбання) до першого символу сну; поки вантажиться — плитка або намальований фон. */
function ArtFrame({ symbol, at, tile, caption }) {
  const [art, setArt] = useState({ symbol: null, data: null })
  useEffect(() => {
    if (symbol == null) return undefined
    let live = true
    get(`/cosmos/art?symbol=${encodeURIComponent(symbol)}`).then(
      (data) => live && setArt({ symbol, data }),
      () => live && setArt({ symbol, data: null }),
    )
    return () => {
      live = false
    }
  }, [symbol])
  const data = art.symbol === symbol ? art.data : null
  if (!data) return tile ? <Ov at={at} className="tile ov-none" style={{ fontSize: 'calc(var(--u) * 90)' }}>{TILE}</Ov> : null
  const credit = `${data.title} — ${data.artist} · ${data.source}`
  return (
    <Ov at={at} className="artframe">
      <a href={data.url} target="_blank" rel="noreferrer" title={credit}>
        <img src={data.image} alt={data.title} />
      </a>
      {caption && <small>{credit}</small>}
    </Ov>
  )
}

function DreamModal({ ctx, dream }) {
  const save = async (f) => {
    const body = { title: String(f.get('title')).trim(), text: String(f.get('text')).trim() }
    const saved = dream ? await api('PATCH', `/dreams/${dream.id}`, body) : await post('/dreams', body)
    session.set('dreamId', saved.id)
    await ctx.reload()
  }
  return (
    <Modal title={t(dream ? 'Edit dream' : 'New dream')} onClose={ctx.closeModal} onSubmit={save} submitLabel={dream ? 'Save' : 'Add dream'}>
      <Field label={t('Title')} name="title" defaultValue={dream?.title} required maxLength={200} autoFocus />
      <Field label={t('What did you dream?')} name="text" defaultValue={dream?.text} required maxLength={10000} rows={6} hint={t('Symbols and the interpretation are found automatically.')} />
    </Modal>
  )
}

/** Закриває намальовані рядки списку від № from до кінця (там немає снів). */
function EmptyRows({ geo, rows, from }) {
  const top = rows[from][1] - 6
  return <Ov at={[geo.list[0], top, geo.list[1], LIST_BOTTOM - top, 16]} className="ov-none" style={{ background: COVER }} />
}

function EmptyList({ geo, rows, ctx }) {
  return (
    <>
      <EmptyRows geo={geo} rows={rows} from={0} />
      <Ov at={[geo.list[0], rows[0][1], geo.list[1], 520]} className="empty">
        <h3>{t('No dreams yet')}</h3>
        <p>{t('Record your first dream and its meaning will appear here.')}</p>
        <button type="button" className="cta" onClick={() => ctx.openModal({ name: 'dream' })}>{t('Add dream')}</button>
      </Ov>
    </>
  )
}

const common = (geoKey, list, rows, extraBind) => ({
  bind: [
    ...slots('l', list, FIELDS),
    { find: list[0][0], nth: 1, key: 'title' },
    { find: list[0][2], nth: 1, key: 'date' },
    ...extraBind,
  ],
  load: loadDreams,
  // доступна назва рядка списку — це заголовок реального сну, а не макетний (за макетом тут стояли вигадані сни)
  hitLabel: (label, values) => {
    const i = list.findIndex((row) => row[0] === label)
    return i >= 0 ? (values[`l${i}.title`] ?? '') : undefined
  },
  Under({ ctx }) {
    if (!ctx.data) return null
    const sel = ctx.data.index
    const have = ctx.data.dreams.length
    const geo = GEO[geoKey]
    if (have === 0) return <EmptyList geo={geo} rows={rows} ctx={ctx} />
    return (
      <>
        {have < rows.length && <EmptyRows geo={geo} rows={rows} from={have} />}
        {THUMBS.slice(0, have).map((at, i) => (
          <Ov key={i} at={at} className="tile ov-none">{TILE}</Ov>
        ))}
        <RowFrames rows={rows} selected={sel} />
      </>
    )
  },
})

async function removeDream(ctx, cur) {
  if (!window.confirm(t('Delete “{title}”?', { title: cur.title }))) return
  await api('DELETE', `/dreams/${cur.id}`)
  session.set('dreamId', '')
  await ctx.reload()
}

const pick = (ctx, i) => {
  const d = ctx.data?.dreams[i]
  if (!d) return false
  session.set('dreamId', d.id)
  return true
}

const NEW = [702, 233, 188, 52, 26]

export const dreams = {
  ...common('dreams', LIST_DREAMS, ROWS, [
    { find: 'Dream', key: 'kind' },
    { find: 'I was in an old house from my childhood. The rooms', drop: 4 },
    { find: 'This dream may symbolize a return to your', drop: 3 },
    ...['Childhood', 'House', 'Search', 'Light'].map((find, i) => ({ find, key: `tag${i}` })),
  ]),
  actions: Object.fromEntries(LIST_DREAMS.map(([label], i) => [label, async (ctx) => pick(ctx, i) && ctx.go('/analysis')])),
  Over({ ctx }) {
    const cur = ctx.data?.cur
    const del = () => removeDream(ctx, cur)
    return (
      <>
        <Zone at={NEW} label="New Entry" onClick={() => ctx.openModal({ name: 'dream' })} />
        {cur && <ArtFrame symbol={cur.symbols?.[0] ?? ''} at={[957, 320, 536, 167, 14]} caption />}
        {cur && (
          <>
            <Prose at={[966, 538, 490, 112]} text={cur.text} fs={22.36} lh={27} color="#eceae9" />
            <Prose at={[1072, 712, 400, 106]} text={cur.analysis?.interpretation ?? ''} fs={21.25} lh={26.5} color="#ebe9e8" />
            <Zone at={[1395, 233, 44, 44, 22]} label="Edit dream" onClick={() => ctx.openModal({ name: 'dream', dream: cur })} />
            <Zone at={[1445, 233, 46, 46, 23]} label="Delete dream" onClick={() => ctx.run(del)} />
          </>
        )}
        {!cur && ctx.data && <Ov at={[...GEO.dreams.detail, 22]} className="ov-none" style={{ background: COVER }} />}
        {ctx.modal?.name === 'dream' && <DreamModal ctx={ctx} dream={ctx.modal.dream} />}
      </>
    )
  },
}

export const analysis = {
  ...common('analysis', LIST_ANALYSIS, ROWS_ANALYSIS, [
    { find: 'Lucid Dream', key: 'kind' },
    { find: 'I was flying above the clouds, feeling light and free. The sky', drop: 2 },
    { find: 'Flying in a dream often symbolizes', drop: 6 },
    ...['Freedom', 'Growth', 'New opportunities'].map((find, i) => ({ find, key: `key${i}` })),
  ]),
  actions: { 'Add Dream': (ctx) => ctx.openModal({ name: 'dream' }) },
  Over({ ctx }) {
    const cur = ctx.data?.cur
    const del = () => removeDream(ctx, cur)
    return (
      <>
        {ROWS_ANALYSIS.slice(0, ctx.data?.dreams.length ?? 0).map((at, i) => (
          <Zone key={i} at={at} label={`Dream ${i + 1}`} onClick={() => pick(ctx, i) && ctx.reload()} />
        ))}
        {cur && (
          <>
            <ArtFrame symbol={cur.symbols?.[0] ?? ''} at={[906, 517, 219, 210, 22]} tile />
            <Zone at={[1380, 237, 48, 48, 24]} label="Edit dream" onClick={() => ctx.openModal({ name: 'dream', dream: cur })} />
            <Zone at={[1445, 236, 46, 48, 24]} label="Delete dream" onClick={() => ctx.run(del)} />
            <Prose at={[906, 378, 570, 78]} text={cur.text} fs={22.36} lh={29} color="#eeedeb" />
            <Prose at={[1153, 514, 335, 210]} text={cur.analysis?.interpretation ?? ''} fs={20.94} lh={29.5} color="#edecea" />
          </>
        )}
        {!cur && ctx.data && <Ov at={[...GEO.analysis.detail, 22]} className="ov-none" style={{ background: COVER }} />}
        {ctx.modal?.name === 'dream' && <DreamModal ctx={ctx} />}
      </>
    )
  },
}
