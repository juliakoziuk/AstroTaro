// Довідкові дані: 78 карт колоди таро з коротким тлумаченням у прямому й перевернутому положенні, трьома мовами.
// Рядок кожного запису: [назва, пряме, перевернуте], кожне — [en, uk, es].
import { Locale, LOCALES } from '../i18n/locale'

type T3 = [string, string, string]
const at = (t: T3, l: Locale) => t[LOCALES.indexOf(l)]

export interface Card {
  id: number
  name: string
  upright: string
  reversed: string
}

const MAJOR: [T3, T3, T3][] = [
  [['The Fool', 'Блазень', 'El Loco'], ['a fresh start and trust in the unknown', 'новий початок і довіра до невідомого', 'un nuevo comienzo y confianza en lo desconocido'], ['recklessness or fear of taking the first step', 'безрозсудність або страх зробити перший крок', 'imprudencia o miedo a dar el primer paso']],
  [['The Magician', 'Маг', 'El Mago'], ['will, skill and the power to manifest', 'воля, майстерність і сила втілювати задумане', 'voluntad, habilidad y el poder de manifestar'], ['scattered energy or untapped potential', 'розпорошена енергія або нереалізований потенціал', 'energía dispersa o potencial sin aprovechar']],
  [['The High Priestess', 'Верховна Жриця', 'La Sacerdotisa'], ['intuition and hidden knowledge', 'інтуїція й приховані знання', 'intuición y conocimiento oculto'], ['an ignored inner voice or secrets kept too long', 'ігнорований внутрішній голос або надто довго приховані таємниці', 'una voz interior ignorada o secretos guardados demasiado tiempo']],
  [['The Empress', 'Імператриця', 'La Emperatriz'], ['abundance, care and creativity', 'достаток, турбота і творчість', 'abundancia, cuidado y creatividad'], ['overgiving or creative blocks', 'надмірна самопожертва або творчі блоки', 'dar demasiado o bloqueos creativos']],
  [['The Emperor', 'Імператор', 'El Emperador'], ['structure, stability and leadership', 'структура, стабільність і лідерство', 'estructura, estabilidad y liderazgo'], ['rigidity or loss of control', 'ригідність або втрата контролю', 'rigidez o pérdida de control']],
  [['The Hierophant', 'Ієрофант', 'El Hierofante'], ['tradition, guidance and shared values', 'традиція, наставництво і спільні цінності', 'tradición, guía y valores compartidos'], ['breaking free from convention', 'вихід за межі умовностей', 'liberarse de las convenciones']],
  [['The Lovers', 'Закохані', 'Los Enamorados'], ['harmony, love and aligned choices', 'гармонія, любов і узгоджений вибір', 'armonía, amor y decisiones alineadas'], ['imbalance or a difficult decision', 'дисбаланс або складне рішення', 'desequilibrio o una decisión difícil']],
  [['The Chariot', 'Колісниця', 'El Carro'], ['determination and forward momentum', 'рішучість і рух уперед', 'determinación e impulso hacia adelante'], ['lack of direction or inner conflict', 'брак напряму або внутрішній конфлікт', 'falta de dirección o conflicto interno']],
  [['Strength', 'Сила', 'La Fuerza'], ['quiet courage and compassion', 'тиха мужність і співчуття', 'valentía serena y compasión'], ['self-doubt or depleted energy', 'сумніви в собі або виснажена енергія', 'dudas sobre uno mismo o energía agotada']],
  [['The Hermit', 'Відлюдник', 'El Ermitaño'], ['inner search and solitude', 'внутрішній пошук і самотність', 'búsqueda interior y soledad'], ['isolation or avoiding reflection', 'ізоляція або уникання роздумів', 'aislamiento o evitar la reflexión']],
  [['Wheel of Fortune', 'Колесо Фортуни', 'La Rueda de la Fortuna'], ['cycles, luck and a turning point', 'цикли, удача і поворотний момент', 'ciclos, suerte y un punto de inflexión'], ['resistance to change or bad timing', 'опір змінам або невдалий момент', 'resistencia al cambio o mal momento']],
  [['Justice', 'Справедливість', 'La Justicia'], ['truth, fairness and clear cause and effect', 'правда, справедливість і чіткі причини та наслідки', 'verdad, equidad y causa y efecto claros'], ['dishonesty or avoiding accountability', 'нечесність або ухилення від відповідальності', 'deshonestidad o evitar la responsabilidad']],
  [['The Hanged Man', 'Повішений', 'El Colgado'], ['a pause and a new perspective', 'пауза і новий погляд', 'una pausa y una nueva perspectiva'], ['stalling or needless sacrifice', 'зволікання або марна жертва', 'estancamiento o sacrificio innecesario']],
  [['Death', 'Смерть', 'La Muerte'], ['an ending that clears the way for renewal', 'завершення, що розчищає шлях для оновлення', 'un final que abre camino a la renovación'], ['clinging to what is already over', 'чіпляння за те, що вже минуло', 'aferrarse a lo que ya terminó']],
  [['Temperance', 'Поміркованість', 'La Templanza'], ['balance, patience and healing', 'баланс, терпіння та зцілення', 'equilibrio, paciencia y sanación'], ['excess or inner imbalance', 'надмірність або внутрішній дисбаланс', 'exceso o desequilibrio interior']],
  [['The Devil', 'Диявол', 'El Diablo'], ['attachment and the chains we choose', 'прив’язаність і ланцюги, які ми обираємо самі', 'apego y las cadenas que elegimos'], ['release and breaking free of a pattern', 'звільнення й вихід зі шаблону', 'liberación y salir de un patrón']],
  [['The Tower', 'Вежа', 'La Torre'], ['sudden change that frees you from false ground', 'раптова зміна, що звільняє від хибного ґрунту', 'un cambio repentino que te libera de un falso suelo'], ['fear of change or a delayed upheaval', 'страх змін або відкладений злам', 'miedo al cambio o una sacudida retrasada']],
  [['The Star', 'Зірка', 'La Estrella'], ['renewed hope and inspiration', 'відновлена надія і натхнення', 'esperanza renovada e inspiración'], ['lost faith or disconnection', 'втрачена віра або відчуженість', 'fe perdida o desconexión']],
  [['The Moon', 'Місяць', 'La Luna'], ['uncertainty, dreams and the subconscious', 'невизначеність, сни і підсвідомість', 'incertidumbre, sueños y subconsciente'], ['confusion lifting and hidden truths surfacing', 'розвіювання плутанини і поява прихованої правди', 'la confusión se disipa y salen a la luz verdades ocultas']],
  [['The Sun', 'Сонце', 'El Sol'], ['success, clarity and joy', 'успіх, ясність і радість', 'éxito, claridad y alegría'], ['temporary clouds or muted optimism', 'тимчасові хмари або приглушений оптимізм', 'nubes pasajeras u optimismo apagado']],
  [['Judgement', 'Суд', 'El Juicio'], ['awakening, calling and renewal', 'пробудження, покликання й оновлення', 'despertar, vocación y renovación'], ['self-criticism or ignoring the call', 'самокритика або ігнорування покликання', 'autocrítica o ignorar el llamado']],
  [['The World', 'Світ', 'El Mundo'], ['completion, wholeness and achievement', 'завершення, цілісність і досягнення', 'cierre, plenitud y logro'], ['unfinished business or a loose end', 'незавершені справи або незакритий кінець', 'asuntos pendientes o un cabo suelto']],
]

// масть: [називний (en/es), родовий для uk, тема]
const SUITS: { name: T3; theme: T3 }[] = [
  { name: ['Wands', 'Жезлів', 'Bastos'], theme: ['passion and action', 'пристрасть і дія', 'la pasión y la acción'] },
  { name: ['Cups', 'Кубків', 'Copas'], theme: ['emotion and relationships', 'емоції та стосунки', 'las emociones y las relaciones'] },
  { name: ['Swords', 'Мечів', 'Espadas'], theme: ['thought and communication', 'думка і спілкування', 'el pensamiento y la comunicación'] },
  { name: ['Pentacles', 'Пентаклів', 'Oros'], theme: ['work, money and the material world', 'робота, гроші й матеріальний світ', 'el trabajo, el dinero y el mundo material'] },
]

const RANKS: [T3, T3, T3][] = [
  [['Ace', 'Туз', 'As'], ['a new beginning', 'новий початок', 'un nuevo comienzo'], ['a missed or blocked start', 'згаяний або заблокований початок', 'un comienzo perdido o bloqueado']],
  [['Two', 'Двійка', 'Dos'], ['balance and choice', 'баланс і вибір', 'equilibrio y elección'], ['indecision', 'нерішучість', 'indecisión']],
  [['Three', 'Трійка', 'Tres'], ['growth and collaboration', 'зростання і співпраця', 'crecimiento y colaboración'], ['delays in teamwork', 'затримки у спільній роботі', 'retrasos en el trabajo en equipo']],
  [['Four', 'Четвірка', 'Cuatro'], ['stability and rest', 'стабільність і відпочинок', 'estabilidad y descanso'], ['stagnation', 'застій', 'estancamiento']],
  [['Five', 'П’ятірка', 'Cinco'], ['conflict and challenge', 'конфлікт і випробування', 'conflicto y desafío'], ['resolution after tension', 'вирішення після напруги', 'resolución tras la tensión']],
  [['Six', 'Шістка', 'Seis'], ['harmony and progress', 'гармонія й поступ', 'armonía y progreso'], ['slow progress', 'повільний поступ', 'progreso lento']],
  [['Seven', 'Сімка', 'Siete'], ['reflection and perseverance', 'роздуми й наполегливість', 'reflexión y perseverancia'], ['doubt and scattered effort', 'сумніви й розпорошені зусилля', 'dudas y esfuerzo disperso']],
  [['Eight', 'Вісімка', 'Ocho'], ['movement and mastery', 'рух і майстерність', 'movimiento y maestría'], ['a stall or loss of focus', 'зупинка або втрата фокусу', 'un estancamiento o pérdida de enfoque']],
  [['Nine', 'Дев’ятка', 'Nueve'], ['near completion and resilience', 'близьке завершення й стійкість', 'casi completo y resiliencia'], ['exhaustion near the finish', 'виснаження перед фінішем', 'agotamiento cerca de la meta']],
  [['Ten', 'Десятка', 'Diez'], ['fulfilment and a cycle closing', 'повнота й завершення циклу', 'plenitud y cierre de un ciclo'], ['burden or an overextended cycle', 'тягар або надто затягнутий цикл', 'carga o un ciclo demasiado largo']],
  [['Page', 'Паж', 'Sota'], ['curiosity and a new message', 'цікавість і нова звістка', 'curiosidad y un nuevo mensaje'], ['immaturity or hesitation', 'незрілість або вагання', 'inmadurez o vacilación']],
  [['Knight', 'Лицар', 'Caballero'], ['pursuit and energetic movement', 'поривання й енергійний рух', 'búsqueda y movimiento enérgico'], ['impulsiveness or burnout', 'імпульсивність або вигорання', 'impulsividad o agotamiento']],
  [['Queen', 'Королева', 'Reina'], ['nurturing mastery', 'дбайлива майстерність', 'maestría que cuida'], ['insecurity or withheld care', 'невпевненість або стримана турбота', 'inseguridad o cuidado contenido']],
  [['King', 'Король', 'Rey'], ['authority and mature control', 'авторитет і зріла стриманість', 'autoridad y control maduro'], ['misuse of power', 'зловживання владою', 'abuso de poder']],
]

// як складаються назва й значення молодшого аркана в кожній мові
const MINOR_NAME: Record<Locale, (rank: string, suit: string) => string> = {
  en: (r, s) => `${r} of ${s}`,
  uk: (r, s) => `${r} ${s}`,
  es: (r, s) => `${r} de ${s}`,
}
const MINOR_MEANING: Record<Locale, (m: string, theme: string) => string> = {
  en: (m, th) => `${m} in ${th}`,
  uk: (m, th) => `${m} у темі «${th}»`,
  es: (m, th) => `${m} en ${th}`,
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
