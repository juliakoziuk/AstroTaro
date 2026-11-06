// Довідкові дані: 78 карт колоди таро з коротким тлумаченням у прямому й перевернутому положенні, двома мовами.
// Рядок кожного запису: [назва, пряме, перевернуте], кожне — [en, uk].
import { Locale, LOCALES } from '../i18n/locale'

type T2 = [string, string]
const at = (t: T2, l: Locale) => t[LOCALES.indexOf(l)]

export interface Card {
  id: number
  name: string
  upright: string
  reversed: string
}

const MAJOR: [T2, T2, T2][] = [
  [['The Fool', 'Блазень'], ['a fresh start and trust in the unknown', 'новий початок і довіра до невідомого'], ['recklessness or fear of taking the first step', 'безрозсудність або страх зробити перший крок']],
  [['The Magician', 'Маг'], ['will, skill and the power to manifest', 'воля, майстерність і сила втілювати задумане'], ['scattered energy or untapped potential', 'розпорошена енергія або нереалізований потенціал']],
  [['The High Priestess', 'Верховна Жриця'], ['intuition and hidden knowledge', 'інтуїція й приховані знання'], ['an ignored inner voice or secrets kept too long', 'ігнорований внутрішній голос або надто довго приховані таємниці']],
  [['The Empress', 'Імператриця'], ['abundance, care and creativity', 'достаток, турбота і творчість'], ['overgiving or creative blocks', 'надмірна самопожертва або творчі блоки']],
  [['The Emperor', 'Імператор'], ['structure, stability and leadership', 'структура, стабільність і лідерство'], ['rigidity or loss of control', 'ригідність або втрата контролю']],
  [['The Hierophant', 'Ієрофант'], ['tradition, guidance and shared values', 'традиція, наставництво і спільні цінності'], ['breaking free from convention', 'вихід за межі умовностей']],
  [['The Lovers', 'Закохані'], ['harmony, love and aligned choices', 'гармонія, любов і узгоджений вибір'], ['imbalance or a difficult decision', 'дисбаланс або складне рішення']],
  [['The Chariot', 'Колісниця'], ['determination and forward momentum', 'рішучість і рух уперед'], ['lack of direction or inner conflict', 'брак напряму або внутрішній конфлікт']],
  [['Strength', 'Сила'], ['quiet courage and compassion', 'тиха мужність і співчуття'], ['self-doubt or depleted energy', 'сумніви в собі або виснажена енергія']],
  [['The Hermit', 'Відлюдник'], ['inner search and solitude', 'внутрішній пошук і самотність'], ['isolation or avoiding reflection', 'ізоляція або уникання роздумів']],
  [['Wheel of Fortune', 'Колесо Фортуни'], ['cycles, luck and a turning point', 'цикли, удача і поворотний момент'], ['resistance to change or bad timing', 'опір змінам або невдалий момент']],
  [['Justice', 'Справедливість'], ['truth, fairness and clear cause and effect', 'правда, справедливість і чіткі причини та наслідки'], ['dishonesty or avoiding accountability', 'нечесність або ухилення від відповідальності']],
  [['The Hanged Man', 'Повішений'], ['a pause and a new perspective', 'пауза і новий погляд'], ['stalling or needless sacrifice', 'зволікання або марна жертва']],
  [['Death', 'Смерть'], ['an ending that clears the way for renewal', 'завершення, що розчищає шлях для оновлення'], ['clinging to what is already over', 'чіпляння за те, що вже минуло']],
  [['Temperance', 'Поміркованість'], ['balance, patience and healing', 'баланс, терпіння та зцілення'], ['excess or inner imbalance', 'надмірність або внутрішній дисбаланс']],
  [['The Devil', 'Диявол'], ['attachment and the chains we choose', 'прив’язаність і ланцюги, які ми обираємо самі'], ['release and breaking free of a pattern', 'звільнення й вихід зі шаблону']],
  [['The Tower', 'Вежа'], ['sudden change that frees you from false ground', 'раптова зміна, що звільняє від хибного ґрунту'], ['fear of change or a delayed upheaval', 'страх змін або відкладений злам']],
  [['The Star', 'Зірка'], ['renewed hope and inspiration', 'відновлена надія і натхнення'], ['lost faith or disconnection', 'втрачена віра або відчуженість']],
  [['The Moon', 'Місяць'], ['uncertainty, dreams and the subconscious', 'невизначеність, сни і підсвідомість'], ['confusion lifting and hidden truths surfacing', 'розвіювання плутанини і поява прихованої правди']],
  [['The Sun', 'Сонце'], ['success, clarity and joy', 'успіх, ясність і радість'], ['temporary clouds or muted optimism', 'тимчасові хмари або приглушений оптимізм']],
  [['Judgement', 'Суд'], ['awakening, calling and renewal', 'пробудження, покликання й оновлення'], ['self-criticism or ignoring the call', 'самокритика або ігнорування покликання']],
  [['The World', 'Світ'], ['completion, wholeness and achievement', 'завершення, цілісність і досягнення'], ['unfinished business or a loose end', 'незавершені справи або незакритий кінець']],
]

// масть: [називний (en), родовий для uk, тема]
const SUITS: { name: T2; theme: T2 }[] = [
  { name: ['Wands', 'Жезлів'], theme: ['passion and action', 'пристрасть і дія'] },
  { name: ['Cups', 'Кубків'], theme: ['emotion and relationships', 'емоції та стосунки'] },
  { name: ['Swords', 'Мечів'], theme: ['thought and communication', 'думка і спілкування'] },
  { name: ['Pentacles', 'Пентаклів'], theme: ['work, money and the material world', 'робота, гроші й матеріальний світ'] },
]

const RANKS: [T2, T2, T2][] = [
  [['Ace', 'Туз'], ['a new beginning', 'новий початок'], ['a missed or blocked start', 'згаяний або заблокований початок']],
  [['Two', 'Двійка'], ['balance and choice', 'баланс і вибір'], ['indecision', 'нерішучість']],
  [['Three', 'Трійка'], ['growth and collaboration', 'зростання і співпраця'], ['delays in teamwork', 'затримки у спільній роботі']],
  [['Four', 'Четвірка'], ['stability and rest', 'стабільність і відпочинок'], ['stagnation', 'застій']],
  [['Five', 'П’ятірка'], ['conflict and challenge', 'конфлікт і випробування'], ['resolution after tension', 'вирішення після напруги']],
  [['Six', 'Шістка'], ['harmony and progress', 'гармонія й поступ'], ['slow progress', 'повільний поступ']],
  [['Seven', 'Сімка'], ['reflection and perseverance', 'роздуми й наполегливість'], ['doubt and scattered effort', 'сумніви й розпорошені зусилля']],
  [['Eight', 'Вісімка'], ['movement and mastery', 'рух і майстерність'], ['a stall or loss of focus', 'зупинка або втрата фокусу']],
  [['Nine', 'Дев’ятка'], ['near completion and resilience', 'близьке завершення й стійкість'], ['exhaustion near the finish', 'виснаження перед фінішем']],
  [['Ten', 'Десятка'], ['fulfilment and a cycle closing', 'повнота й завершення циклу'], ['burden or an overextended cycle', 'тягар або надто затягнутий цикл']],
  [['Page', 'Паж'], ['curiosity and a new message', 'цікавість і нова звістка'], ['immaturity or hesitation', 'незрілість або вагання']],
  [['Knight', 'Лицар'], ['pursuit and energetic movement', 'поривання й енергійний рух'], ['impulsiveness or burnout', 'імпульсивність або вигорання']],
  [['Queen', 'Королева'], ['nurturing mastery', 'дбайлива майстерність'], ['insecurity or withheld care', 'невпевненість або стримана турбота']],
  [['King', 'Король'], ['authority and mature control', 'авторитет і зріла стриманість'], ['misuse of power', 'зловживання владою']],
]

// як складаються назва й значення молодшого аркана в кожній мові
const MINOR_NAME: Record<Locale, (rank: string, suit: string) => string> = {
  en: (r, s) => `${r} of ${s}`,
  uk: (r, s) => `${r} ${s}`,
}
const MINOR_MEANING: Record<Locale, (m: string, theme: string) => string> = {
  en: (m, th) => `${m} in ${th}`,
  uk: (m, th) => `${m} у темі «${th}»`,
}

export const CARD_COUNT = 78

export function cardOf(id: number, locale: Locale): Card {
  if (id < 22) {
    const [name, up, rev] = MAJOR[id]
    return { id, name: at(name, locale), upright: at(up, locale), reversed: at(rev, locale) }
  }
  const n = id - 22
  const suit = SUITS[Math.floor(n / 14)]
  const [rank, up, rev] = RANKS[n % 14]
  return {
    id,
    name: MINOR_NAME[locale](at(rank, locale), at(suit.name, locale)),
    upright: MINOR_MEANING[locale](at(up, locale), at(suit.theme, locale)),
    reversed: MINOR_MEANING[locale](at(rev, locale), at(suit.theme, locale)),
  }
}

/** id карти, чию назву (будь-якою мовою) згадано в тексті. */
export function findCardIdInText(text: string): number | undefined {
  const hay = text.toLowerCase()
  for (let id = 0; id < CARD_COUNT; id++) {
    if (LOCALES.some((l) => hay.includes(cardOf(id, l).name.toLowerCase()))) return id
  }
  return undefined
}
