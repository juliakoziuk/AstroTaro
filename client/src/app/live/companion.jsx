// Екран AI Companion: вибір персони зліва, розмова справа (повідомлення зберігаються на сервері).
import { useEffect, useRef } from 'react'
import { get, post } from '../../lib/api.js'
import { formatTime } from '../format.js'
import { loadSettings, session } from './common.js'
import { t } from '../../i18n/index.js'
import { Ov, RowFrames, Zone } from './parts.jsx'

const PERSONAS = [
  ['Mystic Guide', 'Universal answers, life path', 'and inner balance'],
  ['Tarot Advisor', 'Card meanings, spreads', 'and interpretation'],
  ['Astrologer', 'Astrological insights', 'and forecasts'],
  ['Dream Interpreter', 'Dream analysis and symbolism'],
  ['Life Coach', 'Support, motivation', 'and personal growth'],
]
const ROWS = [[293, 224, 362, 112, 24], [297, 346, 353, 102, 24], [297, 460, 353, 102, 24], [297, 575, 353, 94, 24], [297, 681, 353, 104, 24]]
const CHAT = [692, 208, 574, 608, 22]

export const companion = {
  bind: [
    ...PERSONAS.flatMap(([name, ...desc], i) => [
      { find: name, key: `persona${i}.name`, maxw: 200 }, // праворуч — стрілка рядка
      // опис — один текст, що переноситься порівну на 2–3 рядки; усі описи списку мають один кегль (раніше кожен рядок
      // підганявся окремо: довгий — дрібно, короткий — звичайно)
      { find: desc[0], key: `persona${i}.desc`, flow: 3, balance: true, maxw: 205, group: 'personas' },
      ...(desc[1] ? [{ find: desc[1], drop: 1 }] : []),
    ]),
    { find: 'Hello, I’m your AI Companion', drop: 17 }, // намальовані репліки замінює <Chat>
  ],
  async load() {
    const [personas, settings] = await Promise.all([get('/companion/personas'), loadSettings()])
    const persona = personas.find((p) => p.id === session.get('persona'))?.id ?? personas[0].id // id персони стабільний, назва залежить від мови
    const messages = await get(`/messages?persona=${encodeURIComponent(persona)}`)
    const values = {}
    personas.forEach((p, i) => {
      values[`persona${i}.name`] = p.name
      values[`persona${i}.desc`] = p.description.join(' ')
    })
    return { values, data: { personas, persona, messages, settings, typing: false } }
  },
  actions: {
    ...Object.fromEntries(PERSONAS.map(([name], i) => [name, (ctx) => choose(ctx, i)])),
    Send: (ctx) => send(ctx),
  },
  Under: ({ ctx }) => <RowFrames rows={ROWS} selected={Math.max(0, ctx.data?.personas.findIndex((p) => p.id === ctx.data.persona) ?? 0)} dim />,
  Over({ ctx }) {
    return (
      <>
        <Zone at={ROWS[0]} label="Mystic Guide" onClick={() => choose(ctx, 0)} />
        <Zone at={ROWS[4]} label="Life Coach" onClick={() => choose(ctx, 4)} />
        {ctx.data && <Chat data={ctx.data} />}
      </>
    )
  },
}

function choose(ctx, i) {
  const p = ctx.data?.personas[i]
  if (!p) return
  session.set('persona', p.id)
  return ctx.reload()
}

async function send(ctx) {
  const el = ctx.field('msg')
  const text = el?.value.trim()
  if (!text || !ctx.data || ctx.data.typing) return
  const persona = ctx.data.persona
  el.value = ''
  const mine = { id: 'pending', role: 'user', text, createdAt: new Date().toISOString() }
  ctx.patchData((d) => ({ ...d, typing: true, messages: [...d.messages, mine] }))
  try {
    const { user, reply } = await post('/companion/chat', { persona, text, ...(!ctx.data.settings.autosave ? { history: ctx.data.messages.slice(-20).map(({ role, text }) => ({ role, text })) } : {}) })
    ctx.patchData((d) => ({ ...d, typing: false, messages: [...d.messages.filter((m) => m.id !== 'pending'), user, reply] }))
  } catch (e) {
    el.value = text
    ctx.patchData((d) => ({ ...d, typing: false, messages: d.messages.filter((m) => m.id !== 'pending') }))
    throw e
  }
}

function Chat({ data }) {
  const end = useRef(null)
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [data.messages.length, data.typing])
  const fmt = data.settings.timeFormat
  return (
    <Ov at={CHAT} className="chat" aria-live="polite">
      {!data.settings.companion && <div className="bubble">{t('AI Companion is turned off in Settings.')}</div>}
      {data.messages.length === 0 && data.settings.companion && <div className="bubble">{t('Hello, I’m your {persona}. What would you like to explore today?', { persona: data.personas.find((p) => p.id === data.persona)?.name ?? '' })}</div>}
      {data.messages.map((m) => (
        <div key={m.id} className={`bubble${m.role === 'user' ? ' me' : ''}`}>
          {m.text}
          <small>{formatTime(m.createdAt, fmt)}</small>
        </div>
      ))}
      {data.typing && <div className="bubble typing">…</div>}
      <div ref={end} />
    </Ov>
  )
}
