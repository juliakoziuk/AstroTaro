// Класи тексту інтерфейсу: гарнітура (serif/sans), вага, спосіб підгонки.
//   fit 'w' — розмір за шириною чорнила (ls ≈ 0), 'h' — розмір за висотою, трекінг за шириною (капітель-логотипи).
// Клас у специфікації пишеться як base[.група]: група = ключ, за яким рядки ділять один розмір шрифту
// (напр. h3.c — заголовки карток), стиль береться від base.
export const CLS = {
  brand: { fam: 'serif', wg: 500, fit: 'h', tag: 'span' },
  nav: { fam: 'sans', wg: 400 },
  h1: { fam: 'serif', wg: 500, tag: 'h1' },
  h2: { fam: 'serif', wg: 500, tag: 'h2' },
  h3: { fam: 'serif', wg: 500, tag: 'h3' },
  sub: { fam: 'sans', wg: 400 },
  body: { fam: 'sans', wg: 400 },
  small: { fam: 'sans', wg: 400 },
  num: { fam: 'serif', wg: 500 },
  btn: { fam: 'sans', wg: 600 },
  chip: { fam: 'sans', wg: 400 },
}
export const baseOf = (cls) => cls.split('.')[0]
export const styleOf = (cls) => {
  const s = CLS[baseOf(cls)]
  if (!s) throw new Error('невідомий клас тексту: ' + cls)
  return s
}
