import { leaf, vine, rosette, spiral } from './gen.js'

const STROKE = '#b59868'

function Leaves({ items, lit = '#33608a', litOp = 0.5, stroke = STROKE, sw = 0.7, fill = 'url(#leafFill)' }) {
  return items.map((l, i) => (
    <g key={i}>
      <path d={l.body} fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      <path d={l.half} fill={lit} opacity={litOp} />
      <path d={l.vein} fill="none" stroke={stroke} strokeWidth=".5" opacity=".5" />
    </g>
  ))
}

function Vine({ cfg, sw = 1.3, ...rest }) {
  const v = vine(cfg)
  return (
    <g>
      <path d={v.d} fill="none" stroke="url(#goldLine)" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
      <Leaves items={v.leaves} {...rest} />
    </g>
  )
}

function Rosette({ x, y, R, seed, litOp = 0.45 }) {
  return (
    <g>
      <circle cx={x} cy={y} r={R * 1.05} fill="#040b16" opacity=".5" filter="url(#blurS)" />
      <Leaves items={rosette(x, y, R, seed)} litOp={litOp} lit="#4a7aa3" fill="#10294a" />
      <circle cx={x} cy={y} r={R * 0.1} fill="#d6b97f" opacity=".7" />
    </g>
  )
}

function Mushroom({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} stroke="#c9a76e" strokeWidth=".7">
      <path d="M-3 0q-1 8-3 12h12q-2-4-3-12z" fill="#5b4a33" />
      <path d="M-18 0q18-20 36 0z" fill="#7a6240" />
      <path d="M-18 0q18 5 36 0" fill="none" />
      <path d="M-11-4q5-6 11-7" fill="none" opacity=".6" />
    </g>
  )
}

// Конфіги листя — на рівні модуля (чисті функції, рахуємо раз)
const bigLeaves = [
  leaf(981, 70, 86, 30, 168),
  leaf(981, 128, 100, 34, 196),
  leaf(981, 196, 92, 32, 212),
  leaf(981, 262, 76, 26, 226),
  leaf(960, 28, 70, 22, 128),
]

export function RightTopFoliage() {
  return (
    <g>
      <Leaves items={bigLeaves} litOp={0.32} lit="#3b6a94" sw={1} />
      <Vine cfg={{ x: 981, y: 245, ang: 198, len: 190, curl: 0.9, seed: 3, leafLen: 28, every: 4 }} />
      <Vine cfg={{ x: 981, y: 150, ang: 188, len: 150, curl: -0.85, seed: 8, leafLen: 26, every: 4 }} />
      <Vine cfg={{ x: 965, y: 24, ang: 150, len: 150, curl: 0.75, seed: 12, leafLen: 24, every: 4 }} />
      <Vine cfg={{ x: 981, y: 330, ang: 214, len: 110, curl: 0.8, seed: 5, leafLen: 20, every: 4 }} />
    </g>
  )
}

export function BottomRightFoliage() {
  return (
    <g>
      <Vine cfg={{ x: 981, y: 420, ang: 190, len: 140, curl: -0.6, seed: 21, leafLen: 22, every: 3 }} />
      <Vine cfg={{ x: 800, y: 446, ang: 330, len: 110, curl: -0.7, seed: 22, leafLen: 20, every: 3 }} />
      <Rosette x={888} y={426} R={38} seed={31} />
      <Rosette x={942} y={430} R={32} seed={32} />
      <Rosette x={846} y={440} R={26} seed={33} />
      <Rosette x={968} y={402} R={24} seed={34} />
      <Rosette x={915} y={448} R={22} seed={35} />
    </g>
  )
}

export function BottomLeftFoliage() {
  return (
    <g>
      <Mushroom x={598} y={394} s={0.9} />
      <Mushroom x={632} y={412} s={0.7} />
      <Vine cfg={{ x: 560, y: 446, ang: 300, len: 110, curl: 0.7, seed: 41, leafLen: 20, every: 3 }} />
      <Vine cfg={{ x: 760, y: 446, ang: 215, len: 100, curl: 0.7, seed: 42, leafLen: 18, every: 3 }} />
      <Rosette x={690} y={428} R={34} seed={51} />
      <Rosette x={640} y={436} R={26} seed={52} />
      <Rosette x={736} y={440} R={24} seed={53} />
      <Rosette x={596} y={442} R={22} seed={54} />
    </g>
  )
}

/** Папороть, що виглядає з-за лівого свічника. */
export function Fern() {
  return (
    <g opacity=".8">
      <Vine
        cfg={{ x: 688, y: 352, ang: 232, len: 110, curl: 0.55, seed: 61, leafLen: 20, every: 1, spread: 62 }}
        sw={1}
        lit="#2b5378"
        litOp={0.5}
      />
      <Vine
        cfg={{ x: 690, y: 350, ang: 262, len: 80, curl: 0.5, seed: 62, leafLen: 16, every: 1, spread: 62 }}
        sw={1}
      />
    </g>
  )
}

/** Тьмяні орнаменти по лівому краю. */
export function LeftOrnaments() {
  return (
    <g opacity=".6">
      <Vine cfg={{ x: 0, y: 62, ang: 25, len: 100, curl: 1.0, seed: 71, leafLen: 12, every: 3 }} sw={1} />
      <Vine cfg={{ x: 0, y: 120, ang: -20, len: 70, curl: -1.1, seed: 72, leafLen: 11, every: 3 }} sw={1} />
      <g fill="none" stroke="url(#goldLine)" strokeWidth="1">
        <circle cx="-6" cy="238" r="21" />
        <circle cx="-6" cy="238" r="15" strokeDasharray="1.5 3" />
        <path d={spiral(8, 214, 10, 1.2, 1, 40)} />
      </g>
      <Vine cfg={{ x: 0, y: 392, ang: 330, len: 90, curl: 1.0, seed: 73, leafLen: 14, every: 3 }} sw={1} />
      <Rosette x={26} y={428} R={28} seed={74} litOp={0.35} />
      <Rosette x={80} y={444} R={22} seed={75} litOp={0.35} />
      <Rosette x={-4} y={466} R={24} seed={76} litOp={0.35} />
      <Vine cfg={{ x: 40, y: 640, ang: 285, len: 90, curl: -0.9, seed: 77, leafLen: 14, every: 3 }} sw={1} />
    </g>
  )
}

/** Щільне листя й воскові «пеньки» зліва від сходів + смуга по низу сцени (як у референсі). */
export function ClutterLeft() {
  return (
    <g opacity=".85" filter="url(#dropSh)">
      {[
        [606, 330, 11, 46],
        [624, 352, 9, 30],
        [584, 372, 8, 24],
      ].map(([x, y, w, h], i) => (
        <g key={i}>
          <rect x={x} y={y} width={w} height={h} rx="2" fill="#2a2a2c" stroke="#8d7549" strokeWidth=".7" />
          <path d={`M${x} ${y}q${w / 2} -6 ${w} 0`} fill="#4a4538" />
        </g>
      ))}
      <Vine cfg={{ x: 520, y: 446, ang: 270, len: 90, curl: 0.8, seed: 91, leafLen: 18, every: 3 }} sw={1} />
      <Rosette x={560} y={440} R={24} seed={92} />
      <Rosette x={22} y={600} R={26} seed={93} litOp={0.3} />
      <Rosette x={120} y={470} R={26} seed={94} litOp={0.3} />
      <Rosette x={175} y={450} R={20} seed={95} litOp={0.3} />
      <Vine cfg={{ x: 150, y: 460, ang: 300, len: 110, curl: 0.9, seed: 96, leafLen: 15, every: 3 }} sw={1} />
      <Vine cfg={{ x: 0, y: 560, ang: 340, len: 120, curl: -0.9, seed: 97, leafLen: 15, every: 3 }} sw={1} />
      <Vine cfg={{ x: 981, y: 560, ang: 200, len: 120, curl: 0.9, seed: 98, leafLen: 15, every: 3 }} sw={1} />
      <Vine cfg={{ x: 300, y: 640, ang: 255, len: 100, curl: 0.8, seed: 99, leafLen: 15, every: 3 }} sw={1} />
      <Vine cfg={{ x: 700, y: 640, ang: 285, len: 100, curl: -0.8, seed: 100, leafLen: 15, every: 3 }} sw={1} />
    </g>
  )
}

export function RightBottomUnderPanel() {
  return (
    <g opacity=".55">
      <Vine cfg={{ x: 981, y: 640, ang: 250, len: 90, curl: 0.9, seed: 81, leafLen: 14, every: 3 }} sw={1} />
    </g>
  )
}
