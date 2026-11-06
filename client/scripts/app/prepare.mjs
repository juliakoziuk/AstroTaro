// Підготовка макета екрана: перебарвлення під синій Landing (S/H за смугами яскравості + вирівнювання темної бази),
// сірий канал і оцінка фону (медіана) для виявлення тексту.
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { W, H, loadRaw, LANDING_PLATE, root } from './common.mjs'
import { buildGrade, applyGrade } from '../lib/grade.mjs'
import { alignBase } from '../lib/align.mjs'

const CACHE = path.join(root, 'node_modules/.cache/app-build')
fs.mkdirSync(CACHE, { recursive: true })
export const rawPng = (raw) => sharp(raw, { raw: { width: W, height: H, channels: 3 } }).png().toBuffer()

/** {rgb, lum, bg}: rgb — перебарвлений макет (Buffer W*H*3), lum — Uint8 яскравість, bg — медіана 25x25 (Uint8). */
export async function loadGraded(id) {
  const cacheFile = path.join(CACHE, `${id}.graded.png`)
  let rgb
  if (fs.existsSync(cacheFile)) {
    rgb = await sharp(cacheFile).removeAlpha().raw().toBuffer()
  } else {
    const raw = await loadRaw(id)
    const grade = await buildGrade(LANDING_PLATE, await rawPng(raw))
    const sh = applyGrade(raw, grade)
    rgb = alignBase(sh, [11, 24, 38]).rgb
    await sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).png().toFile(cacheFile)
  }
  const grey = sharp(rgb, { raw: { width: W, height: H, channels: 3 } }).greyscale()
  const lum = await grey.clone().raw().toBuffer()
  const bg = await grey.clone().median(25).raw().toBuffer()
  return { rgb, lum, bg }
}
