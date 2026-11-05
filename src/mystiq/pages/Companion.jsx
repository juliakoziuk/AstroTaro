import { useEffect, useRef, useState } from 'react'
import { useMystiq } from '../storeCore.js'
import { MOODS } from '../moods.js'
import { newId } from '../dates.js'
import { cardById } from '../tarotData.js'
import { Chip, PageHead } from '../ui.jsx'

const PROMPTS = ['Допоможи зрозуміти мій останній сон', 'Що повторюється в моїх розкладах?', 'Як змінювався мій настрій?', 'Мені трохи тривожно']

const CONSENTS = [
  { key: 'dreams', title: 'Мої сни', hint: 'Dream Journal: образи й емоції' },
  { key: 'journal', title: 'Мій щоденник', hint: 'Inner Journal: настрій і записи' },
  { key: 'spreads', title: 'Мої розклади', hint: 'Tarot Studio: карти та питання' },
]

function topOf(list) {
  const map = {}
  list.forEach((x) => (map[x] = (map[x] || 0) + 1))
  return Object.entries(map).sort((a, b) => b[1] - a[1])[0]
}

// Відповідь складається з шаблонів і даних, які користувачка дозволила використовувати.
function composeReply(text, { consent, dreams, journal, spreads }) {
  const t = text.toLowerCase()

  if (/не хочу жити|самогубств|завдати собі|вбити себе/.test(t)) {
    return 'Мені дуже шкода, що тобі так боляче. Я лише програма й не можу замінити живу підтримку. Будь ласка, зв’яжись просто зараз із близькою людиною або з гарячою лінією допомоги у твоїй країні. Якщо є ризик для життя, дзвони до екстрених служб. Ти не мусиш бути з цим сама.'
  }

  if (/сон|сни|приснил/.test(t)) {
    if (!consent.dreams) return 'Щоб говорити про твої сни, мені потрібен доступ до Dream Journal. Увімкни його праворуч або просто розкажи сон тут. Що найбільше запам’яталось?'
    const top = topOf(dreams.flatMap((d) => d.symbols))
    const last = dreams[0]
    if (!top) return 'У журналі поки немає снів. Запиши перший, і ми зможемо шукати повтори.'
    return `У твоїх снах найчастіше повертається образ «${top[0]}» (${top[1]} р.). Останній сон — «${last.title}» — ти пережила з відчуттям «${last.mood.toLowerCase()}». Де ще в житті зараз є щось схоже на цей образ або це відчуття?`
  }

  if (/розклад|карт|таро/.test(t)) {
    if (!consent.spreads) return 'Я не бачу твоїх розкладів, бо доступ вимкнено. Можеш дозволити його праворуч, а можеш розповісти, яка карта залишилась у думках.'
    const top = topOf(spreads.flatMap((s) => s.cards.map((c) => c.id)))
    const card = top && cardById(top[0])
    if (!card) return 'Розкладів ще немає. Спробуй один у Tarot Studio.'
    return `У твоїх розкладах найчастіше випадає «${card.name}» (${top[1]} р.). Ключові слова цієї карти: ${card.keywords.join(', ')}. Як ці слова звучать для тебе сьогодні?`
  }

  if (/настр|емоці|почувай/.test(t) || /тривож|важко|сум|втом/.test(t)) {
    if (!consent.journal) return 'Я можу подивитись на твій настрій за записами, якщо ти дозволиш доступ до Inner Journal (праворуч). Або розкажи, як ти почуваєшся зараз.'
    const recent = journal.slice(0, 5)
    const avg = recent.reduce((s, e) => s + e.mood, 0) / Math.max(recent.length, 1)
    const mood = MOODS[Math.round(avg) - 1]
    return `За останніми ${recent.length} записами твій настрій у середньому «${mood?.label.toLowerCase() ?? 'рівно'}». Що б ти хотіла зробити для себе сьогодні, навіть дрібне?`
  }

  const generic = [
    'Дякую, що поділилась. Що в цьому для тебе найважливіше?',
    'Я чую. А що ти відчуваєш у тілі, коли говориш про це?',
    'Цікаво. Якби в цій історії був один образ, яким би він був?',
  ]
  return generic[text.length % generic.length]
}

export default function Companion() {
  const store = useMystiq()
  const { messages, consent, dispatch } = store
  const [text, setText] = useState('')
  const [typing, setTyping] = useState(false)
  const threadRef = useRef(null)

  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, typing])

  function send(content) {
    const value = content.trim()
    if (!value || typing) return
    dispatch({ type: 'message_added', message: { id: newId('m'), role: 'me', text: value } })
    setText('')
    setTyping(true)
    setTimeout(() => {
      dispatch({ type: 'message_added', message: { id: newId('m'), role: 'ai', text: composeReply(value, store) } })
      setTyping(false)
    }, 1000)
  }

  return (
    <>
      <PageHead title="AI Companion">Тиха розмова про твої думки, сни й образи. Я використовую лише ті дані, які ти дозволила, і нічого не передбачаю.</PageHead>

      <div className="mq-chat">
        <section aria-label="Розмова">
          <div className="mq-thread" ref={threadRef} aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} className={`mq-msg ${m.role}`}>
                {m.text}
              </div>
            ))}
            {typing && (
              <div className="mq-msg ai" aria-label="Відповідь пишеться">
                <span className="mq-typing">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            )}
          </div>
          <div className="mq-chips" style={{ marginTop: 18 }}>
            {PROMPTS.map((p) => (
              <Chip key={p} onClick={() => send(p)}>
                {p}
              </Chip>
            ))}
          </div>
          <form
            className="mq-composer"
            onSubmit={(e) => {
              e.preventDefault()
              send(text)
            }}
          >
            <input className="mq-input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Напиши, що в тебе на душі…" aria-label="Повідомлення" />
            <button className="mq-btn mq-btn--lit" type="submit" disabled={!text.trim() || typing}>
              Надіслати
            </button>
          </form>
        </section>

        <aside className="mq-plaque" aria-label="Доступ до даних">
          <h2>Що я можу бачити</h2>
          <div className="mq-consent">
            {CONSENTS.map((c) => (
              <label key={c.key}>
                <input type="checkbox" checked={consent[c.key]} onChange={(e) => dispatch({ type: 'consent_changed', key: c.key, value: e.target.checked })} />
                <span>
                  {c.title}
                  <small>{c.hint}</small>
                </span>
              </label>
            ))}
          </div>
          <p className="mq-note">Дозволи можна змінити будь-коли. Без них я відповідаю лише на те, що ти пишеш у цій розмові. Ця розмова не замінює лікаря чи психотерапевта.</p>
        </aside>
      </div>
    </>
  )
}

