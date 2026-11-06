import { useEffect, useId, useState } from 'react'

export function PageHead({ title, children }) {
  return (
    <header className="mq-head">
      <h1>{title}</h1>
      {children && <p>{children}</p>}
    </header>
  )
}

// Ромб-розділювач: тонка золота лінія з зіркою посередині
export function Rule() {
  return (
    <div className="mq-rule" aria-hidden="true">
      <span />
      <i />
      <span />
    </div>
  )
}

export function Chip({ children, active, onClick, tone }) {
  const Tag = onClick ? 'button' : 'span'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`mq-chip ${active ? 'is-on' : ''} ${tone ? `tone-${tone}` : ''}`}
      onClick={onClick}
    >
      {children}
    </Tag>
  )
}

// Поступове «набирання» тексту; для нового тексту ставте інший key
export function Typewriter({ text, speed = 18 }) {
  const [n, setN] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setN((v) => (v >= text.length ? v : v + 2)), speed)
    return () => clearInterval(id)
  }, [text, speed])

  return (
    <span>
      {text.slice(0, n)}
      {n < text.length && <span className="mq-caret" />}
    </span>
  )
}

// Лінія настрою: values — числа 1–5 або null
export function Sparkline({ values, width = 240, height = 70 }) {
  const id = useId()
  const pts = values
    .map((v, i) => (v == null ? null : [(i / (values.length - 1)) * (width - 16) + 8, height - 10 - ((v - 1) / 4) * (height - 22)]))
  const real = pts.filter(Boolean)
  const d = real.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Настрій за тиждень">
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop offset="0" stopColor="#8d7239" />
          <stop offset="1" stopColor="#f3dfa8" />
        </linearGradient>
      </defs>
      <path d={`M8 ${height - 10}H${width - 8}`} stroke="rgba(217,181,106,0.2)" strokeDasharray="2 4" />
      {real.length > 1 && <path d={d} fill="none" stroke={`url(#${id})`} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />}
      {real.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#0b0716" stroke="#f3dfa8" strokeWidth="1.2" />
      ))}
    </svg>
  )
}
