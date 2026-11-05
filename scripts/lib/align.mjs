// Вирівнювання «темної бази» зображення до цільового кольору (напр. фону Landing): додає зміщення до темних
// синюватих пікселів з вагою, що плавно спадає від V ≤ 0.12 (повна) до V ≥ 0.34 (нуль).
// Золото й світлі деталі не чіпає.
export function alignBase(rgb, target = [11, 24, 38]) {
  let r = 0
  let g = 0
  let b = 0
  let n = 0
  for (let i = 0; i < rgb.length; i += 9) {
    if (Math.max(rgb[i], rgb[i + 1], rgb[i + 2]) < 64) {
      r += rgb[i]
      g += rgb[i + 1]
      b += rgb[i + 2]
      n++
    }
  }
  const off = [r, g, b].map((v, c) => target[c] - v / n)
  const out = Buffer.from(rgb)
  for (let i = 0; i < rgb.length; i += 3) {
    if (rgb[i + 2] < rgb[i]) continue // тепла гама (золото, коричневі тіні) — не чіпаємо
    const v = Math.max(rgb[i], rgb[i + 1], rgb[i + 2]) / 255
    const w = Math.max(0, Math.min(1, (0.34 - v) / 0.22))
    if (!w) continue
    for (let c = 0; c < 3; c++) out[i + c] = Math.max(0, Math.min(255, Math.round(rgb[i + c] + off[c] * w)))
  }
  return { rgb: out, offset: off.map((v) => +v.toFixed(1)) }
}
