// Малюнки карт: art/cards/{id}.webp (id — порядок колоди сервера, 0–77) і рубашка. Їх готує scripts/build-cards.mjs
// з референсів у cards/. Перевернута карта — той самий малюнок, повернутий на 180° у CSS (клас rev).
const files = import.meta.glob('../art/cards/*.webp', { eager: true, query: '?url', import: 'default' })

export const cardImage = (id) => files[`../art/cards/${id}.webp`]
export const cardBack = files['../art/cards/back.webp']
