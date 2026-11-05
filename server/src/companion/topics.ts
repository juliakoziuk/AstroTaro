// Про що людина пише: тема визначається за словами будь-якою з трьох мов (як і символи снів).
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
  ['crisis', word("kill myself|end my life|suicid\\p{L}*|want to die|self[- ]harm|hurt myself|не хочу жити|покінчити з собою|самогубств\\p{L}*|хочу померти|нашкодити собі|quiero morir|acabar con mi vida|hacerme daño|no quiero vivir")],
  ['sadness', word('sad|lonely|cry\\p{L}*|depress\\p{L}*|hopeless|empty|сумн\\p{L}*|сум|печал\\p{L}*|самотн\\p{L}*|плач\\p{L}*|депрес\\p{L}*|порожн\\p{L}*|безнадій\\p{L}*|trist\\p{L}*|soledad|solitari\\p{L}*|llor\\p{L}*|deprim\\p{L}*|vací\\p{L}*|desesper\\p{L}*')],
  ['anxiety', word('anxi\\p{L}*|worr\\p{L}*|nervous|panic|afraid|scared|stress\\p{L}*|overwhelm\\p{L}*|тривож\\p{L}*|тривог\\p{L}*|хвилю\\p{L}*|переживаю|паніка|страх\\p{L}*|боюсь|боюся|стрес\\p{L}*|ansied\\p{L}*|ansios\\p{L}*|preocup\\p{L}*|nervios\\p{L}*|pánico|miedo|estrés|estresad\\p{L}*|agobi\\p{L}*')],
  ['burnout', word('burn(?:ed|t)? ?out|exhaust\\p{L}*|tired|drained|no energy|вигор\\p{L}*|виснаж\\p{L}*|втом\\p{L}*|стомл\\p{L}*|немає сил|нема сил|agotad\\p{L}*|cansad\\p{L}*|quemad\\p{L}*|sin energía|agotamiento')],
  ['anger', word('angry|anger|furious|annoy\\p{L}*|hate|irritat\\p{L}*|злий|зла|злюсь|зли\\p{L}*|гнів\\p{L}*|дратує|роздратув\\p{L}*|ненавиджу|enfad\\p{L}*|rabia|furios\\p{L}*|molest\\p{L}*|odio|irrit\\p{L}*')],
  ['joy', word('happy|joy\\p{L}*|excited|grateful|wonderful|proud|щасл\\p{L}*|радію|радіс\\p{L}*|чудово|гордж\\p{L}*|вдячн\\p{L}*|натхн\\p{L}*|feliz|alegr\\p{L}*|content\\p{L}*|emocionad\\p{L}*|orgullos\\p{L}*|agradecid\\p{L}*')],
  ['love', word('love|relationship|boyfriend|girlfriend|partner|ex|crush|dating|marriage|кохан\\p{L}*|любов\\p{L}*|стосунк\\p{L}*|хлопець|хлопця|дівчина|партнер\\p{L}*|колишн\\p{L}*|весілл\\p{L}*|шлюб\\p{L}*|amor|relaci[oó]n|novi[oa]|pareja|cita|matrimonio|enamorad\\p{L}*')],
  ['work', word('work|job|career|boss|colleague|salary|money|business|study|exam|university|робот\\p{L}*|кар.єр\\p{L}*|начальник\\p{L}*|колег\\p{L}*|зарплат\\p{L}*|гроші|грошей|бізнес\\p{L}*|навчан\\p{L}*|іспит\\p{L}*|універ\\p{L}*|trabajo|empleo|carrera|jefe|colega|salario|dinero|negocio|estudi\\p{L}*|examen|universidad')],
  ['decision', word('decide|decision|choose|choice|should i|which one|dilemma|вирішит\\p{L}*|рішенн\\p{L}*|обрат\\p{L}*|вибір|вибират\\p{L}*|чи варто|дилем\\p{L}*|decidir|decisi[oó]n|elegir|opci[oó]n|debería|dilema')],
  ['future', word('future|will i|what will|next week|next month|tomorrow|predict\\p{L}*|forecast|майбутн\\p{L}*|що буде|що чекає|наступн\\p{L}* тижн\\p{L}*|завтра|прогноз\\p{L}*|передбач\\p{L}*|futuro|qué pasará|que pasara|próxim\\p{L}* semana|mañana|pronóstic\\p{L}*|predicci\\p{L}*')],
  ['advice', word('advice|what (?:should|can) i do|what to do|help me|пораду|порад\\p{L}*|що (?:мені )?робити|що можна зробити|допоможи|consejo|qué hago|qué puedo hacer|ayúdame')],
  ['gratitude', word('thank\\p{L}*|thx|дяк\\p{L}*|дякув\\p{L}*|gracias|agradezco')],
  ['farewell', word('bye|goodbye|see you|бувай|до побачення|на добраніч|adiós|adios|hasta luego|buenas noches')],
  ['greeting', word('hello|hi|hey|good (?:morning|evening)|привіт|вітаю|доброго|добрий (?:день|вечір|ранок)|hola|buenas|buenos d[ií]as')],
]

// привітання вважаємо темою лише в коротких повідомленнях: у довгому «hi» — просто початок розповіді
const GREETING_MAX = 30

export function detectTopics(text: string): Topic[] {
  return TOPICS.filter(([topic, re]) => re.test(text) && (topic !== 'greeting' || text.trim().length <= GREETING_MAX)).map(([topic]) => topic)
}
