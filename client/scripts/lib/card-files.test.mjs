import { test } from 'node:test'
import { deepStrictEqual, ok, strictEqual } from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { cardIdOf, mapCardFiles } from './card-files.mjs'

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../assets/cards')

test('major arcana are recognised by their name, in deck order', () => {
  strictEqual(cardIdOf('Таро «Блазень» під сяйвом місяця.png'), 0)
  strictEqual(cardIdOf('Таро Імператор_ Велич і Сила.png'), 4) // «Сила» в назві Імператора не робить його Силою
  strictEqual(cardIdOf('Карта Таро «Сила» під місячним сяйвом.png'), 8)
  strictEqual(cardIdOf('Таро «Сонце» з вершницею та соняхами.png'), 19)
  strictEqual(cardIdOf('Десятка Жезлів на заході сонця.png'), 22 + 9) // «сонця» — не Сонце
  strictEqual(cardIdOf('Таро «Світ»_ космічний танок.png'), 21)
})

test('minor arcana come from rank and suit, in the deck order of the server', () => {
  strictEqual(cardIdOf('Туз Жезлів_ Сяйво світанку.png'), 22)
  strictEqual(cardIdOf('Святкування Четвірки Жезлів.png'), 22 + 3)
  strictEqual(cardIdOf('Королева Жезлів із левом уларниң.png'), 22 + 12)
  strictEqual(cardIdOf('Король Кубків на заході сонця.png'), 22 + 14 + 13)
  strictEqual(cardIdOf('Eight of Cups_ Moonlit Mountain Journey.png'), 22 + 14 + 7)
  strictEqual(cardIdOf('Король Пентаклів_ Володар Золотого Трону.png'), 77)
})

test('a file that is not a card is not guessed', () => {
  strictEqual(cardIdOf('something else.png'), null)
})

test('the cards folder maps to all 78 cards exactly once, plus the card back', { skip: !fs.existsSync(dir) }, () => {
  const { byId, back, unmatched, duplicates } = mapCardFiles(fs.readdirSync(dir))
  deepStrictEqual(unmatched, [])
  deepStrictEqual(duplicates, [])
  strictEqual(Object.keys(byId).length, 78)
  ok(back?.includes('рабашкою'))
})

const art = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/app/art/cards')

test('the site has an image for every card id and for the back (run scripts/build-cards.mjs if this fails)', () => {
  for (let id = 0; id < 78; id++) ok(fs.existsSync(path.join(art, `${id}.webp`)), `missing ${id}.webp`)
  ok(fs.existsSync(path.join(art, 'back.webp')))
})
