import { t } from '../../i18n/index.js'
import { session } from '../live/common.js'
import { go } from '../router.js'

// Карти не обирає сервер: розклад і режим запам'ятовуються, а людина сама тягне карти на екрані /draw
export function startReading(spreadId, mode, limits) {
  const allowed = limits?.readingModes
  // режими поза тарифом не пропускаємо на /draw: сервер однаково відмовив би, а тут можна сказати чому й що робити
  if (allowed && !allowed.includes(mode)) throw new Error(mode === 'depth' ? t('Depth readings are included in Premium.') : t('Detailed readings are included in Pro and Premium.'))
  session.set('draw', JSON.stringify({ spreadId, mode }))
  go('/draw')
}
