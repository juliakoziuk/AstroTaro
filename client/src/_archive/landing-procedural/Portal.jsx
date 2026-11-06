import { rng, f, leaf, sScroll, sample, archPath } from './gen.js'

const CX = 816 // вісь арки
const FOOT = 341 // низ колон
const SHOULDER = 170

const SKY_CLIP = `M741 ${FOOT}V${SHOULDER}A75 75 0 0 1 891 ${SHOULDER}V${FOOT}Z`
const OUTER = `M723 ${FOOT}V${SHOULDER}A93 93 0 0 1 909 ${SHOULDER}V${FOOT}Z`
const MID = `M732 ${FOOT}V${SHOULDER}A84 84 0 0 1 900 ${SHOULDER}V${FOOT}Z`

// Мілкі «листочки» вздовж різьбленої смуги арки
const bandPts = sample(archPath({ cx: CX, r: 84, shoulder: SHOULDER, foot: FOOT - 6 }), 9)
const bandR = rng(5)
const bandMarks = bandPts.map((p, i) => {
  const side = i % 2 ? 1 : -1
  const l = leaf(p.x, p.y, 7.5, 2.6, p.a + side * 62 + (bandR() - 0.5) * 12)
  return { ...l, flower: i % 5 === 0, x: p.x, y: p.y }
})

const stars = (() => {
  const r = rng(99)
  return Array.from({ length: 70 }, () => ({
    x: 748 + r() * 136,
    y: 92 + r() * 240,
    r: 0.3 + r() * 0.9,
    o: 0.25 + r() * 0.6,
  })).filter((s) => {
    const dx = s.x - 816
    return s.y > SHOULDER || Math.hypot(dx, s.y - SHOULDER) < 72
  })
})()

const [sA, sB] = sScroll(13, 1.2)
const [sA2, sB2] = sScroll(9, 1.2)

function Spark({ x, y, s = 1, o = 1 }) {
  return <use href="#spark" x={x - 16 * s} y={y - 16 * s} width={32 * s} height={32 * s} opacity={o} />
}

function Scroll({ x, y, rot = 0, flip = 1, big = true, w = 1.6 }) {
  const [a, b] = big ? [sA, sB] : [sA2, sB2]
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip} 1)`} fill="none" strokeWidth={w}>
      <path d={a} />
      <path d={b} />
    </g>
  )
}

function Rosette8({ x, y, r = 8 }) {
  const petals = Array.from({ length: 8 }, (_, i) => leaf(x, y, r, r * 0.42, i * 45))
  return (
    <g>
      {petals.map((p, i) => (
        <path key={i} d={p.body} fill="#102744" stroke="#d3b680" strokeWidth=".6" />
      ))}
      <circle cx={x} cy={y} r={r * 0.28} fill="#d9bc84" />
    </g>
  )
}

export default function Portal() {
  return (
    <g>
      {/* сяйво за аркою */}
      <ellipse cx={CX} cy="215" rx="150" ry="190" fill="#e0b46a" opacity=".1" filter="url(#blurL)" />

      {/* зовнішня рама */}
      <path d={OUTER} fill="#0b1a2f" stroke="#7f6a45" strokeWidth="2" />
      <path d={MID} fill="url(#frameBand)" stroke="#2d4466" strokeWidth="1" />
      <path d={OUTER} fill="none" stroke="#e1c68d" strokeOpacity=".28" strokeWidth=".8" transform="translate(0 1)" />

      {/* різьба на смузі */}
      <g fill="none" stroke="#c9a76e" strokeWidth=".8" strokeOpacity=".8">
        <path
          d={`M727 ${FOOT}V${SHOULDER}A89 89 0 0 1 905 ${SHOULDER}V${FOOT}`}
          strokeDasharray="1.5 4"
          strokeWidth="1.3"
        />
        <path d={`M739 ${FOOT}V${SHOULDER}A77 77 0 0 1 893 ${SHOULDER}V${FOOT}`} stroke="#e1c68d" />
        {bandMarks.map((m, i) => (
          <g key={i}>
            <path d={m.body} fill="#0e2340" strokeOpacity=".9" />
            {m.flower && <circle cx={m.x} cy={m.y} r="2.1" fill="#d9bc84" stroke="none" />}
          </g>
        ))}
      </g>

      {/* медальйони на колонах */}
      {[
        [731, 176],
        [901, 176],
        [731, 266],
        [901, 266],
        [CX, 74],
      ].map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M0-9 7 0 0 9-7 0Z" fill="#0b1a2f" stroke="#e1c68d" strokeWidth="1" />
          <path d="M0-4.5 3.5 0 0 4.5-3.5 0Z" fill="none" stroke="#c9a76e" strokeWidth=".7" />
          <circle r="1.4" fill="#f1d79d" />
        </g>
      ))}
      {/* вінчання арки */}
      <g fill="none" stroke="#d9bc84" strokeWidth="1.2">
        <path d={`M${CX} 66V58m-6 6q6-12 12 0m-9-8q3-8 6 0`} />
        <path d={`M${CX - 20} 80q-8-6-14 2m34-2q8-6 14 2`} strokeOpacity=".7" />
      </g>

      {/* небо */}
      <clipPath id="skyClip">
        <path d={SKY_CLIP} />
      </clipPath>
      <g clipPath="url(#skyClip)">
        <rect x="738" y="80" width="156" height="270" fill="url(#sky)" />
        <rect x="738" y="80" width="156" height="270" filter="url(#clouds)" opacity=".5" />
        <ellipse cx="808" cy="216" rx="70" ry="70" fill="url(#moonGlow)" />
        {stars.map((s, i) => (
          <circle key={i} cx={f(s.x)} cy={f(s.y)} r={f(s.r)} fill="#e7d6ac" opacity={s.o} />
        ))}
        {/* внутрішня тонка арка + ґрати */}
        <g fill="none" stroke="#c9a76e" strokeOpacity=".5" strokeWidth=".8">
          <path d={`M767 300V176A49 49 0 0 1 865 176V300`} />
          <path d={`M775 300V178A41 41 0 0 1 857 178V300`} strokeOpacity=".3" />
          <path d="M760 214V316M768 232V316M868 214V316M876 232V316" strokeOpacity=".4" />
        </g>
        {/* підвіска */}
        <g stroke="#d9bc84" fill="none" strokeWidth=".9">
          <path d={`M${CX} 112V138`} />
          <path d={`M${CX - 5} 118h10M${CX - 4} 126h8`} strokeOpacity=".7" />
        </g>
        <path d={`M${CX} 138l5.5 6.5-5.5 6.5-5.5-6.5Z`} fill="#0f2442" stroke="#e1c68d" strokeWidth=".9" />
        <circle cx={CX} cy="144.5" r="1.6" fill="#f3dca8" />
        {/* півмісяць */}
        <mask id="moonCut">
          <rect x="740" y="150" width="140" height="140" fill="#000" />
          <circle cx="808" cy="216" r="37" fill="#fff" />
          <circle cx="817" cy="208" r="33" fill="#000" />
        </mask>
        <circle cx="808" cy="216" r="46" fill="url(#moonGlow)" opacity=".9" />
        <rect x="740" y="150" width="140" height="140" fill="#f4d89c" mask="url(#moonCut)" filter="url(#blurS)" opacity=".85" />
        <rect x="740" y="150" width="140" height="140" fill="url(#moon)" mask="url(#moonCut)" />
        <circle cx="817" cy="208" r="31" fill="#070f24" opacity=".35" />
        {/* крапки блиску на місяці */}
        {Array.from({ length: 26 }, (_, i) => {
          const r = rng(300 + i)
          const t = 0.55 + r() * 0.4
          const a = 120 + r() * 120
          return (
            <circle
              key={i}
              cx={f(808 + Math.cos((a * Math.PI) / 180) * 33 * t)}
              cy={f(216 + Math.sin((a * Math.PI) / 180) * 33 * t)}
              r={f(0.35 + r() * 0.55)}
              fill="#fff3cf"
              opacity={0.55 + r() * 0.4}
            />
          )
        })}
        {/* іскорки */}
        <Spark x={759} y={216} s={0.45} />
        <Spark x={833} y={133} s={0.4} o={0.9} />
        <Spark x={854} y={138} s={0.5} />
        <Spark x={768} y={162} s={0.3} o={0.7} />
        <Spark x={840} y={258} s={0.32} o={0.8} />
        <Spark x={760} y={104} s={0.25} o={0.7} />
        {/* ковані завитки у нижній частині неба */}
        <g fill="none" stroke="#d3b680" strokeOpacity=".9">
          <Scroll x={773} y={300} rot={-90} big />
          <Scroll x={860} y={296} rot={-90} flip={-1} big />
          <Scroll x={800} y={318} rot={0} big={false} w={1.2} />
          <Scroll x={832} y={318} rot={0} flip={-1} big={false} w={1.2} />
          <path d="M818 318V268q-3-14 10-20M814 318V276q3-10-6-16" strokeWidth="1.2" />
          <path d="M748 322c14-8 22-26 22-44" strokeWidth="1.3" />
          <path d="M886 322c-14-8-22-26-22-44" strokeWidth="1.3" />
        </g>
        <Rosette8 x={773} y={276} r={9} />
        <Rosette8 x={861} y={272} r={9} />
        <Rosette8 x={818} y={256} r={6} />
      </g>

      {/* колони по краях неба */}
      <g stroke="#c9a76e" strokeWidth=".8">
        <path d={`M739 ${FOOT}V262h14V${FOOT}Z`} fill="url(#stone)" />
        <path d={`M879 ${FOOT}V262h14V${FOOT}Z`} fill="url(#stone)" />
        <path d={`M735 262h22v6h-22zM875 262h22v6h-22z`} fill="#1b3457" />
        <path d={`M736 ${FOOT - 6}h20v6h-20zM876 ${FOOT - 6}h20v6h-20z`} fill="#1b3457" />
        <path d="M743 272v62M748 272v62M883 272v62M888 272v62" strokeOpacity=".55" fill="none" />
      </g>

      {/* ковані стійки з цибулинами */}
      <g fill="none" stroke="#d3b680" strokeWidth="1.4">
        <path d="M733 340v-48q-4-10 3-18" />
        <ellipse cx="733" cy="276" rx="5" ry="7" fill="#0f2442" />
        <path d="M733 269v-8m-4 4h8" strokeWidth="1" />
        <path d="M899 340v-48q4-10-3-18" />
        <ellipse cx="899" cy="276" rx="5" ry="7" fill="#0f2442" />
        <path d="M899 269v-8m-4 4h8" strokeWidth="1" />
      </g>

      {/* крісло-щит і вівтар */}
      <g>
        <path d="M740 366v-30q0-8 13-8t13 8v30q-13 8-26 0Z" fill="#0f2240" stroke="#d3b680" strokeWidth="1.3" />
        <path d="M745 358v-20q0-5 8-5t8 5v20q-8 5-16 0Z" fill="none" stroke="#c9a76e" strokeWidth=".8" />
        <path d="M753 340v14M747 347h12" stroke="#d3b680" strokeWidth=".9" />
        <circle cx="753" cy="337" r="2" fill="#e1c68d" />
        <rect x="770" y="338" width="92" height="30" fill="#0e2038" stroke="#8d7549" strokeWidth="1" />
        <rect x="770" y="338" width="92" height="5" fill="#1e3a5e" stroke="#c9a76e" strokeWidth=".7" />
        <g fill="none" stroke="#b69a67" strokeWidth=".8" opacity=".85">
          <path d="M776 354h80M776 360h80" />
          {Array.from({ length: 9 }, (_, i) => (
            <path key={i} d={`M${782 + i * 9.5} 347q4 4 0 8t0 4`} />
          ))}
        </g>
        <rect x="764" y="366" width="104" height="6" fill="#274467" stroke="#d3b680" strokeWidth=".9" />
      </g>

      {/* сходи */}
      <g>
        {[
          [372, 698, 872, 12],
          [384, 688, 880, 14],
          [398, 676, 892, 14],
          [412, 664, 900, 14],
          [426, 652, 908, 16],
        ].map(([y, x0, x1, h], i) => (
          <g key={i}>
            <path d={`M${x0} ${y}H${x1}l4 ${h}H${x0 - 4}Z`} fill={i % 2 ? '#0a182c' : '#0d1e38'} />
            <path d={`M${x0} ${y}H${x1}`} stroke="#d3b680" strokeWidth="1.1" strokeOpacity={0.85 - i * 0.1} />
            <path d={`M${x0 - 4} ${y + h}H${x1 + 4}`} stroke="#6f5b3b" strokeWidth=".8" />
            <g stroke="#9c8157" strokeWidth=".7" fill="none" opacity=".6">
              {Array.from({ length: 11 }, (_, k) => (
                <path key={k} d={`M${x0 + 6 + k * ((x1 - x0 - 12) / 10)} ${y + 3}q3 3 0 6`} />
              ))}
            </g>
          </g>
        ))}
        <path d="M646 438H912v6H646Z" fill="#06101f" opacity=".6" />
      </g>
    </g>
  )
}
