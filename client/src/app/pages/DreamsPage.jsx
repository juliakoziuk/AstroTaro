// Екрани Dream Journal і Dream Analysis: один набір даних (GET /dreams), різний вигляд правої панелі.
import { useEffect, useRef, useState } from 'react'
import { api, get, post } from '../../lib/api.js'
import { t, useLang } from '../../i18n/index.js'
import { formatDate, snippet } from '../format.js'
import AppPage from '../AppPage.jsx'
import { loadSettings, searchQuery, session } from '../live/common.js'
import { Field, Modal, TILE } from '../live/parts.jsx'
import { navProps } from '../router.js'
import { usePage } from '../usePage.js'
import { LoadError, Loading } from './parts.jsx'

async function load() {
  const search = session.get('dreamSearch') ?? ''
  const [dreams, settings] = await Promise.all([get(`/dreams${searchQuery(search)}`), loadSettings()])
  return { dreams, search, dateFormat: settings.dateFormat }
}

/** Картина з колекції Met Museum (суспільне надбання) до першого символу сну; поки вантажиться чи якщо її немає — плитка. */
function Art({ symbol }) {
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
  if (!data) return <div className="ap-art ph" aria-hidden="true">{TILE}</div>
  const credit = `${data.title} — ${data.artist} · ${data.source}`
  return (
    <div className="ap-art">
      <a href={data.url} target="_blank" rel="noreferrer" title={credit}><img src={data.image} alt={data.title} /></a>
      <small>{credit}</small>
    </div>
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

/** Пошук у списку: текст або #тег; шукає після короткої паузи в наборі. */
function SearchBox({ ctx, value }) {
  const timer = useRef(0)
  useEffect(() => () => clearTimeout(timer.current), [])
  const change = (e) => {
    const text = e.target.value
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      session.set('dreamSearch', text)
      ctx.reload()
    }, 350)
  }
  return <input className="ap-search" type="search" defaultValue={value} onChange={change} placeholder={t('Search or #tag')} aria-label={t('Search dreams')} maxLength={100} />
}

async function removeDream(ctx, cur) {
  if (!window.confirm(t('Delete “{title}”?', { title: cur.title }))) return
  await api('DELETE', `/dreams/${cur.id}`)
  session.set('dreamId', '')
  await ctx.reload()
}

function DreamsPage({ analysis }) {
  useLang()
  const page = usePage(load)
  const { ctx } = page
  const [, bump] = useState(0)
  const picked = session.get('dreamId') // вибір живе в сесії: так нове чи змінене через вікно теж виділяється
  const dreams = page.data?.dreams ?? []
  const cur = dreams.find((d) => d.id === picked) ?? dreams[0]
  const searching = !!page.data?.search
  const choose = (d) => {
    session.set('dreamId', d.id)
    bump((n) => n + 1)
  }
  const symbols = cur?.symbols ?? []
  const key = cur?.analysis?.keyMeanings ?? []

  return (
    <AppPage
      title={analysis ? t('Dream Analysis') : t('Dream Journal')}
      subtitle={analysis ? t('Deep insights into the meaning of your dreams') : t('Record, analyze and uncover the meaning of your dreams')}
      back={analysis ? 'back:/dreams' : 'back:/dashboard'}
      actions={<button type="button" className="ap-btn primary" onClick={() => ctx.openModal({ name: 'dream' })}>{t(analysis ? 'Add Dream' : 'New Entry')}</button>}
    >
      <LoadError page={page} />
      {!page.data && page.status === 'loading' && <Loading />}
      {page.data && (
        <div className="ap-cols list">
          <section className="ap-panel">
            <h2>{t('My Dreams')}</h2>
            <SearchBox ctx={ctx} value={page.data.search} />
            <ul className="ap-list" style={{ marginTop: '1rem' }}>
              {dreams.map((d) => (
                <li key={d.id}>
                  <button type="button" className="ap-row" aria-pressed={d.id === cur?.id} onClick={() => choose(d)}>
                    <span className="thumb" aria-hidden="true">{TILE}</span>
                    <span className="grow">
                      <b>{d.title}</b>
                      <small>{snippet(d.text)}</small>
                      <small className="when"><time>{formatDate(d.date, page.data.dateFormat)}</time></small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {dreams.length === 0 && (
              <div className="ap-empty">
                <h3>{searching ? t('Nothing found') : t('No dreams yet')}</h3>
                <p>{searching ? t('Try another word or clear the search.') : t('Record your first dream and its meaning will appear here.')}</p>
                <button type="button" className="ap-btn primary" onClick={() => (searching ? (session.set('dreamSearch', ''), ctx.reload()) : ctx.openModal({ name: 'dream' }))}>
                  {searching ? t('Clear search') : t('Add dream')}
                </button>
              </div>
            )}
          </section>

          {cur && (
            <section className="ap-panel">
              <header>
                <h2>{cur.title}</h2>
                <span className="ap-actions" style={{ margin: 0 }}>
                  <button type="button" className="ap-btn" aria-label={t('Edit dream')} onClick={() => ctx.openModal({ name: 'dream', dream: cur })}>{t('Edit dream')}</button>
                  <button type="button" className="ap-btn danger" aria-label={t('Delete dream')} onClick={() => ctx.run(() => removeDream(ctx, cur))}>{t('Delete dream')}</button>
                </span>
              </header>
              <p className="ap-muted">{formatDate(cur.date, page.data.dateFormat)}{cur.kind ? ` · ${cur.kind}` : ''}</p>
              <Art symbol={symbols[0] ?? ''} />
              {analysis ? (
                <>
                  <h3 className="ap-section">{t('Dream Summary')}</h3>
                  <p className="ap-prose">{cur.text}</p>
                  <h3 className="ap-section">{t('Analysis')}</h3>
                  <p className="ap-prose">{cur.analysis?.interpretation ?? ''}</p>
                  {key.length > 0 && (
                    <>
                      <h3 className="ap-section">{t('Key Meanings')}</h3>
                      <div className="ap-chips">{key.map((k) => <span className="ap-chip" key={k}>{k}</span>)}</div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <h3 className="ap-section">{t('My Dream')}</h3>
                  <p className="ap-prose">{cur.text}</p>
                  <h3 className="ap-section">{t('Interpretation')}</h3>
                  <p className="ap-prose">{cur.analysis?.interpretation ?? ''}</p>
                </>
              )}
              {symbols.length > 0 && (
                <>
                  <h3 className="ap-section">{t('Tags')}</h3>
                  <div className="ap-chips">{symbols.map((s) => <span className="ap-chip" key={s}>{s}</span>)}</div>
                </>
              )}
              {!analysis && (
                <div className="ap-actions">
                  <a className="ap-btn" {...navProps('/analysis')} onClick={(e) => { session.set('dreamId', cur.id); navProps('/analysis').onClick(e) }}>{t('Dream Analysis')}</a>
                </div>
              )}
            </section>
          )}
        </div>
      )}
      {ctx.modal?.name === 'dream' && <DreamModal ctx={ctx} dream={ctx.modal.dream} />}
    </AppPage>
  )
}

export const Dreams = () => <DreamsPage analysis={false} />
export const Analysis = () => <DreamsPage analysis />
