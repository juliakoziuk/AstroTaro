// Текст тлумачення з фактів analysis.ts і людських описів карт plain.ts. Мова проста, побутова: що відбувається в ситуації,
// як це може виглядати в житті й що з цим робити; без «світла й тіні» та загальних слів. Усе двома мовами; вибір варіантів
// залежить лише від карт, тож той самий розклад читається однаково.
import { Locale, LOCALES } from '../i18n/locale'
import { Analysis, CardInfo, NAMED_PAIRS, Tone, verdictFromValence } from './analysis'
import { Sphere } from './sphere'

type T2 = [string, string]
const at = (t: T2, l: Locale) => t[LOCALES.indexOf(l)]
const pick = <T>(list: T[], seed: number, salt = 0): T => list[(seed + salt) % list.length]

export const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
export const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
export const sentence = (s: string) => `${upperFirst(s)}.`

// ---------- загальний настрій розкладу (кілька варіантів, щоб тексти не повторювались) ----------
const TONE: Record<Tone, T2[]> = {
  bright: [
    ['Overall the picture is good: most cards say things are going well, as long as you do not create obstacles for yourself.', 'Загалом картина добра: більшість карт кажуть, що справи йдуть добре, якщо не створювати собі зайвих перешкод.'],
    ['The reading is on your side: there is more here that helps than that gets in the way.', 'Розклад скоріше на твоєму боці: у ньому більше того, що допомагає, ніж того, що заважає.'],
    ['There are more good signs than worrying ones, so there is reason to act more boldly.', 'Добрих знаків тут більше, ніж тривожних, тож є підстави діяти сміливіше.'],
  ],
  hopeful: [
    ['The picture is encouraging, but nothing will fall into place by itself: it takes concrete effort.', 'Картина обнадійлива, але саме собою нічого не складеться: потрібні конкретні зусилля.'],
    ['The general direction is good, although the road will not be completely smooth.', 'Загалом напрям добрий, хоча дорога не буде зовсім гладкою.'],
    ['Most cards are on your side, but some of them ask you directly to act.', 'Більшість карт на твоєму боці, проте частина з них прямо вимагає дій.'],
  ],
  mixed: [
    ['The picture is mixed: something already works and something holds things back, so there is no simple “good” or “bad” answer here.', 'Картина неоднозначна: щось уже працює, а щось гальмує, тож простої відповіді «добре» чи «погано» тут немає.'],
    ['The cards show strong and weak spots almost equally, so a lot depends on your decisions.', 'Карти показують сильні й слабкі місця майже порівну, тож багато залежить від твоїх рішень.'],
    ['The signals are mixed: part of the situation is encouraging, part needs attention.', 'Сигнали змішані: частина ситуації обнадіює, а частина потребує уваги.'],
  ],
  heavy: [
    ['This is a difficult period and the cards do not hide it, but they describe the present moment, not a sentence.', 'Зараз непростий період, і карти цього не приховують, але вони описують нинішній момент, а не вирок.'],
    ['The reading is a hard one: there is more strain than support in the situation, and it is better to admit that honestly.', 'Розклад непростий: у ситуації більше напруги, ніж підтримки, і краще чесно це визнати.'],
    ['A lot here holds you back or wears you out; that is a reason to change the approach, not to lose heart.', 'Тут багато того, що заважає чи виснажує; це привід змінити підхід, а не причина впадати у відчай.'],
  ],
}

// ---------- як змінюється ситуація від першої карти до третьої ----------
const TRAJECTORY: Record<'three' | 'purpose', Record<string, T2>> = {
  three: {
    rising: ['Things are gradually getting better: each step is easier than the one before, and the last card shows a real way out.', 'Ситуація поступово покращується: кожен наступний крок легший за попередній, а остання карта показує реальний вихід.'],
    falling: ['It was better before and strength is fading now, so the last card advises acting while there is still momentum.', 'Раніше було краще, а тепер сили слабшають, тож остання карта радить діяти, поки ще є розгін.'],
    dip: ['The hardest moment is right now, and the last card shows a way out: this is a stretch to get through, not the end.', 'Найважчий момент саме зараз, а остання карта показує вихід: це відрізок, який треба пройти, а не кінець.'],
    peak: ['The best moment is now, but the last card warns that it will not hold by itself: secure what you have.', 'Найкращий момент саме зараз, але остання карта попереджає, що сам собою він не втримається: закріплюй те, що маєш.'],
    steady: ['Everything moves evenly, with no sharp improvement or decline, so the result depends on the decisions you make now.', 'Усе рухається рівно, без різких покращень чи погіршень, тож результат залежить від рішень, які ти ухвалиш зараз.'],
  },
  purpose: {
    rising: ['The further along the path, the clearer it gets: your direction is becoming more defined.', 'Що далі по шляху, то ясніше: твій напрям стає виразнішим.'],
    falling: ['Your roots are stronger than your path: where you come from is firmer than where you are going, so the next step needs support.', 'Коріння міцніше за шлях: те, звідки ти йдеш, зараз твердіше за те, куди йдеш, тож наступному кроку потрібна опора.'],
    dip: ['Your calling is in its hardest spot right now: a time of doubt, but the path ahead shows a way through.', 'Покликання зараз у найскладнішому місці: це час сумнівів, але шлях попереду показує вихід.'],
    peak: ['Your calling is the strongest point here, but the path has to back it up with concrete steps.', 'Покликання тут найсильніше, але шлях має підтвердити його конкретними кроками.'],
    steady: ['All three parts are level: you are neither in crisis nor at a peak, so this is about conscious decisions.', 'Усі три частини рівні: ти не в кризі й не на піку, тож тут ідеться про свідомі рішення.'],
  },
}

// ---------- відповідь «Так/Ні» ----------
const VERDICT: Record<string, T2> = {
  'yes-strong': ['The answer is a clear yes.', 'Відповідь — чітке «так».'],
  'yes-leaning': ['The answer leans towards yes, with some conditions.', 'Відповідь схиляється до «так», але з умовами.'],
  'no-strong': ['The answer is a clear no.', 'Відповідь — чітке «ні».'],
  'no-leaning': ['The answer leans towards no, though it is not final.', 'Відповідь схиляється до «ні», але вона не остаточна.'],
  'maybe-leaning': ['The answer is “not yet”: the outcome depends on what you do next.', 'Відповідь — «ще не час»: результат залежить від твоїх наступних кроків.'],
}

// ---------- карта дня: настрій дня за однією картою ----------
const DAILY: Record<'high' | 'up' | 'flat' | 'down' | 'low', T2> = {
  high: ['Today the card is clearly on your side: you can act more boldly.', 'Сьогодні карта явно на твоєму боці: можна діяти сміливіше.'],
  up: ['Today the card leans in your favour.', 'Сьогодні карта скоріше підтримує.'],
  flat: ['Today brings no clear signs: a lot depends on what you do yourself.', 'Сьогодні немає однозначних знаків: багато залежить від твоїх власних дій.'],
  down: ['Today it is better to act with more care.', 'Сьогодні краще діяти обережніше.'],
  low: ['Today the card warns: slow down and do not take on more than you must.', 'Сьогодні карта застерігає: уповільнся й не бери на себе більше, ніж потрібно.'],
}

const CAREER: Record<'resolve' | 'persist', T2> = {
  resolve: ['The outcome card is stronger than the obstacle, so the obstacle can realistically be overcome.', 'Карта результату сильніша за перешкоду, тож перешкоду реально подолати.'],
  persist: ['The outcome card is no stronger than the obstacle: it will not clear up by itself and needs a concrete plan.', 'Карта результату не сильніша за перешкоду: сама вона не розсмокчеться, потрібен конкретний план.'],
}
const ADVICE: Record<'helps' | 'demands', T2> = {
  helps: ['The advice card eases the challenge, so lean on it.', 'Карта поради пом’якшує виклик, тож спирайся на неї.'],
  demands: ['The advice card is demanding rather than comforting: it asks for restraint or effort before things get easier.', 'Карта поради скоріше вимоглива, ніж втішна: вона просить стриманості чи зусиль, перш ніж стане легше.'],
}
const CONNECTION: Record<'warm' | 'strained' | 'neutral', T2> = {
  warm: ['The connection card is warm: what lies between you is a support.', 'Карта зв’язку тепла: те, що між вами, — це опора.'],
  strained: ['The connection card shows strain: the relationship needs an honest conversation.', 'Карта зв’язку показує напругу: стосункам потрібна чесна розмова.'],
  neutral: ['The connection card is neutral: this bond will be what the two of you make of it.', 'Карта зв’язку нейтральна: цей зв’язок буде таким, яким ви його зробите.'],
}
const BALANCE: Record<'you' | 'partner' | 'level', T2> = {
  you: ['You seem to be in a better place than your partner right now, so more support may be needed from you.', 'Схоже, ти зараз у кращому стані, ніж партнер, тож саме від тебе може знадобитися більше підтримки.'],
  partner: ['Your partner seems to be in a better place than you right now, so you may need more support than you are getting.', 'Схоже, партнер зараз у кращому стані, ніж ти, тож тобі може бракувати підтримки.'],
  level: ['You both seem to be in a similar state right now.', 'Ви обоє зараз приблизно в однаковому стані.'],
}

// ---------- взаємодія сусідніх карт ----------
// взаємодія мастей (ключ «менша+більша»), включно з однаковою мастю
const ELEMENT: Record<string, T2> = {
  '00': ['Two Wands side by side amplify drive and action: there is plenty of energy and not enough patience.', 'Два Жезли поруч підсилюють імпульс і дію: енергії вдосталь, терпіння бракує.'],
  '11': ['Cups twice: feelings dominate here, for better and for worse.', 'Кубки двічі: тут панують почуття — і на краще, і на гірше.'],
  '22': ['Swords twice: the mind is busy, and thoughts and words carry the weight.', 'Мечі двічі: розум зайнятий, а вагу несуть думки й слова.'],
  '33': ['Pentacles twice: this rests on practical matters such as work, money and daily life.', 'Пентаклі двічі: усе тримається на практичному — роботі, грошах і побуті.'],
  '01': ['Wands meet Cups: passion and feeling pull on each other, which warms things up as long as they do not pull apart.', 'Жезли зустрічають Кубки: пристрасть і почуття тягнуть одне одного — це гріє, поки вони не розходяться.'],
  '02': ['Wands meet Swords: ideas fuel action; watch for haste and sharp words.', 'Жезли зустрічають Мечі: ідеї підживлюють дію; стережись поспіху й різких слів.'],
  '03': ['Wands meet Pentacles: drive meets practicality, which is how plans become results.', 'Жезли зустрічають Пентаклі: порив стикається з практичністю — саме так плани стають результатами.'],
  '12': ['Cups meet Swords: heart and head disagree, and honesty is needed to reconcile them.', 'Кубки зустрічають Мечі: серце й розум не згодні, і щоб їх помирити, потрібна чесність.'],
  '13': ['Cups meet Pentacles: feelings find solid ground, a supportive and steadying pairing.', 'Кубки зустрічають Пентаклі: почуття знаходять опору — поєднання, яке підтримує й стабілізує.'],
  '23': ['Swords meet Pentacles: clear thinking applied to practical matters, good for planning and a little cold if feelings are left out.', 'Мечі зустрічають Пентаклі: ясне мислення, застосоване до практичного; добре для планування й трохи холодно, якщо забути про почуття.'],
}
const MAJOR_MAJOR: T2 = ['Two Major Arcana side by side: this link is significant, not a small everyday matter.', 'Два старші аркани поруч: цей зв’язок значущий, а не дрібна буденна справа.']
const MAJOR_MINOR: T2 = ['{a} sets the theme and {b} shows how it plays out in daily life.', '«{a}» задає тему, а «{b}» показує, як вона проявляється в повсякденні.']
const CONTRAST: T2 = ['{a} and {b} pull in opposite directions; the tension between them is part of the message.', '«{a}» і «{b}» тягнуть у протилежні боки; напруга між ними — частина послання.']
const AGREE: T2 = ['{a} and {b} reinforce each other.', '«{a}» і «{b}» підсилюють одна одну.']

// відомі пари старших арканів
const PAIR: Record<(typeof NAMED_PAIRS)[number], T2> = {
  '16-17': ['The Tower with The Star: hope arrives after the collapse; what fell was not holding you up.', 'Вежа із Зіркою: надія приходить після краху; те, що впало, і не було твоєю опорою.'],
  '6-15': ['The Lovers with The Devil: ask yourself whether it is love or attachment, a choice or a compulsion.', 'Закохані з Дияволом: запитай себе, це любов чи прив’язаність, вибір чи залежність.'],
  '15-16': ['The Devil with The Tower: what holds you is about to break, suddenly and for good.', 'Диявол із Вежею: те, що тебе тримає, ось-ось зламається — раптово й остаточно.'],
  '10-11': ['Wheel of Fortune with Justice: the turn brings consequences that are fair.', 'Колесо Фортуни з Справедливістю: поворот приносить наслідки, які справедливі.'],
  '0-1': ['The Fool with The Magician: a fresh start that already has the means to succeed.', 'Блазень з Магом: новий початок, у якого вже є засоби для успіху.'],
  '2-9': ['The High Priestess with The Hermit: the answer is inside, and quiet is the way to reach it.', 'Верховна Жриця з Відлюдником: відповідь усередині, а тиша — шлях до неї.'],
  '13-20': ['Death with Judgement: an ending that becomes a rebirth, a call to begin a new chapter.', 'Смерть із Судом: завершення, що стає відродженням, поклик почати новий розділ.'],
  '12-13': ['The Hanged Man with Death: letting go comes before the ending; let go before you are made to.', 'Повішений зі Смертю: відпускання передує завершенню; відпусти раніше, ніж тебе змусять.'],
  '7-8': ['The Chariot with Strength: willpower tempered by gentleness; steer rather than force.', 'Колісниця з Силою: воля, пом’якшена ніжністю; кермуй, а не примушуй.'],
  '17-18': ['The Star with The Moon: hope shows through the uncertainty; the fog is thinner than it feels.', 'Зірка з Місяцем: надія пробивається крізь невизначеність; туман тонший, ніж здається.'],
  '19-21': ['The Sun with The World: success that is complete and recognised.', 'Сонце зі Світом: успіх, який повний і визнаний.'],
  '3-4': ['The Empress with The Emperor: care and structure working together.', 'Імператриця з Імператором: турбота і структура працюють разом.'],
}

const MAJORS_MANY: T2 = ['Most of the cards are Major Arcana: these are themes that shape a life, bigger than day-to-day events.', 'Більшість карт — старші аркани: це теми, що формують життя, більші за щоденні події.']
const MAJORS_NONE: T2 = ['There are no Major Arcana, so this is about everyday matters you can influence directly.', 'Старших арканів немає, тож мова про буденні справи, на які ти можеш впливати напряму.']
const SUIT_DOM: T2[] = [
  ['Wands dominate: the reading is about action, ambition and drive.', 'Переважають Жезли: розклад про дію, амбіції та рух уперед.'],
  ['Cups dominate: the reading is about feelings and relationships.', 'Переважають Кубки: розклад про почуття та стосунки.'],
  ['Swords dominate: the reading is about thoughts, truth and communication.', 'Переважають Мечі: розклад про думки, правду й спілкування.'],
  ['Pentacles dominate: the reading is about work, money and practical life.', 'Переважають Пентаклі: розклад про роботу, гроші й практичне життя.'],
]
const REVERSED_MANY: T2 = ['Many cards are reversed: things are blocked or held inside, so the answer lies in what you are holding back.', 'Багато карт перевернуті: усе застрягає або лишається всередині, тож відповідь у тому, що ти стримуєш.']
const COURTS_MANY: T2 = ['Several court cards appear: other people, or different sides of yourself, play a large part.', 'З’явилося кілька придворних карт: інші люди або різні сторони тебе відіграють велику роль.']
const COURT_ONE: T2 = ['The court card may be a person, or a side of you, who is central here.', 'Придворна карта може бути людиною або однією зі сторін тебе, і вона тут центральна.']

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
const LENS_HIT: T2 = ['Your question is about {t}, and the card “{c}” answers it most directly.', 'Твоє питання про {t}, і найпряміше до нього відповідає карта «{c}».']
const LENS_MISS: T2 = ['Your question is about {t}, yet no card speaks about it head-on: the answer is more likely in the reasons and feelings behind the situation than in outward events.', 'Твоє питання про {t}, але жодна карта не говорить про це напряму: відповідь швидше в причинах і почуттях за ситуацією, ніж у зовнішніх подіях.']

// ---------- висновок за настроєм розкладу (лише в режимі «Глибоко») ----------
const CLOSING: Record<Tone, T2[]> = {
  bright: [['Make use of the moment and say yes to what is offered.', 'Скористайся моментом і скажи «так» тому, що пропонують.'], ['Do not talk yourself out of what already works.', 'Не відмовляй себе від того, що вже працює.']],
  hopeful: [['Take the next small step: that is what turns hope into a result.', 'Зроби наступний невеликий крок: саме він перетворює надію на результат.'], ['Act consistently and without rushing: the cards back steady effort.', 'Дій послідовно й без поспіху: карти підтримують стійкі зусилля.']],
  mixed: [['Write down separately what works and what does not, then decide where to put your effort.', 'Випиши окремо, що працює, а що ні, і вирішуй, куди спрямувати зусилля.'], ['Do not demand a final answer from the situation yet: gather one more fact, then decide.', 'Не вимагай від ситуації остаточної відповіді вже зараз: збери ще один факт і тоді вирішуй.']],
  heavy: [['Be gentle with yourself and change one small thing: hard periods pass.', 'Поводься з собою лагідно й зміни одну невелику річ: складні періоди минають.'], ['Do not carry this alone: talk to someone you trust.', 'Не тягни це наодинці: поговори з тим, кому довіряєш.']],
}
const TRUST: T2 = ['A reading shows a direction and a tendency, not a verdict: the decisions stay with you.', 'Розклад показує напрям і тенденцію, а не вирок: рішення залишаються за тобою.']

// ---------- роль карти в позиції конкретного розкладу; {m} — що відбувається (з plain.ts) ----------
const ROLE: Record<string, T2[]> = {
  yesno: [['The card says this — {m}.', 'Карта говорить про таке — {m}.']],
  daily: [['Today the main thing is {m}.', 'Сьогодні головне — {m}.']],
  three: [
    ['Behind you — {m}.', 'Позаду — {m}.'],
    ['Right now, at the centre — {m}.', 'Зараз у центрі — {m}.'],
    ['Ahead — {m}.', 'Попереду — {m}.'],
  ],
  relationship: [
    ['You bring this to the relationship — {m}.', 'Ти вносиш у цей зв’язок — {m}.'],
    ['Your partner brings — {m}.', 'Партнер приносить — {m}.'],
    ['What lives between you — {m}.', 'Між вами живе — {m}.'],
  ],
  career: [
    ['In the situation the main thing is {m}.', 'У ситуації головне — {m}.'],
    ['What stands in the way — {m}.', 'На заваді — {m}.'],
    ['The likely outcome — {m}.', 'Ймовірний результат — {m}.'],
  ],
  purpose: [
    ['Your roots — {m}.', 'Твоє коріння — {m}.'],
    ['Your calling — {m}.', 'Твоє покликання — {m}.'],
    ['The path forward — {m}.', 'Шлях уперед — {m}.'],
  ],
  custom: [
    ['Your focus is on {m}.', 'У твоєму фокусі — {m}.'],
    ['The challenge — {m}.', 'Виклик — {m}.'],
    ['As advice, keep in mind {m}.', 'Порада карт — {m}.'],
  ],
}

const REVERSED_NOTE: T2 = ['The card is reversed, so this theme works weaker or not in full: it gets stuck, put off or lived through inside instead of out in the open.', 'Карта перевернута, тож ця тема працює слабше або не на повну: вона застрягає, відкладається чи проживається всередині, а не на видноті.']
const SCENE: T2 = ['What it can look like: {s}.', 'Як це може виглядати: {s}.']
const SCENE_REVERSED: T2 = ['What it can look like, in a stuck or blocked form: {s}.', 'Як це може виглядати в застряглому чи заблокованому вигляді: {s}.']
const TIP: T2 = ['What to do: {t}.', 'Що з цим робити: {t}.']
const OTHER_SIDE: Record<'up' | 'rev', T2> = {
  up: ['The card is upright; if this theme starts to hold you back, it becomes {m}.', 'Карта пряма; якщо ця тема почне гальмувати, це — {m}.'],
  rev: ['The card is reversed; when this theme works for you, it is {m}.', 'Карта перевернута; коли ця тема працює на тебе, це — {m}.'],
}
const KEY_LINE: T2 = ['The most important card here is “{c}”. {m}', 'Найважливіша карта тут — «{c}». {m}']

export const roleLine = (spreadId: string, index: number, meaning: string, locale: Locale) => at(ROLE[spreadId][index], locale).replace('{m}', meaning)
export const reversedNote = (locale: Locale) => at(REVERSED_NOTE, locale)
export const sceneLine = (scene: string, locale: Locale, reversed = false) => at(reversed ? SCENE_REVERSED : SCENE, locale).replace('{s}', scene)
export const tipLine = (tip: string, locale: Locale) => at(TIP, locale).replace('{t}', tip)
/** Другий бік карти: що буває в протилежному положенні (щоб не повторювати вже сказане про цю карту). */
export const otherSideLine = (up: string, rev: string, reversed: boolean, locale: Locale) => at(OTHER_SIDE[reversed ? 'rev' : 'up'], locale).replace('{m}', reversed ? up : rev)
export const keyLine = (name: string, meaning: string, locale: Locale) => at(KEY_LINE, locale).replace('{c}', name).replace('{m}', sentence(meaning))
export const trustLine = (locale: Locale) => at(TRUST, locale)
export const closingLine = (tone: Tone, seed: number, locale: Locale) => at(pick(CLOSING[tone], seed), locale)

/** Яка карта розкладу головна: на неї спираються короткий висновок і порада. */
export function keyIndex(spreadId: string, a: Analysis): number {
  const v = a.cards.map((c) => c.valence)
  if (spreadId === 'relationship') return 2
  if (spreadId === 'career') return v[2] > v[1] ? 2 : 1
  if (spreadId === 'purpose') return 1
  if (a.cards.length === 3) {
    let best = 1
    for (const i of [0, 2]) if (Math.abs(v[i]) > Math.abs(v[best])) best = i
    return best
  }
  return 0
}

/** Як дві сусідні карти взаємодіють: відома пара, потім масті, потім старші/молодші. */
export function pairLine(a: CardInfo, b: CardInfo, nameA: string, nameB: string, locale: Locale): string {
  const key = `${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}` as (typeof NAMED_PAIRS)[number]
  const fill = (t: T2) => at(t, locale).replace('{a}', nameA).replace('{b}', nameB)
  if (a.major && b.major && PAIR[key]) return at(PAIR[key], locale)
  let base: string
  if (a.major && b.major) base = at(MAJOR_MAJOR, locale)
  else if (a.major !== b.major) base = at(MAJOR_MINOR, locale).replace('{a}', a.major ? nameA : nameB).replace('{b}', a.major ? nameB : nameA)
  else base = at(ELEMENT[`${Math.min(a.suit, b.suit)}${Math.max(a.suit, b.suit)}`], locale)
  // коли карти тягнуть у різні боки, це саме по собі важливо; коли обидві підтримують чи обидві гальмують, вони підсилюють одна одну
  if (a.valence * b.valence < 0) return `${base} ${fill(CONTRAST)}`
  if (a.valence * b.valence > 0 && Math.abs(a.valence + b.valence) >= 3) return `${base} ${fill(AGREE)}`
  return base
}

// ---------- що означає масть у питанні певної сфери ----------
const SUIT_SPHERE: Record<number, Partial<Record<Sphere, T2>>> = {
  0: {
    love: ['Wands in a question about love are attraction, initiative and who makes the first move.', 'Жезли в питанні кохання — це потяг, ініціатива й те, хто робить перший крок.'],
    family: ['Wands in a family question are temperaments, initiative and who sets the tone at home.', 'Жезли в питанні родини — це характери, ініціатива й те, хто задає тон удома.'],
    career: ['Wands in a question about work are ambition, new projects and initiative.', 'Жезли в питанні роботи — це амбіції, нові проєкти й ініціатива.'],
    money: ['Wands in a question about money are new sources of income and readiness to take a risk.', 'Жезли в питанні грошей — це нові джерела доходу й готовність ризикнути.'],
    health: ['Wands in a question about wellbeing are your level of energy and the rhythm of your life.', 'Жезли в питанні самопочуття — це рівень сил і ритм життя.'],
    self: ['Wands in a question about your path are motivation and what you are really drawn to.', 'Жезли в питанні власного шляху — це мотивація й те, до чого тебе справді тягне.'],
    decision: ['Wands in a question of choice are the option that gives momentum and movement.', 'Жезли в питанні вибору — це варіант, який дає розгін і рух.'],
  },
  1: {
    love: ['Cups in a question about love speak directly of feelings, closeness and how the two of you are together.', 'Кубки в питанні кохання — це прямо про почуття, близькість і те, як вам разом.'],
    family: ['Cups in a family question are closeness, attachment and how each person feels.', 'Кубки в питанні родини — це близькість, прив’язаність і те, як почувається кожен.'],
    career: ['Cups in a question about work are the atmosphere, colleagues and whether you like what you do.', 'Кубки в питанні роботи — це атмосфера, колеги й те, чи подобається тобі справа.'],
    money: ['Cups in a question about money are your attitude to it, emotional spending and generosity.', 'Кубки в питанні грошей — це ставлення до них, емоційні витрати й щедрість.'],
    health: ['Cups in a question about wellbeing are mood, emotional background and how stress shows up in you.', 'Кубки в питанні самопочуття — це настрій, емоційний фон і те, як стрес відбивається на тобі.'],
    self: ['Cups in a question about your path are what you feel and long for deep down.', 'Кубки в питанні власного шляху — це те, що ти відчуваєш і чого прагнеш у глибині.'],
    decision: ['Cups in a question of choice are the option your heart leans towards.', 'Кубки в питанні вибору — це варіант, до якого лежить серце.'],
  },
  2: {
    love: ['Swords in a question about love are conversations, truth and what has not been said.', 'Мечі в питанні кохання — це розмови, правда й те, що не сказано.'],
    family: ['Swords in a family question are talk, misunderstandings and unspoken grievances.', 'Мечі в питанні родини — це розмови, непорозуміння й невисловлені претензії.'],
    career: ['Swords in a question about work are decisions, communication, negotiations and documents.', 'Мечі в питанні роботи — це рішення, комунікація, переговори й документи.'],
    money: ['Swords in a question about money are accounts, agreements, contracts and sober calculation.', 'Мечі в питанні грошей — це рахунки, домовленості, договори й тверезий розрахунок.'],
    health: ['Swords in a question about wellbeing are tension, poor sleep and anxious thoughts; this is not a diagnosis.', 'Мечі в питанні самопочуття — це напруга, поганий сон і тривожні думки; це не діагноз.'],
    self: ['Swords in a question about your path are beliefs and the inner voice that judges.', 'Мечі в питанні власного шляху — це переконання й внутрішній голос, який оцінює.'],
    decision: ['Swords in a question of choice are logic, facts and the consequences worth weighing.', 'Мечі в питанні вибору — це логіка, факти й наслідки, які варто зважити.'],
  },
  3: {
    love: ['Pentacles in a question about love are about everyday life, reliability and shared practical plans rather than emotion.', 'Пентаклі в питанні кохання — це про побут, надійність і спільні практичні плани, а не про емоції.'],
    family: ['Pentacles in a family question are the home, money and household duties.', 'Пентаклі в питанні родини — це дім, гроші й побутові обов’язки.'],
    career: ['Pentacles in a question about work are salary, stability, results and practical steps.', 'Пентаклі в питанні роботи — це зарплата, стабільність, результат і практичні кроки.'],
    money: ['Pentacles in a question about money are about money itself: income, savings and the budget.', 'Пентаклі в питанні грошей — це прямо про гроші: дохід, заощадження й бюджет.'],
    health: ['Pentacles in a question about wellbeing are the body, routine, food and rest.', 'Пентаклі в питанні самопочуття — це тіло, режим, харчування й відпочинок.'],
    self: ['Pentacles in a question about your path are real steps, skills and something to stand on.', 'Пентаклі в питанні власного шляху — це реальні кроки, навички й опора.'],
    decision: ['Pentacles in a question of choice are the practical side: money, time and real benefit.', 'Пентаклі в питанні вибору — це практична сторона: гроші, час і реальна користь.'],
  },
}
// розклад сам задає сферу, коли питання загальне чи його немає
const SPREAD_SPHERE: Record<string, Sphere> = { relationship: 'love', career: 'career', purpose: 'self' }

/** Що означає масть цієї карти в сфері питання (або сфері розкладу); порожньо для старших арканів і коли сфера невідома. */
export function suitSphereLine(card: CardInfo, spreadId: string, topic: Analysis['topic'], locale: Locale): string {
  if (card.suit < 0) return ''
  const sphere = topic ?? SPREAD_SPHERE[spreadId]
  const line = sphere ? SUIT_SPHERE[card.suit][sphere] : undefined
  return line ? at(line, locale) : ''
}

// ---------- заголовок розкладу: що він загалом каже ----------
function dailyBucket(v: number): keyof typeof DAILY {
  return v >= 2 ? 'high' : v === 1 ? 'up' : v === 0 ? 'flat' : v === -1 ? 'down' : 'low'
}

/** Одне-два речення про те, що розклад загалом говорить (для «Швидко» це основа відповіді). */
export function headline(spreadId: string, a: Analysis, locale: Locale): string[] {
  const tone = at(pick(TONE[a.tone], a.seed), locale)
  switch (spreadId) {
    case 'daily':
      return [at(DAILY[dailyBucket(a.cards[0].valence)], locale)]
    case 'yesno': {
      const v = verdictFromValence(a.cards[0].valence)
      return [at(VERDICT[`${v.answer}-${v.strength}`], locale)]
    }
    case 'relationship': {
      const d = a.cards[0].valence - a.cards[1].valence
      const v = a.cards[2].valence
      return [at(BALANCE[d >= 2 ? 'you' : d <= -2 ? 'partner' : 'level'], locale), at(CONNECTION[v >= 1 ? 'warm' : v <= -1 ? 'strained' : 'neutral'], locale)]
    }
    case 'career':
      return [tone, at(CAREER[a.cards[2].valence > a.cards[1].valence ? 'resolve' : 'persist'], locale)]
    case 'purpose':
      return [tone, at(TRAJECTORY.purpose[a.trajectory ?? 'steady'], locale)]
    case 'custom':
      return [tone, at(ADVICE[a.cards[2].valence >= a.cards[1].valence ? 'helps' : 'demands'], locale)]
    default:
      return [tone, ...(a.trajectory ? [at(TRAJECTORY.three[a.trajectory], locale)] : [])]
  }
}

/** Спільне для розкладу з двох карт: як взаємодіють «ти» і «партнер» чи «перешкода» і «результат»; для решти порожньо. */
export function insightLines(spreadId: string, a: Analysis, names: string[], locale: Locale): string[] {
  if (spreadId === 'relationship') return [pairLine(a.cards[0], a.cards[1], names[0], names[1], locale)]
  if (spreadId === 'career') return [pairLine(a.cards[1], a.cards[2], names[1], names[2], locale)]
  return []
}

export interface SummaryParts {
  tone: string
  spread: string[] // речення, специфічні для типу розкладу
  structure: string[] // мажори, масті, перевороти, придворні
  combos: string[] // відомі пари та повтори чисел
  lens: string // як карти відповідають сфері питання; порожньо, якщо питання загальне
  closing: string
}

/** Факти розкладу готовими реченнями: з них збирається текст движка, а модель отримує їх як нотатки про поєднання. */
export function summaryParts(spreadId: string, a: Analysis, names: string[], locale: Locale): SummaryParts {
  const n = a.cards.length
  const head = headline(spreadId, a, locale)
  // у «Так/Ні», «Карті дня» і розкладі стосунків заголовок і є «специфічним» реченням; в інших перше речення — загальний настрій
  const own = spreadId === 'yesno' || spreadId === 'daily' || spreadId === 'relationship'
  const spread = own ? head : head.slice(1)
  if (spreadId === 'relationship') spread.push(...insightLines(spreadId, a, names, locale))

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
  let lens = ''
  if (a.topic) {
    const t = at(TOPIC_NAME[a.topic], locale)
    lens = a.topicCard !== null ? at(LENS_HIT, locale).replace('{t}', t).replace('{c}', names[a.topicCard]) : at(LENS_MISS, locale).replace('{t}', t)
  }

  return { tone: own ? '' : head[0], spread, structure, combos, lens, closing: closingLine(a.tone, a.seed, locale) }
}

// ---------- режим «Глибоко»: сценарій, на що звернути увагу, запитання, вправа ----------
const OUTLOOK: Record<string, T2> = {
  three: ['To move in a better direction: {t}.', 'Щоб рухатись у кращий бік: {t}.'],
  relationship: ['For the bond between you ({c}) to work for you: {t}.', 'Щоб зв’язок між вами («{c}») працював на вас: {t}.'],
  career: ['To move from the obstacle to the outcome: {t}.', 'Щоб рухатись від перешкоди до результату: {t}.'],
  purpose: ['The next step on the path ({c}): {t}.', 'Наступний крок на шляху («{c}»): {t}.'],
  daily: ['What to watch today: {t}.', 'На що звернути увагу сьогодні: {t}.'],
  yesno: ['What can change the answer: {t}.', 'Що може змінити відповідь: {t}.'],
  custom: ['To move in a better direction: {t}.', 'Щоб рухатись у кращий бік: {t}.'],
}

/** Що робити далі в цьому розкладі: порада тієї карти, від якої найбільше залежить наступний крок. */
export function outlookLine(spreadId: string, names: string[], tips: string[], locale: Locale): string {
  const t = OUTLOOK[spreadId] ?? OUTLOOK.three
  const tpl = at(t, locale)
  if (spreadId === 'relationship') return tpl.replace('{c}', names[2]).replace('{t}', tips[2])
  if (spreadId === 'career') return tpl.replace('{t}', tips[1])
  if (spreadId === 'purpose') return tpl.replace('{c}', names[2]).replace('{t}', tips[2])
  if (spreadId === 'three' || spreadId === 'custom') return tpl.replace('{t}', tips[1] ?? tips[0])
  return tpl.replace('{t}', tips[0])
}

const WATCH: T2 = ['Pay most attention to the card “{c}”: watch for situations like this one: {s}.', 'Найбільше уваги потребує карта «{c}»: стеж за ситуаціями на кшталт такої: {s}.']
const WATCH_NONE: T2 = ['There are almost no warning signs here; the main thing is not to spoil what already works.', 'Тривожних знаків тут майже немає; головне — не зіпсувати те, що вже працює.']

/** На що звернути увагу найближчими тижнями: найважча карта розкладу й приклад, як вона може проявитись. */
export function watchLine(a: Analysis, names: string[], scenes: string[], locale: Locale): string {
  let worst = 0
  a.cards.forEach((c, i) => {
    if (c.valence < a.cards[worst].valence) worst = i
  })
  if (a.cards[worst].valence > -1) return at(WATCH_NONE, locale)
  return at(WATCH, locale).replace('{c}', names[worst]).replace('{s}', scenes[worst])
}

const QUESTIONS: Record<string, T2[]> = {
  daily: [['Where might the card “{0}” show up today: in which conversation or task?', 'Де сьогодні може проявитись карта «{0}»: у якій розмові чи справі?']],
  yesno: [['What do you really want here, and does it match what the card says?', 'Чого ти хочеш насправді і чи збігається це з тим, що каже карта?'], ['If the answer is not what you hoped for, what would you do differently?', 'Якщо відповідь не така, як хотілося, що ти зробиш інакше?']],
  three: [['What exactly in your life matches the past card “{0}”, and does it still influence you?', 'Що саме у твоєму житті відповідає карті «{0}» з минулого і чи воно ще на тебе впливає?'], ['Which one action this week would bring you closer to what the card “{2}” describes, or keep it away?', 'Яка одна дія цього тижня наблизить тебе до того, що описує карта «{2}», або, навпаки, відсуне це?']],
  relationship: [['What do you really bring to this relationship (the card “{0}”), and what would you like to get in return?', 'Що ти реально вносиш у стосунки (карта «{0}») і що хотілося б отримувати натомість?'], ['What do the two of you need to talk about openly so that the bond (the card “{2}”) works for you?', 'Про що вам двом варто поговорити відверто, щоб зв’язок (карта «{2}») працював на вас?']],
  career: [['Where exactly at work do you see what the card “{1}” describes: is it a person, a habit or a circumstance?', 'Де саме на роботі ти бачиш те, що описує карта «{1}»: це людина, звичка чи обставина?'], ['Which concrete step would bring you closer to what the card “{2}” describes this week?', 'Який конкретний крок наблизить тебе до того, що описує карта «{2}», уже цього тижня?']],
  purpose: [['Where in your life are there already signs of what the card “{1}” describes, even small ones?', 'Де в твоєму житті вже є прояви того, що описує карта «{1}», навіть маленькі?'], ['What from your roots (the card “{0}”) is worth keeping and what is worth letting go?', 'Що з твого коріння (карта «{0}») варто зберегти, а що відпустити?']],
}
QUESTIONS.custom = QUESTIONS.three

/** Два запитання для роздумів, прив’язані до карт цього розкладу. */
export function questionLines(spreadId: string, names: string[], locale: Locale): string[] {
  const fill = (t: T2) => at(t, locale).replace(/\{(\d)\}/g, (_, i) => names[Number(i)] ?? '')
  return (QUESTIONS[spreadId] ?? QUESTIONS.three).map(fill)
}

const PRACTICE: T2 = ['This week: {t}. In the evening, write one sentence about what changed.', 'Цього тижня: {t}. Ввечері запиши одне речення про те, що змінилось.']
const PRACTICE_SINGLE: T2 = ['This week, note each evening where the theme of this card showed up in your day.', 'Цього тижня щовечора записуй, де в твоєму дні проявилась тема цієї карти.']
/** Вправа на тиждень: за порадою головної карти, а для однієї карти (де порада вже прозвучала) — спостереження за її темою. */
export const practiceLine = (tip: string, locale: Locale, single = false): string => (single ? at(PRACTICE_SINGLE, locale) : at(PRACTICE, locale).replace('{t}', tip))

const QUESTION_ECHO: T2 = ['Your question: “{q}”.', 'Твоє питання: «{q}».']
/** Нагадування про питання, щоб глибокий текст був явно про нього; обрізаємо довгі. */
export function questionEcho(question: string, locale: Locale): string {
  const q = question.trim().replace(/\s+/g, ' ')
  if (!q) return ''
  return at(QUESTION_ECHO, locale).replace('{q}', q.length > 140 ? `${q.slice(0, 137)}…` : q)
}
