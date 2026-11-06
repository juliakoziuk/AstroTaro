import { rng, f, spiral } from './gen.js'

/** Полум'я: y — основа (кінчик ґноту), s — масштаб. */
export function Flame({ x, y, s = 1, glow = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle cy="-9" r={28 * glow} fill="url(#flameGlow)" />
      <path d="M0 3C-4.8 1-4.4-6 0-17 4.4-6 4.8 1 0 3Z" fill="url(#flame)" />
      <path d="M0 2C-1.7 0-1.6-4 0-9 1.6-4 1.7 0 0 2Z" fill="#fffdf0" />
    </g>
  )
}

/** Свічка з воском, патьоками й полум'ям. */
export function Candle({ x, top, h, w = 12, s = 1, lit = true, dim = 1, seed = 1 }) {
  const r = rng(seed)
  const l = x - w / 2
  const drips = [0, 1].map((i) => {
    const dx = i ? w / 2 - 1.5 : -w / 2 + 1
    const len = 6 + r() * h * 0.3
    return `M${f(x + dx)} ${top}v${f(len)}q1.6 3 3 0v${f(-len + 1)}`
  })
  return (
    <g opacity={dim}>
      {lit && <ellipse cx={x} cy={top - 8} rx={w * 2.6} ry={w * 2.1} fill="#e8a24a" opacity=".16" filter="url(#blurM)" />}
      <rect x={l} y={top} width={w} height={h} rx="1.2" fill={lit ? 'url(#wax)' : '#5d4a37'} />
      {!lit && <rect x={l} y={top} width={w} height={h} rx="1.2" fill="url(#wax)" opacity=".28" />}
      <ellipse cx={x} cy={top} rx={w / 2} ry="2.3" fill={lit ? '#f5ecd2' : '#7d6a52'} />
      <ellipse cx={x} cy={top + h} rx={w / 2} ry="2.2" fill="#5a4e3a" opacity=".75" />
      <path d={drips.join('')} fill="#e6dab8" opacity=".55" />
      <path d={`M${l + 0.6} ${top + 2}v${h - 3}`} stroke="#fff6dc" strokeWidth=".8" opacity=".35" />
      <path d={`M${x} ${top}v-4`} stroke="#2e241a" strokeWidth=".9" />
      {lit && <Flame x={x} y={top - 3} s={s} />}
    </g>
  )
}

/** Позолочений свічник: ніжка з намистинами, чашка, основа, завитки-«руки». */
export function Holder({ x, top, bottom, cup = 16, arms = 0, base = 30 }) {
  const mid = (top + bottom) / 2
  const beads = [0.2, 0.42, 0.66].map((t) => top + (bottom - top) * t)
  return (
    <g stroke="#e3c78f" strokeWidth=".6" strokeOpacity=".7">
      <rect x={x - 1.6} y={top} width="3.2" height={bottom - top} fill="url(#goldH)" />
      {beads.map((y, i) => (
        <ellipse key={i} cx={x} cy={y} rx={4.6 - i * 0.6} ry="3.2" fill="url(#goldH)" />
      ))}
      <path
        d={`M${x - cup / 2} ${top - 1}h${cup}l-3 8h${-(cup - 6)}z`}
        fill="url(#goldH)"
      />
      <ellipse cx={x} cy={top - 1} rx={cup / 2 + 2} ry="2.2" fill="#c9a76e" />
      <path
        d={`M${x - base / 2} ${bottom}q${base / 2 - 2} -6 ${base / 2 - 2} -15 0 9 ${base / 2 - 2} 15z`}
        fill="url(#goldH)"
      />
      <ellipse cx={x} cy={bottom} rx={base / 2} ry="3" fill="#8d7549" />
      {arms > 0 && (
        <g fill="none" stroke="#c9a76e" strokeWidth="1.6" strokeOpacity=".85">
          <path d={`M${x} ${mid}q-14 2 -18 -10`} />
          <path d={spiral(x - 20, mid - 12, 7, 1.25, -1, 90)} strokeWidth="1.3" />
          <path d={`M${x} ${mid}q14 2 18 -10`} />
          <path d={spiral(x + 20, mid - 12, 7, 1.25, 1, 90)} strokeWidth="1.3" />
        </g>
      )}
    </g>
  )
}

/** Високий кубок-урна праворуч. */
export function Urn({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#e3c78f" strokeWidth=".6" strokeOpacity=".7">
      <path d="M-12 0q-6 12 0 24 4 9 12 11 8-2 12-11 6-12 0-24z" fill="url(#goldH)" />
      <path d="M-9 8q9 4 18 0M-10 17q10 5 20 0" fill="none" stroke="#2a2214" strokeOpacity=".6" />
      <path d="M-5 35h10l3 7h-16z" fill="#8d7549" />
      <ellipse cy="0" rx="13" ry="3" fill="#c9a76e" />
      <path d="M-9 14q-7-3-6 5M9 14q7-3 6 5" fill="none" stroke="#c9a76e" strokeWidth="1.5" />
    </g>
  )
}

/** Зірка-світло з променями (зліва вгорі). */
export function StarLight({ x, y }) {
  const rays = [0, 24, 48, 72, 96, 120, 150, 180, 205, 230, 260, 300, 330]
  return (
    <g>
      <circle cx={x} cy={y} r="34" fill="url(#flameGlow)" />
      <g stroke="#ffe2a0" strokeLinecap="round" opacity=".85">
        {rays.map((a, i) => {
          const L = 22 + ((i * 7) % 5) * 9
          const c = Math.cos((a * Math.PI) / 180)
          const s = Math.sin((a * Math.PI) / 180)
          return (
            <path
              key={a}
              d={`M${f(x + c * 7)} ${f(y + s * 7)}L${f(x + c * L)} ${f(y + s * L)}`}
              strokeWidth={i % 3 ? 0.5 : 0.9}
              strokeOpacity={i % 3 ? 0.55 : 0.9}
            />
          )
        })}
      </g>
      <rect x={x - 3} y={y + 7} width="6" height="14" fill="url(#wax)" />
      <Flame x={x} y={y + 7} s={0.8} glow={0.7} />
    </g>
  )
}
