// Спільне для екранів застосунку (макети з папки imgase/, 1536x1024).
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
export const W = 1536
export const H = 1024
export const LANDING_PLATE = path.join(root, 'src/landing/art/plate-clean.png') // еталон відтінку синього

// key — підрядок назви файлу в imgase/ (імена українською, тому шукаємо за ключем, а не за точною назвою)
export const SCREENS = [
  { id: 'register', key: 'Реєстрація', route: '/register', title: 'Create your account' },
  { id: 'pricing', key: 'тарифів', route: '/pricing', title: 'Choose your plan' },
  { id: 'dashboard', key: 'дашборд', route: '/dashboard', title: 'Dashboard' },
  { id: 'tarot', key: 'Таро-студія', route: '/tarot', title: 'Tarot Studio' },
  { id: 'reading', key: 'екран таро', route: '/reading', title: 'Tarot Reading' },
  { id: 'dreams', key: 'щоденник', route: '/dreams', title: 'Dream Journal' },
  { id: 'analysis', key: 'аналіз снів', route: '/analysis', title: 'Dream Analysis' },
  { id: 'astrology', key: 'астролог', route: '/astrology', title: 'Astrology' },
  { id: 'companion', key: 'AI-компаньйон', route: '/companion', title: 'AI Companion' },
  { id: 'profile', key: 'профіль', route: '/profile', title: 'Profile' },
  { id: 'settings', key: 'Налаштування', route: '/settings', title: 'Settings' },
]
export const LOGIN_SRC_KEY = 'ChatGPT'

export function findFile(key) {
  const dir = path.join(root, '../assets/imgase')
  const k = key.normalize('NFC').toLowerCase()
  const f = fs.readdirSync(dir).find((n) => n.normalize('NFC').toLowerCase().includes(k))
  if (!f) throw new Error('у imgase/ немає файлу з ключем «' + key + '»')
  return path.join(dir, f)
}

/** Макет як RGB-буфер рівно W x H (1535-піксельні розтягуються копією останнього стовпця). */
export async function loadRawFile(file) {
  let img = sharp(file).removeAlpha()
  const m = await sharp(file).metadata()
  const dx = W - m.width
  const dy = H - m.height
  if (dx < 0 || dy < 0 || dx > 2 || dy > 2) throw new Error(`несподіваний розмір ${m.width}x${m.height} у ${path.basename(file)}`)
  if (dx || dy) img = img.extend({ right: dx, bottom: dy, extendWith: 'copy' })
  return img.raw().toBuffer()
}
export const loadRaw = (id) => loadRawFile(findFile(SCREENS.find((s) => s.id === id).key))
