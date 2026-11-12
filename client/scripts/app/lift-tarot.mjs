// Екран Tarot Studio без вибору колоди (колода одна): прибирає намальовану картку «Select a deck» і піднімає на її місце
// картку «Reading mode» та кнопку «Start Reading» — і на плиті (src/app/art/tarot.webp), і в даних екрана (src/app/data/tarot.json).
// Запускати ПІСЛЯ node scripts/app/build.mjs tarot (він малює плиту з макета, де картка колоди ще є), далі плиту 2x:
//   node scripts/app/lift-tarot.mjs && node scripts/app/plate2x.mjs tarot
// Повторний запуск на вже піднятому екрані нічого не робить (у даних є позначка «lifted»).
import { readFileSync, writeFileSync } from 'node:fs'
import sharp from 'sharp'

sharp.cache(false) // інакше на Windows файл лишається зайнятим і його не перезаписати

const PLATE = 'src/app/art/tarot.webp'
const DATA = 'src/app/data/tarot.json'
// у координатах плити 1536 x 1024
const DY = 180 // на скільки піднімаємо: від верху картки колоди (243) до верху картки режиму (423)
const BLOCK = { x0: 796, x1: 1274, y0: 410, y1: 823 } // картка режиму, кнопка й фон між ними (з запасом навколо)
const COLUMN_X = 800 // усе правіше за цю межу й нижче за BLOCK.y0 піднімається разом із плитою
const FEATHER = 8
// угорі праворуч намальовані карти Таро: вони заходять на верх картки колоди, тож цю ділянку лишаємо як на макеті
const KEEP = { x0: 1070, y1: 300 }

const data = JSON.parse(readFileSync(DATA, 'utf8'))
if (data.lifted) {
  console.log('вже піднято, нічого не роблю')
  process.exit(0)
}

// ---------- плита ----------
const { data: src, info } = await sharp(PLATE).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const { width: W, height: H } = info
if (W !== 1536 || H !== 1024) throw new Error(`очікувалась плита 1536x1024, а тут ${W}x${H}`)
const at = (x, y) => (y * W + x) * 3
const out = Buffer.from(src)
const mix = (to, from, w) => {
  for (let c = 0; c < 3; c++) out[to + c] = Math.round(out[to + c] * (1 - w) + from[c] * w)
}

// 1) фон на місці, яке звільняється (нижче піднятого блоку): у кожному рядку плавний перехід від кольору зліва до кольору справа,
// плюс легке зерно, щоб заливка не виглядала пласкою
const side = (x, y) => [0, 1, 2].map((c) => [-2, -1, 0, 1, 2].reduce((s, d) => s + src[at(x + d, y) + c], 0) / 5)
const noise = () => (Math.random() + Math.random() + Math.random() - 1.5) * 2.2
const FILL = { y0: BLOCK.y1 - DY - FEATHER, y1: BLOCK.y1 + FEATHER }
for (let y = FILL.y0; y <= FILL.y1; y++) {
  const left = side(BLOCK.x0 - 8, y)
  const right = side(BLOCK.x1 + 8, y)
  for (let x = BLOCK.x0; x <= BLOCK.x1; x++) {
    const t = (x - BLOCK.x0) / (BLOCK.x1 - BLOCK.x0)
    const edge = Math.min(y - FILL.y0, FILL.y1 - y, 255) / FEATHER
    const w = Math.min(1, edge)
    const n = noise()
    mix(at(x, y), [0, 1, 2].map((c) => left[c] * (1 - t) + right[c] * t + n), w)
  }
}

// 2) сам блок, піднятий на DY, з м'якими краями; ділянку з картами Таро не чіпаємо
for (let y = BLOCK.y0; y <= BLOCK.y1; y++) {
  for (let x = BLOCK.x0; x <= BLOCK.x1; x++) {
    const dy = y - DY
    if (x >= KEEP.x0 && dy <= KEEP.y1) continue
    const edge = Math.min(x - BLOCK.x0, BLOCK.x1 - x, y - BLOCK.y0, BLOCK.y1 - y)
    const w = Math.min(1, (edge + 1) / FEATHER)
    const from = at(x, y)
    mix(at(x, dy), [src[from], src[from + 1], src[from + 2]], w)
  }
}
writeFileSync(PLATE, await sharp(out, { raw: { width: W, height: H, channels: 3 } }).webp({ quality: 96, smartSubsample: true, effort: 5 }).toBuffer())

// ---------- дані екрана ----------
const lifts = (it, y) => it.x >= COLUMN_X && y >= BLOCK.y0
data.texts = data.texts.filter((t) => t.s !== 'Select a deck').map((t) => (lifts(t, t.y) ? { ...t, y: +(t.y - DY).toFixed(2) } : t))
data.hits = data.hits.map((h) => (lifts(h, h.y) ? { ...h, y: h.y - DY } : h))
data.radios = data.radios.map((r) => (r.cx >= COLUMN_X && r.cy >= BLOCK.y0 ? { ...r, cy: r.cy - DY } : r))
data.selects = data.selects.filter((s) => s.id !== 'deck')
data.lifted = DY
writeFileSync(DATA, JSON.stringify(data, null, 1) + '\n')
console.log('піднято на', DY, 'px:', PLATE, DATA)
