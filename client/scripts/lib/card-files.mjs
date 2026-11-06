// Яка картка колоди лежить у файлі: назви файлів у cards/ згенеровані (різні мови, довільні підписи), тож розпізнаємо
// за ключовими словами. id = порядок колоди сервера (server/src/tarot/cards.ts): 0–21 старші, далі по 14 карт у мастях
// Жезли, Кубки, Мечі, Пентаклі; у масті туз, 2…10, паж, лицар, королева, король.

// «»: назва старшого аркана в лапках не плутається зі словами в підписах («Сила» Імператора, «сонця» заходу)
const MAJOR = [
  /«блазень»/, /«маг»/, /жриця/, /імператриця/, /імператор/, /ієрофант/, /закохані/, /колісниця/, /«сила»/, /відлюдник/,
  /колеса фортуни/, /справедливість/, /повішений/, /смерть/, /помірності/, /«диявол»/, /вежа/, /зірка/, /«місяць»/, /«сонце»/, /«суд»/, /«світ»/,
]
// початок слова: «сімк» не має збігатися всередині «вісімка», а «ten» — всередині «often»
const word = (stems) => new RegExp(String.raw`(?<!\p{L})(?:${stems})`, 'iu')
const RANK = [
  'туз|ace', 'двійк|two', 'трійк|three', 'четвірк|four', "п[’']ятірк|five", 'шістк|six', 'сімк|seven', 'вісімк|eight', "дев[’']ятк|nine", 'десятк|ten',
  'паж|page', 'лицар|knight', 'королев|queen', 'король|king',
].map(word)
const SUIT = [/жезл|wands/, /кубк|cups/, /меч|swords/, /пентакл|pentacles/]

const BACK = /рабашкою|рубашкою|сорочкою/

/** id карти за назвою файлу або null, якщо це не картка. */
export function cardIdOf(file) {
  const name = file.toLowerCase()
  const major = MAJOR.findIndex((re) => re.test(name))
  if (major >= 0) return major
  const suit = SUIT.findIndex((re) => re.test(name))
  const rank = RANK.findIndex((re) => re.test(name))
  return suit >= 0 && rank >= 0 ? 22 + suit * 14 + rank : null
}

/** Розкладає файли папки: { byId: {id: файл}, back, unmatched[], duplicates[] }. */
export function mapCardFiles(files) {
  const byId = {}
  const out = { byId, back: null, unmatched: [], duplicates: [] }
  for (const file of files.filter((f) => /\.(png|jpe?g|webp)$/i.test(f))) {
    if (BACK.test(file.toLowerCase())) {
      out.back = file
      continue
    }
    const id = cardIdOf(file)
    if (id === null) out.unmatched.push(file)
    else if (id in byId) out.duplicates.push(file)
    else byId[id] = file
  }
  return out
}
