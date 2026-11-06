// Текст тлумачення з фактів analysis.ts: настрій розкладу, динаміка між позиціями, взаємодія сусідніх карт, відомі пари,
// повтори чисел, тема питання. Усе двома мовами; вибір варіантів залежить лише від карт, тож розклад читається однаково.
import { Locale, LOCALES } from '../i18n/locale'
import { Analysis, CardInfo, NAMED_PAIRS, Tone, verdictFromValence } from './analysis'

type T2 = [string, string]
const at = (t: T2, l: Locale) => t[LOCALES.indexOf(l)]
const pick = <T>(list: T[], seed: number, salt = 0): T => list[(seed + salt) % list.length]

const TONE: Record<Tone, T2> = {
  bright: ['The overall mood is bright: the cards lean clearly in your favour.', 'Загальний настрій світлий: карти помітно на твоєму боці.'],
  hopeful: ['The overall mood is hopeful, though it still asks something of you.', 'Загальний настрій обнадійливий, хоч і вимагає від тебе зусиль.'],
  mixed: ['The mood is mixed: light and shadow sit side by side, so nothing here is one-sided.', 'Настрій змішаний: світло й тінь стоять поруч, тож ніщо тут не однозначне.'],
  heavy: ['The mood is heavy right now, but the cards describe a moment, not a sentence.', 'Зараз настрій важкий, але карти описують момент, а не вирок.'],
}

const TRAJECTORY: Record<string, T2> = {
  rising: ['The story climbs: each step is lighter than the one before, and the last card points to real improvement.', 'Історія йде вгору: кожен крок легший за попередній, а остання карта вказує на справжнє покращення.'],
  falling: ['The story slides: the early promise thins out, so the last card asks you to act before momentum fades.', 'Історія сповзає вниз: ранній порив слабшає, тож остання карта просить діяти, поки не зникла інерція.'],
  dip: ['The middle card is the low point and the last card shows the way back up: the hard stretch is a passage, not a destination.', 'Середня карта — найнижча точка, а остання показує шлях угору: важкий відрізок — це перехід, а не пункт призначення.'],
  peak: ['The middle card is the high point, and the last one hints that it will not hold by itself: consolidate what you gain.', 'Середня карта — вершина, а остання натякає, що сама вона не втримається: закріплюй те, що здобуваєш.'],
  steady: ['The story is level: nothing sharply improves or worsens, so the outcome depends on the choices you make now.', 'Історія рівна: нічого різко не покращується й не погіршується, тож результат залежить від твоїх рішень зараз.'],
}

const VERDICT: Record<string, T2> = {
  'yes-strong': ['The answer is a clear yes.', 'Відповідь — чітке «так».'],
  'yes-leaning': ['The answer leans towards yes, with some conditions.', 'Відповідь схиляється до «так», але з умовами.'],
  'no-strong': ['The answer is a clear no.', 'Відповідь — чітке «ні».'],
  'no-leaning': ['The answer leans towards no, though it is not final.', 'Відповідь схиляється до «ні», але вона не остаточна.'],
  'maybe-leaning': ['The answer is “not yet”: the outcome depends on what you do next.', 'Відповідь — «ще не час»: результат залежить від твоїх наступних кроків.'],
}

const CAREER: Record<'resolve' | 'persist', T2> = {
  resolve: ['The outcome card is lighter than the obstacle, which suggests the obstacle can be overcome.', 'Карта результату світліша за перешкоду, тож перешкоду можна подолати.'],
  persist: ['The outcome card is no lighter than the obstacle, so it will not dissolve on its own: it needs a deliberate plan.', 'Карта результату не світліша за перешкоду, тож сама вона не розсіється: потрібен свідомий план.'],
}
const ADVICE: Record<'helps' | 'demands', T2> = {
  helps: ['The advice card eases the challenge, so lean on it.', 'Карта поради пом’якшує виклик, тож спирайся на неї.'],
  demands: ['The advice card is demanding rather than comforting: it asks for restraint or effort before relief arrives.', 'Карта поради скоріше вимоглива, ніж втішна: вона просить стриманості чи зусиль, перш ніж прийде полегшення.'],
}
const CONNECTION: Record<'warm' | 'strained' | 'neutral', T2> = {
  warm: ['The connection card is warm: what lies between you is a resource.', 'Карта зв’язку тепла: те, що між вами, — це ресурс.'],
  strained: ['The connection card shows strain: the bond needs honest attention.', 'Карта зв’язку показує напругу: стосункам потрібна чесна увага.'],
  neutral: ['The connection card is neutral: the bond is what the two of you make of it.', 'Карта зв’язку нейтральна: цей зв’язок — те, що ви обоє з нього зробите.'],
}

// взаємодія мастей (ключ «менша+більша»), включно з однаковою мастю
const ELEMENT: Record<string, T2> = {
  '00': ['Two Wands side by side amplify drive and action: energy is plentiful, patience is not.', 'Два Жезли поруч підсилюють імпульс і дію: енергії вдосталь, терпіння бракує.'],
  '11': ['Cups twice: feeling dominates here, for better and for worse.', 'Кубки двічі: тут панують почуття — і на краще, і на гірше.'],
  '22': ['Swords twice: the mind is busy, and thoughts and words carry the weight.', 'Мечі двічі: розум зайнятий, а вагу несуть думки й слова.'],
  '33': ['Pentacles twice: this is grounded in practical matters such as work, money and the body.', 'Пентаклі двічі: усе тримається на практичному — роботі, грошах і тілі.'],
  '01': ['Wands meet Cups: passion and feeling pull on each other, which warms things up unless they pull apart.', 'Жезли зустрічають Кубки: пристрасть і почуття тягнуть одне одного — це гріє, поки вони не розходяться.'],
  '02': ['Wands meet Swords: ideas fan the flames of action; watch for haste and sharp words.', 'Жезли зустрічають Мечі: ідеї роздмухують дію; стережись поспіху й різких слів.'],
  '03': ['Wands meet Pentacles: drive meets practicality, which is how plans become results.', 'Жезли зустрічають Пентаклі: порив стикається з практичністю — саме так плани стають результатами.'],
  '12': ['Cups meet Swords: heart and head disagree, and honesty is needed to reconcile them.', 'Кубки зустрічають Мечі: серце й розум не згодні, і щоб їх помирити, потрібна чесність.'],
  '13': ['Cups meet Pentacles: feeling finds solid ground, a nourishing and stabilising pairing.', 'Кубки зустрічають Пентаклі: почуття знаходять опору — поживне й стабілізуюче поєднання.'],
  '23': ['Swords meet Pentacles: clear thinking applied to material matters, good for planning and cold if feeling is left out.', 'Мечі зустрічають Пентаклі: ясне мислення, застосоване до матеріального; добре для планування й холодно, якщо забути про почуття.'],
}
const MAJOR_MAJOR: T2 = ['Two Major Arcana side by side: this link is significant, not a small everyday matter.', 'Два старші аркани поруч: цей зв’язок значущий, а не дрібна буденна справа.']
const MAJOR_MINOR: T2 = ['{a} sets the theme and {b} shows how it plays out in daily life.', '«{a}» задає тему, а «{b}» показує, як вона проявляється в повсякденні.']
const CONTRAST: T2 = ['{a} and {b} pull in opposite directions; the tension between them is part of the message.', '«{a}» і «{b}» тягнуть у протилежні боки; напруга між ними — частина послання.']
const AGREE: T2 = ['{a} and {b} reinforce each other.', '«{a}» і «{b}» підсилюють одна одну.']

// відомі пари старших арканів
const PAIR: Record<(typeof NAMED_PAIRS)[number], T2> = {
  '16-17': ['The Tower with The Star: hope that arrives after the collapse; what falls was not holding you up.', 'Вежа із Зіркою: надія приходить після краху; те, що впало, і не було твоєю опорою.'],
  '6-15': ['The Lovers with The Devil: ask whether it is love or attachment, choice or compulsion.', 'Закохані з Дияволом: запитай себе, це любов чи прив’язаність, вибір чи залежність.'],
  '15-16': ['The Devil with The Tower: the chains are about to break, abruptly and for good.', 'Диявол із Вежею: ланцюги ось-ось порвуться — раптово й остаточно.'],
  '10-11': ['Wheel of Fortune with Justice: the turn of the wheel brings consequences that are fair.', 'Колесо Фортуни з Справедливістю: поворот колеса приносить наслідки, які справедливі.'],
  '0-1': ['The Fool with The Magician: a fresh start that already has the means to succeed.', 'Блазень з Магом: новий початок, у якого вже є засоби для успіху.'],
  '2-9': ['The High Priestess with The Hermit: the answer is inside, and quiet is the way to reach it.', 'Верховна Жриця з Відлюдником: відповідь усередині, а тиша — шлях до неї.'],
  '13-20': ['Death with Judgement: an ending that becomes a rebirth, a call to begin a new chapter.', 'Смерть із Судом: завершення, що стає відродженням, поклик почати новий розділ.'],
  '12-13': ['The Hanged Man with Death: surrender comes before the ending; let go before you are made to.', 'Повішений зі Смертю: відпускання передує завершенню; відпусти раніше, ніж тебе змусять.'],
  '7-8': ['The Chariot with Strength: willpower tempered by gentleness; steer rather than force.', 'Колісниця з Силою: воля, пом’якшена ніжністю; кермуй, а не примушуй.'],
  '17-18': ['The Star with The Moon: hope shines through uncertainty; the fog is thinner than it feels.', 'Зірка з Місяцем: надія пробивається крізь невизначеність; туман тонший, ніж здається.'],
  '19-21': ['The Sun with The World: success that is complete and recognised.', 'Сонце зі Світом: успіх, який повний і визнаний.'],
  '3-4': ['The Empress with The Emperor: nurture and structure working together.', 'Імператриця з Імператором: турбота і структура працюють разом.'],
}

const MAJORS_MANY: T2 = ['Most of the cards are Major Arcana: these are life-shaping themes, larger than day-to-day events.', 'Більшість карт — старші аркани: це теми, що формують життя, більші за щоденні події.']
const MAJORS_NONE: T2 = ['There are no Major Arcana, so this is about everyday matters you can influence directly.', 'Старших арканів немає, тож мова про буденні справи, на які ти можеш впливати напряму.']
const SUIT_DOM: T2[] = [
  ['Wands dominate: the reading is about action, ambition and energy.', 'Переважають Жезли: розклад про дію, амбіції та енергію.'],
  ['Cups dominate: the reading is about feeling and relationships.', 'Переважають Кубки: розклад про почуття та стосунки.'],
  ['Swords dominate: the reading is about thought, truth and communication.', 'Переважають Мечі: розклад про думки, правду й спілкування.'],
  ['Pentacles dominate: the reading is about work, money and practical life.', 'Переважають Пентаклі: розклад про роботу, гроші й практичне життя.'],
]
const REVERSED_MANY: T2 = ['Many cards are reversed: energy is turned inward or blocked, so the answer lies in what you are holding back.', 'Багато карт перевернуті: енергія спрямована всередину або заблокована, тож відповідь у тому, що ти стримуєш.']
const COURTS_MANY: T2 = ['Several court cards appear: other people, or sides of yourself, play a large part.', 'З’явилося кілька придворних карт: інші люди або різні грані тебе відіграють велику роль.']
const COURT_ONE: T2 = ['The court card may be a person, or an aspect of you, who is central here.', 'Придворна карта може бути людиною або однією з граней тебе, і вона тут центральна.']

const RANK_THEME: T2[] = [
  ['new beginnings', 'нові початки'],
  ['choice and partnership', 'вибір і партнерство'],
  ['growth and collaboration', 'зростання й співпраця'],
  ['stability and rest', 'стабільність і відпочинок'],
  ['conflict and change', 'конфлікт і зміни'],
  ['harmony and progress', 'гармонія й поступ'],
  ['reflection and persistence', 'роздуми й наполегливість'],
  ['movement and skill', 'рух і майстерність'],
  ['resilience near the finish', 'стійкість перед фінішем'],
  ['completion and cycles closing', 'завершення й закриття циклів'],
]
const REPEAT: T2 = ['The same number appears more than once, stressing its theme: {t}.', 'Те саме число з’являється не раз, підкреслюючи свою тему: {t}.']

const TOPIC_NAME: Record<string, T2> = {
  love: ['love and relationships', 'любов і стосунки'],
  family: ['family', 'родину'],
  career: ['work and career', 'роботу й кар’єру'],
  money: ['money', 'гроші'],
  health: ['health and wellbeing', 'здоров’я й самопочуття'],
  self: ['your own path', 'твій особистий шлях'],
  decision: ['a decision', 'рішення'],
}
const LENS_HIT: T2 = ['Your question is about {t}, and {c} speaks to it most directly.', 'Твоє питання про {t}, і найбільше до нього говорить «{c}».']
const LENS_MISS: T2 = ['Your question is about {t}, yet no card of its usual suit appears: the answer is more likely in the underlying theme than in outward events.', 'Твоє питання про {t}, але карт відповідної масті немає: відповідь радше в глибшій темі, ніж у зовнішніх подіях.']

const CLOSING: Record<Tone, T2[]> = {
  bright: [['Trust the momentum and say yes to what is offered.', 'Довірся імпульсу й скажи «так» тому, що пропонують.'], ['Do not let doubt talk you out of what already works.', 'Не дозволяй сумнівам відмовити тебе від того, що вже працює.']],
  hopeful: [['Take the next small step: that is what turns hope into progress.', 'Зроби наступний малий крок: саме він перетворює надію на поступ.'], ['Stay patient and consistent; the cards favour steady effort.', 'Май терпіння й послідовність: карти підтримують стійкі зусилля.']],
  mixed: [['Name what is working and what is not, then decide where to put your energy.', 'Назви, що працює, а що ні, і вирішуй, куди спрямувати енергію.'], ['Hold both sides without forcing a verdict; clarity will come with time.', 'Тримай обидві сторони, не вимагаючи вироку; ясність прийде з часом.']],
  heavy: [['Be gentle with yourself and change one small thing; hard seasons shift.', 'Поводься з собою лагідно й зміни одну малу річ: важкі періоди минають.'], ['Lean on someone you trust; you do not have to carry this alone.', 'Спирайся на того, кому довіряєш: нести це наодинці не обов’язково.']],
}

const REVERSED_NOTE: T2 = ['Reversed, this energy is blocked, delayed or turned inward.', 'У перевернутому положенні ця енергія заблокована, відкладена або спрямована всередину.']

// роль карти в позиції конкретного розкладу; {m} — стислий зміст карти
const ROLE: Record<string, T2[]> = {
  yesno: [['The card answers with {m}.', 'Карта відповідає: {m}.']],
  daily: [['Today the card highlights {m}.', 'Сьогодні карта підсвічує: {m}.']],
  three: [
    ['Behind you lies {m}.', 'Позаду — {m}.'],
    ['At the centre of the present is {m}.', 'У центрі теперішнього — {m}.'],
    ['Ahead lies {m}.', 'Попереду — {m}.'],
  ],
  relationship: [
    ['You bring {m} to this connection.', 'Ти вносиш у цей зв’язок: {m}.'],
    ['Your partner brings {m}.', 'Партнер приносить: {m}.'],
    ['What lives between you is {m}.', 'Між вами живе: {m}.'],
  ],
  career: [
    ['The situation is shaped by {m}.', 'У ситуації головне — {m}.'],
    ['What stands in the way is {m}.', 'На заваді — {m}.'],
    ['The likely outcome is {m}.', 'Ймовірний результат — {m}.'],
  ],
  purpose: [
    ['Your roots are {m}.', 'Твоє коріння — {m}.'],
    ['Your calling is {m}.', 'Твоє покликання — {m}.'],
    ['The path forward is {m}.', 'Шлях уперед — {m}.'],
  ],
  custom: [
    ['Your focus is on {m}.', 'У твоєму фокусі — {m}.'],
    ['The challenge is {m}.', 'Виклик — {m}.'],
    ['As advice, keep in mind {m}.', 'Порада карт — {m}.'],
  ],
}

export const roleLine = (spreadId: string, index: number, meaning: string, locale: Locale) => at(ROLE[spreadId][index], locale).replace('{m}', meaning)
export const reversedNote = (locale: Locale) => at(REVERSED_NOTE, locale)

/** Як дві сусідні карти взаємодіють: відома пара, потім масті, потім старші/молодші. */
export function pairLine(a: CardInfo, b: CardInfo, nameA: string, nameB: string, locale: Locale): string {
  const key = `${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}` as (typeof NAMED_PAIRS)[number]
  const fill = (t: T2) => at(t, locale).replace('{a}', nameA).replace('{b}', nameB)
  if (a.major && b.major && PAIR[key]) return at(PAIR[key], locale)
  let base: string
  if (a.major && b.major) base = at(MAJOR_MAJOR, locale)
  else if (a.major !== b.major) base = at(MAJOR_MINOR, locale).replace('{a}', a.major ? nameA : nameB).replace('{b}', a.major ? nameB : nameA)
  else base = at(ELEMENT[`${Math.min(a.suit, b.suit)}${Math.max(a.suit, b.suit)}`], locale)
  // коли настрій карт різний, це саме по собі важливо; коли обидві світлі чи важкі, вони підсилюють одна одну
  if (a.valence * b.valence < 0) return `${base} ${fill(CONTRAST)}`
  if (a.valence * b.valence > 0 && Math.abs(a.valence + b.valence) >= 3) return `${base} ${fill(AGREE)}`
  return base
}

export interface SummaryParts {
  tone: string
  spread: string[] // речення, специфічні для типу розкладу
  structure: string[] // мажори, масті, перевороти, придворні
  combos: string[] // відомі пари, повтори чисел, тема питання
  closing: string
}

export function summaryParts(spreadId: string, a: Analysis, names: string[], locale: Locale): SummaryParts {
  const n = a.cards.length
  const spread: string[] = []
  if (a.trajectory) spread.push(at(TRAJECTORY[a.trajectory], locale))
  if (spreadId === 'yesno') {
    const v = verdictFromValence(a.cards[0].valence)
    spread.push(at(VERDICT[`${v.answer}-${v.strength}`], locale))
  }
  if (spreadId === 'career') spread.push(at(CAREER[a.cards[2].valence > a.cards[1].valence ? 'resolve' : 'persist'], locale))
  if (spreadId === 'custom') spread.push(at(ADVICE[a.cards[2].valence >= a.cards[1].valence ? 'helps' : 'demands'], locale))
  if (spreadId === 'relationship') {
    spread.push(pairLine(a.cards[0], a.cards[1], names[0], names[1], locale))
    const v = a.cards[2].valence
    spread.push(at(CONNECTION[v >= 1 ? 'warm' : v <= -1 ? 'strained' : 'neutral'], locale))
  }

  const structure: string[] = []
  if (n >= 3 && a.majors / n >= 0.6) structure.push(at(MAJORS_MANY, locale))
  else if (n >= 3 && a.majors === 0) structure.push(at(MAJORS_NONE, locale))
  if (a.dominantSuit !== null) structure.push(at(SUIT_DOM[a.dominantSuit], locale))
  if (n >= 3 && a.reversedShare >= 0.5) structure.push(at(REVERSED_MANY, locale))
  if (a.courts >= 2) structure.push(at(COURTS_MANY, locale))
  else if (a.courts === 1 && n >= 3) structure.push(at(COURT_ONE, locale))

  const combos: string[] = []
  for (const p of a.namedPairs) combos.push(at(PAIR[p.key], locale))
  for (const r of a.repeatedRanks) combos.push(at(REPEAT, locale).replace('{t}', at(RANK_THEME[r], locale)))
  if (a.topic) {
    const t = at(TOPIC_NAME[a.topic], locale)
    combos.push(a.topicCard !== null ? at(LENS_HIT, locale).replace('{t}', t).replace('{c}', names[a.topicCard]) : at(LENS_MISS, locale).replace('{t}', t))
  }

  return { tone: at(TONE[a.tone], locale), spread, structure, combos, closing: at(pick(CLOSING[a.tone], a.seed), locale) }
}

// ---------- режим «Глибоко»: дар і тінь карти, запитання для роздумів, вправа ----------
const GIFT_UPRIGHT: T2 = ['In {c} there is a gift ({up}) and a shadow ({rev}).', 'У «{c}» є дар — {up}, і є тінь — {rev}.']
const GIFT_REVERSED: T2 = ['Reversed, {c} shows its shadow side: {rev}. The gift it holds, {up}, is still waiting for you.', 'Перевернута «{c}» показує тіньовий бік — {rev}. Дар цієї карти — {up} — ще чекає на тебе.']
const REFLECT: Record<'light' | 'heavy' | 'mixed', T2> = {
  light: ['Where in your life do you already feel this, and how could you give it more room?', 'Де в твоєму житті ти вже відчуваєш це і як дати цьому більше місця?'],
  heavy: ['What would change if you looked at this honestly and without blame?', 'Що зміниться, якщо поглянути на це чесно й без звинувачень?'],
  mixed: ['What is this reading asking you to pause for and notice?', 'Чого цей розклад просить тебе зупинитись і помітити?'],
}
const REFLECT_LEAD: T2 = ['A question to reflect on:', 'Запитання для роздумів:']
const PRACTICE: T2[] = [
  ['This week, note once each evening where the theme of this spread showed up in your day: patterns appear through repetition.', 'Цього тижня щовечора занотуй, де в твоєму дні проявилась тема цього розкладу: закономірності видно в повторенні.'],
  ['Choose one small action that honours the last card of this spread and do it within three days.', 'Обери одну малу дію, що відповідає останній карті цього розкладу, і зроби її протягом трьох днів.'],
]

/** Дар і тінь однієї карти: обидва її значення, а переворот каже, з якого боку вона працює зараз. */
export function giftShadowLine(name: string, up: string, rev: string, reversed: boolean, locale: Locale): string {
  return at(reversed ? GIFT_REVERSED : GIFT_UPRIGHT, locale).replace('{c}', name).replace('{up}', up).replace('{rev}', rev)
}

/** Запитання для роздумів над усім розкладом залежно від настрою. */
export function reflectQuestion(tone: Tone, locale: Locale): string {
  return `${at(REFLECT_LEAD, locale)} ${at(REFLECT[tone === 'bright' || tone === 'hopeful' ? 'light' : tone === 'heavy' ? 'heavy' : 'mixed'], locale)}`
}

export const practiceLine = (seed: number, locale: Locale): string => at(pick(PRACTICE, seed, 3), locale)
