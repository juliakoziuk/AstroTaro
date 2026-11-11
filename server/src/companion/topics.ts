// Про що людина пише: тема визначається за словами англійської чи української мови (як і символи снів).
export type Topic =
  | 'crisis'
  | 'sadness'
  | 'anxiety'
  | 'burnout'
  | 'anger'
  | 'joy'
  | 'love'
  | 'work'
  | 'decision'
  | 'future'
  | 'advice'
  | 'gratitude'
  | 'farewell'
  | 'greeting'

// межа слова для будь-яких літер (\b не працює з кирилицею); стеми з \p{L}* ловлять форми слів
const word = (fragment: string) => new RegExp(`(?<!\\p{L})(?:${fragment})(?!\\p{L})`, 'iu')

// порядок важливий: від найважливішого до другорядного
const TOPICS: [Topic, RegExp][] = [
  ['crisis', word("kill myself|end my life|suicid\\p{L}*|want to die|self[- ]harm|hurt myself|не хочу жити|покінчити з собою|самогубств\\p{L}*|хочу померти|нашкодити собі")],
  ['sadness', word('sad|lonely|cry\\p{L}*|depress\\p{L}*|hopeless|empty|сумн\\p{L}*|сум|печал\\p{L}*|самотн\\p{L}*|плач\\p{L}*|депрес\\p{L}*|порожн\\p{L}*|безнадій\\p{L}*')],
  ['anxiety', word('anxi\\p{L}*|worr\\p{L}*|nervous|panic|afraid|scared|stress\\p{L}*|overwhelm\\p{L}*|тривож\\p{L}*|тривог\\p{L}*|хвилю\\p{L}*|переживаю|паніка|страх\\p{L}*|боюсь|боюся|стрес\\p{L}*')],
  ['burnout', word('burn(?:ed|t)? ?out|exhaust\\p{L}*|tired|drained|no energy|вигор\\p{L}*|виснаж\\p{L}*|втом\\p{L}*|стомл\\p{L}*|немає сил|нема сил')],
  ['anger', word('angry|anger|furious|annoy\\p{L}*|hate|irritat\\p{L}*|злий|зла|злюсь|зли\\p{L}*|гнів\\p{L}*|дратує|роздратув\\p{L}*|ненавиджу')],
  ['joy', word('happy|joy\\p{L}*|excited|grateful|wonderful|proud|щасл\\p{L}*|радію|радіс\\p{L}*|чудово|гордж\\p{L}*|вдячн\\p{L}*|натхн\\p{L}*')],
  ['love', word('love|relationship|boyfriend|girlfriend|partner|ex|crush|dating|marriage|кохан\\p{L}*|любов\\p{L}*|стосунк\\p{L}*|хлопець|хлопця|дівчина|партнер\\p{L}*|колишн\\p{L}*|весілл\\p{L}*|шлюб\\p{L}*')],
  ['work', word('work|job|career|boss|colleague|salary|money|business|study|exam|university|робот\\p{L}*|кар.єр\\p{L}*|начальник\\p{L}*|колег\\p{L}*|зарплат\\p{L}*|гроші|грошей|бізнес\\p{L}*|навчан\\p{L}*|іспит\\p{L}*|універ\\p{L}*')],
  ['decision', word('decide|decision|choose|choice|should i|which one|dilemma|вирішит\\p{L}*|рішенн\\p{L}*|обрат\\p{L}*|вибір|вибират\\p{L}*|чи варто|дилем\\p{L}*')],
  ['future', word('future|will i|what will|next week|next month|tomorrow|predict\\p{L}*|forecast|майбутн\\p{L}*|що буде|що чекає|наступн\\p{L}* тижн\\p{L}*|завтра|прогноз\\p{L}*|передбач\\p{L}*')],
  ['advice', word('advice|what (?:should|can) i do|what to do|help me|пораду|порад\\p{L}*|що (?:мені )?робити|що можна зробити|допоможи')],
  ['gratitude', word('thank\\p{L}*|thx|дяк\\p{L}*|дякув\\p{L}*')],
  ['farewell', word('bye|goodbye|see you|бувай|до побачення|на добраніч')],
  ['greeting', word('hello|hi|hey|good (?:morning|evening)|привіт|вітаю|доброго|добрий (?:день|вечір|ранок)')],
]

// привітання вважаємо темою лише в коротких повідомленнях: у довгому «hi» — просто початок розповіді
const GREETING_MAX = 30

export function detectTopics(text: string): Topic[] {
  return TOPICS.filter(([topic, re]) => re.test(text) && (topic !== 'greeting' || text.trim().length <= GREETING_MAX)).map(([topic]) => topic)
}
