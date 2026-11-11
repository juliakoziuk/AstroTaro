import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import { NAV, activeNav } from './nav.js'

test('every section of the app has one link in the menu, in a fixed order', () => {
  deepStrictEqual(NAV.map((n) => n.id), ['home', 'tarot', 'history', 'dreams', 'astrology', 'analytics', 'access', 'settings', 'help'])
})

test('a page belongs to exactly one menu item, so exactly one item can be highlighted', () => {
  const routes = NAV.flatMap((n) => n.routes)
  strictEqual(new Set(routes).size, routes.length)
})

test('every link leads to a path of the app', () => {
  ok(NAV.every((n) => n.path.startsWith('/') && n.label.length > 0))
})

test('the highlighted item is the section the user is in, also on its sub-pages', () => {
  strictEqual(activeNav('/dashboard'), 'home')
  strictEqual(activeNav('/astrology'), 'astrology')
  strictEqual(activeNav('/today'), 'astrology') // «Космос сьогодні» відкривається з астрології
  strictEqual(activeNav('/tarot'), 'tarot')
  strictEqual(activeNav('/draw'), 'tarot')
  strictEqual(activeNav('/daily'), 'tarot')
  strictEqual(activeNav('/reading'), 'tarot')
  strictEqual(activeNav('/history'), 'history')
  strictEqual(activeNav('/dreams'), 'dreams')
  strictEqual(activeNav('/companion'), null) // чату більше немає
  strictEqual(activeNav('/analysis'), 'analytics')
  strictEqual(activeNav('/pricing'), 'access')
  strictEqual(activeNav('/settings'), 'settings')
})

test('pages outside the menu highlight nothing', () => {
  strictEqual(activeNav('/profile'), null)
  strictEqual(activeNav('/nowhere'), null)
})
