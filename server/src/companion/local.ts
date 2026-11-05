// Локальний асистент (коли немає ключа AI або модель недоступна): відповідає на те, про що людина пише,
// говорить голосом обраної персони, не повторюється й обережно реагує на кризові повідомлення.
// Це не модель, а довідникова логіка: тема повідомлення → визнання почуття + порада + запитання.
import { currentPlanets } from '../astrology/astro'
import { inSign, monthlyInsight } from '../astrology/text'
import { analyzeDream } from '../dreams/analysis'
import { Locale, LOCALES } from '../i18n/locale'
import { cardOf } from '../tarot/cards'
import { draw } from '../tarot/readings'
import { UserContext } from './context'
import { Turn } from './providers'
import { detectTopics, Topic } from './topics'

type T3 = [string, string, string]
const at = (t: T3, l: Locale) => t[LOCALES.indexOf(l)]

type Key = 'sadness' | 'anxiety' | 'burnout' | 'anger' | 'joy' | 'love' | 'work' | 'decision' | 'future' | 'other'
interface Voice {
  ack: [T3, T3]
  step: [T3, T3]
  ask: [T3, T3]
}

const VOICE: Record<Key, Voice> = {
  sadness: {
    ack: [
      ['I’m sorry you’re feeling this heavy. Thank you for saying it out loud.', 'Мені шкода, що тобі зараз так важко. Дякую, що сказано це вголос.', 'Lamento que ahora te sientas tan mal. Gracias por decirlo en voz alta.'],
      ['That sounds like a lot to carry right now, and it makes sense that you feel low.', 'Звучить так, ніби ти зараз несеш багато, і цілком природно, що на душі сумно.', 'Parece una carga grande para este momento, y es natural que estés bajo de ánimo.'],
    ],
    step: [
      ['Try something very small and kind today: a glass of water, a short walk, or a message to someone you trust.', 'Спробуй сьогодні щось дуже мале й добре до себе: склянку води, коротку прогулянку або повідомлення комусь, кому довіряєш.', 'Prueba hoy algo muy pequeño y amable: un vaso de agua, un paseo corto o un mensaje a alguien de confianza.'],
      ['You don’t have to fix it today. Choose one gentle thing for your body and let the rest wait.', 'Не обов’язково вирішувати все сьогодні. Обери одну лагідну дію для тіла, а решта почекає.', 'No tienes que arreglarlo hoy. Elige una cosa suave para tu cuerpo y deja que el resto espere.'],
    ],
    ask: [
      ['What has been weighing on you the most?', 'Що тисне на тебе найбільше?', '¿Qué es lo que más te pesa?'],
      ['When did you last feel a little lighter, and what was happening then?', 'Коли востаннє тобі було трохи легше, і що тоді відбувалося?', '¿Cuándo fue la última vez que te sentiste un poco mejor y qué estaba pasando?'],
    ],
  },
  anxiety: {
    ack: [
      ['That sounds stressful. Anxiety is your mind trying to protect you, even when it’s uncomfortable.', 'Це звучить напружено. Тривога — це спроба розуму тебе захистити, навіть коли це некомфортно.', 'Suena estresante. La ansiedad es tu mente intentando protegerte, aunque sea incómoda.'],
      ['It makes sense to feel on edge with so much in your head.', 'Цілком зрозуміло, що ти на межі, коли в голові так багато всього.', 'Es comprensible sentirse al límite con tanto en la cabeza.'],
    ],
    step: [
      ['Try slowing your breath: in for four, out for six, a few times. Then write down the one thing you can control today.', 'Спробуй сповільнити подих: вдих на чотири, видих на шість, кілька разів. Потім запиши одну річ, яку можеш контролювати сьогодні.', 'Intenta frenar la respiración: inhala en cuatro, exhala en seis, varias veces. Luego anota lo único que puedes controlar hoy.'],
      ['Name what is real right now versus what is only a “what if”. Start with the real one.', 'Назви, що є реальним просто зараз, а що лише «а що, як». Почни з реального.', 'Distingue lo que es real ahora de lo que es solo un «y si». Empieza por lo real.'],
    ],
    ask: [
      ['What is the biggest “what if” on your mind?', 'Яке найбільше «а що, як» крутиться в голові?', '¿Cuál es el mayor «y si» que tienes en mente?'],
      ['What would feel like enough for today?', 'Що було б достатнім на сьогодні?', '¿Qué sería suficiente por hoy?'],
    ],
  },
  burnout: {
    ack: [
      ['Burnout is real, and it usually means you’ve been giving more than you’ve been receiving.', 'Вигорання справжнє, і зазвичай воно означає, що ти віддаєш більше, ніж отримуєш.', 'El agotamiento es real y suele significar que das más de lo que recibes.'],
      ['Being this exhausted is a signal, not a failure.', 'Така втома — це сигнал, а не провал.', 'Sentir tanto agotamiento es una señal, no un fracaso.'],
    ],
    step: [
      ['Protect one hour this week that is only for rest, with no goals attached. Then check which task you can drop or delegate.', 'Захисти цього тижня одну годину лише для відпочинку, без жодних цілей. Потім переглянь, яке завдання можна відкласти чи делегувати.', 'Protege esta semana una hora solo para descansar, sin metas. Luego revisa qué tarea puedes soltar o delegar.'],
      ['Start with sleep, food and one pause during the day; growth comes back after the basics.', 'Почни зі сну, їжі й однієї паузи протягом дня; зростання повертається після базових речей.', 'Empieza por el sueño, la comida y una pausa durante el día; el crecimiento vuelve después de lo básico.'],
    ],
    ask: [
      ['Where does most of your energy go right now?', 'Куди зараз іде найбільше твоєї енергії?', '¿A dónde va ahora la mayor parte de tu energía?'],
      ['What could come out of your day if nobody judged you for it?', 'Що можна було б прибрати зі свого дня, якби ніхто цього не засуджував?', '¿Qué dejarías de hacer si nadie te juzgara por ello?'],
    ],
  },
  anger: {
    ack: [
      ['Anger often protects something that matters to you. It’s okay to feel it.', 'Гнів часто захищає те, що для тебе важливе. Мати його — нормально.', 'La rabia suele proteger algo que te importa. Está bien sentirla.'],
      ['That sounds really frustrating.', 'Звучить справді прикро й дратівливо.', 'Suena realmente frustrante.'],
    ],
    step: [
      ['Give the feeling some room first: a walk, or writing it all down unsent. Decide what to do after it cools.', 'Спершу дай почуттю місце: прогулянка або лист, який ти не відправляєш. Вирішуй, що робити, коли охолоне.', 'Primero dale espacio a la emoción: un paseo o escribirlo todo sin enviarlo. Decide qué hacer cuando se enfríe.'],
      ['Ask what boundary was crossed, and what a calm version of “no” would sound like.', 'Запитай себе, яку межу було порушено і як би звучало спокійне «ні».', 'Pregúntate qué límite se cruzó y cómo sonaría un «no» tranquilo.'],
    ],
    ask: [
      ['What exactly crossed the line for you?', 'Що саме перейшло межу?', '¿Qué fue exactamente lo que cruzó el límite?'],
      ['What do you need from this situation to feel respected?', 'Що тобі потрібно в цій ситуації, щоб відчути повагу?', '¿Qué necesitas de esta situación para sentir que te respetan?'],
    ],
  },
  joy: {
    ack: [
      ['I love hearing that. Let yourself enjoy it fully.', 'Як приємно це чути. Дозволь собі насолодитися цим повністю.', 'Me encanta oír eso. Permítete disfrutarlo por completo.'],
      ['That’s wonderful; moments like this are worth noticing.', 'Чудово; такі моменти варто помічати.', 'Qué maravilla; momentos así merecen atención.'],
    ],
    step: [
      ['Anchor it: write down what made today good so you can return to it later.', 'Закріпи це: запиши, що зробило день добрим, щоб повертатися до цього пізніше.', 'Ancla el momento: anota qué hizo bueno el día para volver a ello más tarde.'],
      ['Share it with someone; joy grows when it’s told.', 'Поділися цим із кимось; радість росте, коли про неї розповідаєш.', 'Compártelo con alguien; la alegría crece al contarla.'],
    ],
    ask: [
      ['What made it possible?', 'Що зробило це можливим?', '¿Qué lo hizo posible?'],
      ['What would you like more of in your days?', 'Чого б у твоїх днях могло бути більше?', '¿Qué te gustaría tener más en tus días?'],
    ],
  },
  love: {
    ack: [
      ['Relationships touch the most tender parts of us, so it’s natural this is on your mind.', 'Стосунки торкаються найніжніших частин нас, тож природно, що це в тебе на думці.', 'Las relaciones tocan lo más sensible de nosotros, así que es natural que lo tengas en mente.'],
      ['Thank you for sharing something so personal.', 'Дякую, що ділишся таким особистим.', 'Gracias por compartir algo tan personal.'],
    ],
    step: [
      ['Before deciding anything, notice how you feel after spending time with this person: lighter or heavier?', 'Перш ніж щось вирішувати, придивись, як ти почуваєшся після часу з цією людиною: легше чи важче?', 'Antes de decidir nada, fíjate en cómo te sientes tras pasar tiempo con esa persona: ¿más ligero o más pesado?'],
      ['Say one honest sentence about what you need, without expecting an answer right away.', 'Скажи одне чесне речення про те, що тобі потрібно, не чекаючи відповіді одразу.', 'Di una frase honesta sobre lo que necesitas, sin esperar respuesta de inmediato.'],
    ],
    ask: [
      ['What do you most hope for in this connection?', 'На що ти найбільше сподіваєшся в цьому зв’язку?', '¿Qué esperas más de este vínculo?'],
      ['What is the hardest part to say out loud?', 'Що найважче сказати вголос?', '¿Qué es lo más difícil de decir en voz alta?'],
    ],
  },
  work: {
    ack: [
      ['Work and money worries can take up a lot of space in the mind.', 'Тривоги про роботу й гроші можуть займати багато місця в думках.', 'Las preocupaciones por el trabajo y el dinero ocupan mucho espacio mental.'],
      ['It sounds like a lot is riding on this.', 'Звучить так, ніби на цьому багато що тримається.', 'Parece que hay mucho en juego.'],
    ],
    step: [
      ['Break it into the smallest next step you can finish in 20 minutes, and do only that.', 'Розбий це на найменший наступний крок, який можна зробити за 20 хвилин, і зроби лише його.', 'Divídelo en el paso siguiente más pequeño, que puedas terminar en 20 minutos, y haz solo ese.'],
      ['Write your options in two columns: what you gain and what you risk. Seeing it on paper helps.', 'Запиши варіанти у двох колонках: що ти здобуваєш і чим ризикуєш. Це допомагає побачити картину.', 'Anota tus opciones en dos columnas: qué ganas y qué arriesgas. Verlo en papel ayuda.'],
    ],
    ask: [
      ['What is the very next step?', 'Який наступний крок?', '¿Cuál es el siguiente paso?'],
      ['What would “good enough” look like here?', 'Як би виглядало «достатньо добре» в цій ситуації?', '¿Cómo sería «suficientemente bueno» aquí?'],
    ],
  },
  decision: {
    ack: [
      ['Decisions are hard when both options matter to you.', 'Рішення важкі, коли обидва варіанти для тебе важливі.', 'Las decisiones cuestan cuando ambas opciones te importan.'],
      ['It’s a good sign that you’re pausing to think instead of rushing.', 'Це добрий знак, що ти зупиняєшся подумати, а не поспішаєш.', 'Es buena señal que te detengas a pensar en vez de apresurarte.'],
    ],
    step: [
      ['Imagine living each option for a week. Notice which one your body relaxes toward.', 'Уяви, що живеш кожним варіантом тиждень. Помічай, до якого тіло розслабляється.', 'Imagina vivir cada opción durante una semana. Nota hacia cuál se relaja tu cuerpo.'],
      ['List what you would regret not trying. Regret often points the way.', 'Випиши, про що шкодуватимеш, якщо не спробуєш. Жаль часто вказує напрям.', 'Anota de qué te arrepentirías por no intentarlo. El arrepentimiento suele señalar el camino.'],
    ],
    ask: [
      ['Which option would you choose if nobody would judge it?', 'Який варіант обереш, якщо уявити, що ніхто не буде засуджувати?', '¿Qué opción elegirías si nadie te juzgara?'],
      ['What is the fear underneath each option?', 'Який страх лежить під кожним варіантом?', '¿Qué miedo hay debajo de cada opción?'],
    ],
  },
  future: {
    ack: [
      ['The future can feel exciting and uncertain at the same time.', 'Майбутнє може бути водночас захопливим і непевним.', 'El futuro puede sentirse emocionante e incierto a la vez.'],
      ['Wanting to know what is ahead is deeply human.', 'Бажання знати, що попереду, — глибоко людське.', 'Querer saber lo que viene es profundamente humano.'],
    ],
    step: [
      ['I can’t predict it, but I can help you shape it: choose one intention for the coming week and one small action for it.', 'Я не можу це передбачити, але можу допомогти це сформувати: обери один намір на наступний тиждень і одну малу дію для нього.', 'No puedo predecirlo, pero puedo ayudarte a darle forma: elige una intención para la próxima semana y una pequeña acción para ella.'],
      ['Instead of asking what will happen, ask what you want to build, and look for the next small step.', 'Замість «що буде?» спитай «що я хочу збудувати?» і знайди наступний малий крок.', 'En vez de preguntar qué pasará, pregunta qué quieres construir y busca el siguiente paso pequeño.'],
    ],
    ask: [
      ['What do you hope will be different a month from now?', 'Що ти сподіваєшся змінити за місяць?', '¿Qué esperas que sea distinto dentro de un mes?'],
      ['How would you like this week to feel?', 'Яким ти хочеш відчувати цей тиждень?', '¿Cómo te gustaría sentir esta semana?'],
    ],
  },
  other: {
    ack: [
      ['Thank you for sharing that. Let’s look at it together.', 'Дякую, що ділишся цим. Давай придивимось до цього разом.', 'Gracias por compartirlo. Miremos esto juntos.'],
      ['I hear you.', 'Я тебе чую.', 'Te escucho.'],
    ],
    step: [
      ['Try putting it into one sentence: what is this really about for you?', 'Спробуй сказати це одним реченням: про що це насправді для тебе?', 'Intenta decirlo en una frase: ¿de qué trata esto realmente para ti?'],
      ['Notice what you feel in your body as you think about it; that is often the real message.', 'Помічай, що ти відчуваєш у тілі, коли думаєш про це: це часто і є справжнє повідомлення.', 'Fíjate en lo que sientes en el cuerpo al pensar en ello: suele ser el verdadero mensaje.'],
    ],
    ask: [
      ['What feels most important to understand here?', 'Що тут найважливіше зрозуміти?', '¿Qué es lo más importante de entender aquí?'],
      ['What would help you most right now?', 'Що зараз допомогло б тобі найбільше?', '¿Qué te ayudaría más ahora mismo?'],
    ],
  },
}

const ADVICE_LEAD: T3 = ['Here are two things that could help:', 'Ось дві речі, які можуть допомогти:', 'Aquí tienes dos ideas que pueden ayudar:']
const KEYED: Topic[] = ['sadness', 'anxiety', 'burnout', 'anger', 'joy', 'love', 'work', 'decision', 'future']

const CRISIS: T3 = [
  'What you’re telling me matters, and I’m concerned about you. You deserve support from a real person right now. Please call your local emergency number (112) or a crisis line (for example 988 in the US), or reach out to someone you trust and stay with them. I’m here with you, too.',
  'Те, що ти кажеш, дуже важливо, і я хвилююся за тебе. Тобі зараз потрібна підтримка живої людини. Зателефонуй за номером екстреної допомоги 112 або на лінію психологічної підтримки (в Україні — Lifeline Ukraine, 7333) чи звернись до близької людини й побудь із нею. Я теж поруч.',
  'Lo que cuentas es muy importante y me preocupas. Mereces el apoyo de una persona real ahora mismo. Llama al 112 o a la línea de prevención del suicidio (en España, el 024), o acércate a alguien de confianza y quédate con esa persona. Yo también estoy aquí.',
]
const GRATITUDE: T3 = ['You’re very welcome. I’m glad it helped. Is there anything else on your mind?', 'Мені приємно, що це допомогло. Є ще щось, що тебе турбує чи цікавить?', 'Me alegra que te haya ayudado. ¿Hay algo más en tu mente?']
const FAREWELL: T3 = ['Take care of yourself. I’ll be here whenever you want to talk.', 'Бережи себе. Я тут, коли захочеш поговорити.', 'Cuídate. Estaré aquí cuando quieras hablar.']
const GREETING: Record<Locale, (name: string) => string> = {
  en: (n) => `Hello, ${n}! It’s good to see you. How are you feeling today?`,
  uk: () => 'Привіт! Приємно тебе бачити. Як ти сьогодні?', // імені немає: у кличному відмінку його не відмінюємо
  es: (n) => `¡Hola, ${n}! Qué bueno verte. ¿Cómo te sientes hoy?`,
}

// голоси персон
const MYSTIC_FRAME: T3 = ['In the wider rhythm of the month:', 'У ширшому ритмі місяця:', 'En el ritmo más amplio del mes:']
const COACH_STEP: T3 = ['A small step:', 'Маленький крок:', 'Un paso pequeño:']
const SKY_NOW: T3 = ['The sky right now', 'Небо просто зараз', 'El cielo ahora mismo']
const SKY_PERSONAL: Record<Locale, (sun: string) => string> = {
  en: (s) => `For you (${s}) this is an invitation to reflect, not a verdict.`,
  uk: (s) => `Для тебе (${s}) це запрошення до роздумів, а не вирок.`,
  es: (s) => `Para ti (${s}) es una invitación a reflexionar, no un veredicto.`,
}
const SKY_ASK: T3 = ['Which area of your life would you like the sky to speak about?', 'Про яку сферу життя ти хочеш, щоб заговорило небо?', '¿Sobre qué área de tu vida quieres que hable el cielo?']
const CARD_LINE: Record<Locale, (name: string, rev: boolean, meaning: string) => string> = {
  en: (n, r, m) => `For your question the card is ${n}${r ? ' (reversed)' : ''}: it speaks of ${m}.`,
  uk: (n, r, m) => `Для твого питання випала карта ${n}${r ? ' (перевернута)' : ''}: вона говорить про ${m}.`,
  es: (n, r, m) => `Para tu pregunta salió la carta ${n}${r ? ' (invertida)' : ''}: habla de ${m}.`,
}
const DREAM_NOTICE: Record<Locale, (symbols: string) => string> = {
  en: (s) => `I notice ${s} in what you describe.`,
  uk: (s) => `У твоїй розповіді я помічаю: ${s}.`,
  es: (s) => `En lo que describes noto: ${s}.`,
}
const DREAM_ASK: T3 = ['How did you feel inside the dream?', 'Які почуття були в тебе у сні?', '¿Qué sentimientos tuviste en el sueño?']
const DREAM_PROMPT: T3 = [
  'Have any dreams stayed with you lately? Tell me what you saw and how it felt.',
  'Чи залишився з тобою якийсь сон? Розкажи, що ти бачив і що відчував.',
  '¿Te ha quedado algún sueño en la cabeza? Cuéntame qué viste y cómo se sintió.',
]

export interface LocalInput {
  persona: string
  text: string
  locale: Locale
  history: Turn[]
  ctx: UserContext
  now?: Date
  rng?: () => number
}

// абзаци розділяємо порожнім рядком (бульбашка чату зберігає переноси): визнання, порада, запитання читаються окремо
const join = (...parts: (string | undefined)[]) => parts.filter(Boolean).join('\n\n')
const sentence = (...parts: string[]) => parts.join(' ')

export function localReply({ persona, text, locale, history, ctx, now = new Date(), rng = Math.random }: LocalInput): string {
  const topics = detectTopics(text)
  if (topics[0] === 'crisis') return at(CRISIS, locale)

  // номер ходу: від нього залежить, який із варіантів фраз брати, тож відповіді не повторюються
  const turn = history.filter((m) => m.role === 'user').length
  const pick = <V,>(pair: [V, V], shift = 0) => pair[(turn + shift) % 2]

  const keyed = topics.filter((t) => KEYED.includes(t)) as Key[]
  if (!keyed.length && topics.includes('farewell')) return at(FAREWELL, locale)
  if (!keyed.length && topics.includes('gratitude')) return at(GRATITUDE, locale)
  if (!keyed.length && topics.includes('greeting')) return GREETING[locale](ctx.name)

  // тема розмови: з цього повідомлення, а якщо в ньому її нема («не знаю», «дай пораду») — з попередніх
  const carried = [...history].reverse().filter((m) => m.role === 'user').map((m) => detectTopics(m.content).find((t) => KEYED.includes(t))).find(Boolean) as Key | undefined
  const key: Key = keyed[0] ?? carried ?? 'other'
  const v = VOICE[key]
  const stepVoice = VOICE[keyed[1] ?? key] // друге почуття дає крок: перше визнаємо, на друге відповідаємо дією
  const ack = at(pick(v.ack), locale)
  const step = at(pick(stepVoice.step, 1), locale)
  const ask = at(pick(v.ask), locale)

  // прохання про пораду: без вступів, дві конкретні ідеї
  if (topics.includes('advice') && ['Mystic Guide', 'Life Coach'].includes(persona)) {
    const [first, second] = v.step.map((s) => at(s, locale))
    return join(sentence(at(ADVICE_LEAD, locale), first), second, ask)
  }

  switch (persona) {
    case 'Tarot Advisor': {
      const [drawn] = draw('daily', rng)
      const card = cardOf(drawn.id, locale)
      const speaks = (drawn.reversed ? card.reversed : card.upright).toLowerCase()
      return join(ack, CARD_LINE[locale](card.name, drawn.reversed, speaks), ask)
    }
    case 'Astrologer': {
      const sky = currentPlanets(now)
        .filter((p) => ['Mercury', 'Venus', 'Mars'].includes(p.name))
        .map((p) => inSign(p.name, p.sign, locale))
      const sun = ctx.sunSign ? SKY_PERSONAL[locale](inSign('Sun', ctx.sunSign, locale)) : undefined
      return join(`${at(SKY_NOW, locale)}: ${sky.join(', ')}.`, sentence(monthlyInsight(now, locale), sun ?? ''), topics.length ? ask : at(SKY_ASK, locale))
    }
    case 'Dream Interpreter': {
      const a = analyzeDream('', text, locale)
      if (a.symbols.length) return join(sentence(DREAM_NOTICE[locale](a.symbols.join(', ')), a.interpretation), at(DREAM_ASK, locale))
      return join(ack, at(DREAM_PROMPT, locale))
    }
    case 'Life Coach':
      return join(ack, `${at(COACH_STEP, locale)} ${step}`, ask)
    default:
      return join(sentence(ack, at(MYSTIC_FRAME, locale), monthlyInsight(now, locale)), step, ask)
  }
}
