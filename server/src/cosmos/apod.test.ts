import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { apodFromLibrary, dailyIndex, isRealApod, LibraryItem } from './apod'

test('the NASA logo placeholder is not a real picture of the day', () => {
  const logo = { title: 'NASA Science', url: 'https://science.nasa.gov/wp-content/themes/nasa-child/assets/images/nasa-logo@2x.png' }
  strictEqual(isRealApod(logo), false)
  strictEqual(isRealApod({ title: 'The Pillars of Creation', url: 'https://apod.nasa.gov/apod/image/pillars.jpg' }), true)
  strictEqual(isRealApod({ title: 'No picture', url: '' }), false)
})

test('the same date always picks the same index, and it stays inside the list', () => {
  strictEqual(dailyIndex('2026-11-06', 50), dailyIndex('2026-11-06', 50))
  for (const day of ['2026-11-05', '2026-11-06', '2026-11-07', '2027-01-01']) {
    const i = dailyIndex(day, 7)
    ok(Number.isInteger(i) && i >= 0 && i < 7, day)
  }
  ok(new Set(['2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'].map((d) => dailyIndex(d, 50))).size > 1)
})

test('a library item becomes a picture of the day with plain-text description', () => {
  const item: LibraryItem = {
    data: [{ title: 'Ant Nebula', description: '<p>Two <b>lobes</b> of gas.</p>', nasa_id: 'PIA04216' }],
    links: [{ href: 'https://images-assets.nasa.gov/image/PIA04216/PIA04216~small.jpg' }],
  }
  deepStrictEqual(apodFromLibrary(item, '2026-11-06'), {
    date: '2026-11-06',
    title: 'Ant Nebula',
    explanation: 'Two lobes of gas.',
    mediaType: 'image',
    url: 'https://images-assets.nasa.gov/image/PIA04216/PIA04216~small.jpg',
    copyright: null,
  })
})
