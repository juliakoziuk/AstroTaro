import { Component, useMemo, useState } from 'react'
import { useRenderCount } from './kit.js'

// Ловить помилки рендера дочірніх компонентів, щоб один зламаний приклад
// не клав усю сторінку. Error boundary можна написати тільки класом.
export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="crash">
          <strong>React впав з помилкою:</strong>
          <pre>{this.state.error.message}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

// Текст з `кодом` у зворотних лапках → <code>, а **жирний** → <strong>
export function Rich({ text }) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/).map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 1) return <code key={i}>{part.slice(1, -1)}</code>
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return <strong key={i}>{part.slice(2, -2)}</strong>
    return part
  })
}

export function P({ children }) {
  return (
    <p>
      <Rich text={children} />
    </p>
  )
}

export function Bullets({ items }) {
  return (
    <ul className="bullets">
      {items.map((t, i) => (
        <li key={i}>
          <Rich text={t} />
        </li>
      ))}
    </ul>
  )
}

// rows: [[правило, приклад], ...]
export function Rules({ head = ['Правило', 'Приклад'], rows }) {
  return (
    <table className="rules">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>
                <Rich text={cell} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function Section({ title, children }) {
  return (
    <section className="section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export function CodeBlock({ code }) {
  return (
    <pre className="code">
      <code>{code.trim()}</code>
    </pre>
  )
}

// Рамка для живого результату коду
export function Demo({ title = 'Що бачимо в браузері', children }) {
  return (
    <div className="demo">
      <div className="demo-title">{title}</div>
      <ErrorBoundary>{children}</ErrorBoundary>
    </div>
  )
}

// «Екран телефону» для прикладів у стилі React Native
export function PhoneFrame({ children, height = 560 }) {
  return (
    <div className="phone" style={{ height }}>
      <div className="phone-screen">
        <ErrorBoundary>{children}</ErrorBoundary>
      </div>
    </div>
  )
}

// Лічильник перерендерів (для уроку про оптимізацію)
export function RenderBadge({ label }) {
  const ref = useRenderCount()
  return (
    <span className="render-badge">
      {label}: оновлень <b ref={ref}>1</b>
    </span>
  )
}

// Один «зламаний» приклад: код, результат (якщо код компілюється) і відповідь під спойлером.
// Live — компонент з цим кодом; якщо його немає, значить код не компілюється (або небезпечний) і показується лише текст.
export function Bug({ number, title, code, Live, compileError, tryIt, phone, answer, fixedCode, choices }) {
  const [picked, setPicked] = useState(null) // оригінальний індекс обраного варіанта (0 — правильний)
  const [open, setOpen] = useState(false)
  // порядок варіантів перемішується, правильний завжди має оригінальний індекс 0
  const order = useMemo(
    () => (choices ? shuffledOrder(choices.length, number * 131 + title.length * 7) : []),
    [choices, number, title],
  )

  return (
    <article className="bug">
      <h3>
        Помилка {number}: {title}
      </h3>
      <CodeBlock code={code} />
      {Live ? (
        <Demo>
          {tryIt && (
            <p className="try-it">
              👉 <Rich text={tryIt} />
            </p>
          )}
          {phone ? (
            <PhoneFrame height={phone === true ? 260 : phone}>
              <Live />
            </PhoneFrame>
          ) : (
            <Live />
          )}
        </Demo>
      ) : (
        <div className="demo compile">
          <div className="demo-title">Цей код не показуємо наживо</div>
          <p>
            <Rich text={compileError} />
          </p>
        </div>
      )}
      {choices && (
        <div className="bug-quiz">
          <p className="q-text">
            <strong>Що тут не так?</strong> Обери причину:
          </p>
          <div className="options">
            {order.map((j, pos) => {
              let state = ''
              if (picked !== null && j === 0) state = ' right'
              else if (picked !== null && j === picked) state = ' wrong'
              return (
                <button
                  key={j}
                  className={'option' + state}
                  disabled={picked !== null}
                  onClick={() => {
                    setPicked(j)
                    setOpen(true) // після відповіді відкриваємо повне пояснення
                  }}
                >
                  <span className="letter">{LETTERS[pos]}</span>
                  <span>
                    <Rich text={choices[j]} />
                  </span>
                </button>
              )
            })}
          </div>
          {picked !== null && (
            <div className={picked === 0 ? 'explain good' : 'explain bad'}>
              <strong>
                {picked === 0
                  ? 'Правильно! '
                  : `Не зовсім. Правильна відповідь ${LETTERS[order.indexOf(0)]}. `}
              </strong>
              Нижче — розбір і виправлений код.
            </div>
          )}
        </div>
      )}
      <details open={open} onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary>{choices ? 'Розбір і виправлений код' : 'Спочатку подумай сама, потім відкрий відповідь'}</summary>
        <p>
          <Rich text={answer} />
        </p>
        <CodeBlock code={fixedCode} />
      </details>
    </article>
  )
}

const LETTERS = ['A', 'B', 'C', 'D']

// Детермінований «перемішувач»: порядок варіантів залежить від seed, а не від Math.random()
function shuffledOrder(n, seed) {
  const order = Array.from({ length: n }, (_, i) => i)
  let s = seed
  const random = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

// Тест: питання з варіантами, після відповіді — пояснення. Результат у кінці.
// Порядок варіантів перемішується, і щоразу інакше після «Почати заново».
// question: { text, code?, options: [..], correct: індекс, explanation, topic? }
export function Quiz({ questions }) {
  const [answers, setAnswers] = useState({})
  const [round, setRound] = useState(1)
  const orders = useMemo(
    () => questions.map((q, i) => shuffledOrder(q.options.length, round * 7919 + i * 104729 + q.text.length)),
    [questions, round],
  )
  const answeredCount = Object.keys(answers).length
  const score = questions.filter((q, i) => answers[i] === q.correct).length

  const byTopic = {}
  questions.forEach((q, i) => {
    if (!q.topic) return
    const t = (byTopic[q.topic] ??= { total: 0, right: 0 })
    t.total += 1
    if (answers[i] === q.correct) t.right += 1
  })
  const topics = Object.entries(byTopic)

  return (
    <div className="quiz">
      {questions.map((q, i) => {
        const chosen = answers[i]
        const isAnswered = chosen !== undefined
        return (
          <div className="question" key={i}>
            <p className="q-text">
              <strong>{i + 1}.</strong> {q.topic && <span className="topic-tag">{q.topic}</span>}{' '}
              <Rich text={q.text} />
            </p>
            {q.code && <CodeBlock code={q.code} />}
            <div className="options">
              {orders[i].map((j, pos) => {
                let state = ''
                if (isAnswered && j === q.correct) state = ' right'
                else if (isAnswered && j === chosen) state = ' wrong'
                return (
                  <button
                    key={j}
                    className={'option' + state}
                    disabled={isAnswered}
                    onClick={() => setAnswers((prev) => ({ ...prev, [i]: j }))}
                  >
                    <span className="letter">{LETTERS[pos]}</span>
                    <span>
                      <Rich text={q.options[j]} />
                    </span>
                  </button>
                )
              })}
            </div>
            {isAnswered && (
              <div className={chosen === q.correct ? 'explain good' : 'explain bad'}>
                <strong>
                  {chosen === q.correct
                    ? 'Правильно! '
                    : `Ні, правильна відповідь ${LETTERS[orders[i].indexOf(q.correct)]}. `}
                </strong>
                <Rich text={q.explanation} />
              </div>
            )}
          </div>
        )
      })}

      <div className="quiz-score">
        {answeredCount < questions.length ? (
          <span>
            Відповіла на {answeredCount} з {questions.length}
          </span>
        ) : (
          <>
            <strong>
              Результат: {score} з {questions.length}
            </strong>
            <span>
              {score === questions.length
                ? ' — ідеально, тему засвоєно!'
                : score >= questions.length * 0.7
                  ? ' — добре! Перечитай пояснення до помилок.'
                  : ' — варто ще раз пройтись по урокам та прикладах з помилками.'}
            </span>
          </>
        )}
        {answeredCount > 0 && (
          <button
            onClick={() => {
              setAnswers({})
              setRound((r) => r + 1) // новий порядок варіантів
            }}
          >
            Почати заново
          </button>
        )}
      </div>

      {answeredCount === questions.length && topics.length > 0 && (
        <div className="topic-results">
          <h3>Результат по темах</h3>
          <ul>
            {topics.map(([name, t]) => (
              <li key={name} className={t.right === t.total ? 'ok' : t.right / t.total >= 0.6 ? 'mid' : 'low'}>
                <span>{name}</span>
                <span>
                  {t.right} з {t.total}
                  {t.right === t.total ? ' ✅' : t.right / t.total >= 0.6 ? ' 🙂 повтори уважніше' : ' ⚠️ повернись до уроку'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
