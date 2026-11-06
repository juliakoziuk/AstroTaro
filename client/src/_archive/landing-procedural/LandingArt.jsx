import Defs from './Defs.jsx'
import Portal from './Portal.jsx'
import { Candle, Holder, Urn, StarLight } from './Candles.jsx'
import {
  RightTopFoliage,
  BottomRightFoliage,
  BottomLeftFoliage,
  Fern,
  LeftOrnaments,
  RightBottomUnderPanel,
  ClutterLeft,
} from './Foliage.jsx'

export const ART_W = 981
export const ART_H = 640

function GhostArch() {
  return (
    <g>
      <path d="M418 446V172A72 86 0 0 1 562 172V446Z" fill="#0b1b33" stroke="#1b3152" strokeWidth="3" />
      <path d="M429 446V174A61 74 0 0 1 551 174V446Z" fill="none" stroke="#3a5478" strokeOpacity=".4" strokeWidth="1.4" />
      <path d="M437 446V176A53 65 0 0 1 543 176V446Z" fill="#081628" stroke="#13253f" strokeWidth="6" />
      <path d="M447 446V178A43 54 0 0 1 533 178V446Z" fill="#0a1c34" opacity=".8" />
      <path d="M408 446h164" stroke="#3a5478" strokeOpacity=".3" strokeWidth="4" />
    </g>
  )
}

export default function LandingArt() {
  return (
    <svg
      className="landing-art"
      viewBox={`0 0 ${ART_W} ${ART_H}`}
      preserveAspectRatio="xMaxYMid slice"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <Defs />

      {/* фон: нічна синь, дамаск, світіння */}
      <rect width={ART_W} height={ART_H} fill="url(#bgBase)" />
      <rect width={ART_W} height={ART_H} fill="url(#damask)" opacity=".1" />
      <rect width={ART_W} height={ART_H} fill="url(#damask)" opacity=".34" mask="url(#edgeMask)" />
      <ellipse cx="800" cy="230" rx="300" ry="270" fill="url(#bgGlowR)" opacity=".7" />
      <ellipse cx="170" cy="470" rx="300" ry="170" fill="#16335a" opacity=".22" filter="url(#blurL)" />

      <GhostArch />
      <LeftOrnaments />
      <RightTopFoliage />

      <g filter="url(#deepSh)">
        <Portal />
      </g>

      {/* свічки ліворуч */}
      <Fern />
      <g filter="url(#dropSh)">
        <Holder x={691} top={288} bottom={366} cup={13} base={26} />
        <Candle x={691} top={252} h={36} w={11} s={0.9} seed={2} />
        <Holder x={675} top={251} bottom={352} cup={16} arms={1} />
        <Candle x={675} top={211} h={40} w={12} seed={3} />
        <Candle x={704} top={336} h={36} w={14} seed={4} />
        <ellipse cx="704" cy="373" rx="12" ry="3" fill="#6f5b3b" opacity=".8" />
        <Candle x={737} top={366} h={8} w={7} s={0.55} seed={5} />
      </g>

      {/* свічки праворуч */}
      <g filter="url(#dropSh)">
        <Candle x={838} top={316} h={18} w={14} s={0.8} seed={6} />
        <Holder x={899} top={334} bottom={374} cup={12} base={22} />
        <Candle x={899} top={306} h={28} w={9} s={0.85} seed={7} />
        <Holder x={923} top={346} bottom={376} cup={14} base={24} />
        <Candle x={923} top={316} h={30} w={11} seed={8} />
        <Urn x={958} y={332} />
        <Candle x={958} top={236} h={96} w={17} lit={false} dim={0.75} seed={9} />
        <Candle x={941} top={283} h={68} w={15} seed={10} />
        <Holder x={941} top={348} bottom={382} cup={18} base={26} />
        <ellipse cx="941" cy="352" rx="10" ry="2.5" fill="#6f5b3b" />
      </g>

      <g filter="url(#deepSh)">
        <BottomLeftFoliage />
        <BottomRightFoliage />
      </g>
      <RightBottomUnderPanel />
      <ClutterLeft />

      {/* зірка-свічка вгорі */}
      <StarLight x={680} y={95} />
      <use href="#spark" x="740" y="52" width="14" height="14" opacity=".9" />
      <use href="#spark" x="40" y="74" width="20" height="20" opacity=".9" />
      <use href="#spark" x="880" y="86" width="12" height="12" opacity=".8" />

      {/* тінь підлоги, віньєтка, зерно */}
      <rect y="380" width={ART_W} height="260" fill="url(#floorFade)" />
      <rect width={ART_W} height={ART_H} fill="url(#vignette)" />
      <rect width={ART_W} height={ART_H} filter="url(#grain)" opacity=".12" style={{ mixBlendMode: 'overlay' }} />
    </svg>
  )
}
