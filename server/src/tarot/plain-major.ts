// Старші аркани людською мовою. Рядок кожної карти: [up en, up uk, rev en, rev uk, scene en, scene uk, tip en, tip uk].
//   up / rev — що відбувається (іменникова група, без часу й роду, щоб вставати в «Позаду — …», «На заваді — …»);
//   scene    — як це може виглядати в житті (приклади, теж без часу);
//   tip      — що з цим робити (наказовий спосіб, без роду).
// Мова проста й побутова: без «світла й тіні», «енергій» і «космосу». Карти не пророкують, а описують ситуацію.
export const MAJOR_PLAIN: string[][] = [
  // 0 Блазень
  [
    "a fresh start and a step into something new, with no guarantees",
    "новий старт і крок у невідоме, без жодних гарантій",
    "rushing in without thinking, or freezing at the edge of the first step",
    "поспіх без роздумів або заціпеніння перед першим кроком",
    "changing field, moving to another city, a first date, or a project you are only starting to imagine",
    "зміна сфери, переїзд в інше місто, перше побачення чи справа, яку ти лише починаєш уявляти",
    "take the first step, but check what you are stepping on",
    "зроби перший крок, але спершу перевір, на що наступаєш",
  ],
  // 1 Маг
  [
    "the skills and resources you need, and the right moment to use them",
    "потрібні вміння й ресурси та слушний момент їх застосувати",
    "talent that is scattered, or promises bigger than the follow-through",
    "розпорошений талант або обіцянки, яким бракує виконання",
    "a presentation, a launch, a negotiation, or finally doing what you keep talking about",
    "презентація, запуск, переговори або нарешті втілення того, про що ти давно говориш",
    "pick one goal and put all your tools on it",
    "обери одну мету й спрямуй на неї все, що маєш",
  ],
  // 2 Верховна Жриця
  [
    "a quiet inner knowing, and things that have not been said out loud yet",
    "тихе внутрішнє знання і те, що ще не сказано вголос",
    "ignoring your gut feeling, or half-truths that wear a situation down",
    "ігнорування внутрішнього чуття або недомовки, що підточують ситуацію",
    "a hunch you keep brushing aside, or information that someone is holding back",
    "передчуття, яке ти відганяєш, або інформація, яку хтось притримує",
    "do not decide yet: listen to what you already sense",
    "не поспішай із рішенням: прислухайся до того, що вже відчуваєш",
  ],
  // 3 Імператриця
  [
    "growth through care: for people, for a project, for your body and comfort",
    "зростання через турботу: про людей, справу, власне тіло й комфорт",
    "giving too much, neglecting yourself, or a creative stall",
    "надмірна віддача, нехтування собою або творчий застій",
    "a project that needs patient tending, a relationship that needs warmth, or a rest you keep postponing",
    "справа, яка потребує терплячого догляду, стосунки, яким бракує тепла, або відпочинок, який ти відкладаєш",
    "look after what you want to grow, starting with yourself",
    "доглядай за тим, що хочеш виростити, і почни із себе",
  ],
  // 4 Імператор
  [
    "structure, clear rules and someone who takes responsibility",
    "порядок, чіткі правила і той, хто бере на себе відповідальність",
    "rigidity, control for its own sake, or nobody in charge",
    "жорсткість, контроль заради контролю або відсутність того, хто керує",
    "a boss or parent with firm views, a budget or schedule to set, or your own need to control everything",
    "керівник чи батько з твердою позицією, бюджет чи графік, які варто задати, або твоя потреба все контролювати",
    "set clear boundaries and a plan, and keep to them",
    "задай межі й план і дотримуйся їх",
  ],
  // 5 Ієрофант
  [
    "established ways: rules, institutions, a mentor, advice from someone experienced",
    "перевірені шляхи: правила, інституції, наставник, порада досвідченої людини",
    "outgrowing the rules, or living by expectations that are not yours",
    "вихід за межі правил або життя за чужими очікуваннями",
    "a formal procedure, a degree or contract, a family tradition, or a mentor's opinion",
    "офіційна процедура, диплом чи договір, сімейна традиція або думка наставника",
    "learn the rules first, then decide which of them you keep",
    "спершу вивчи правила, а тоді вирішуй, які з них залишаєш",
  ],
  // 6 Закохані
  [
    "a real choice made from the heart, and honest closeness",
    "справжній вибір за покликом серця і чесна близькість",
    "a choice you keep avoiding, or two people who are not on the same page",
    "вибір, який відкладається, або двоє людей, які не на одній хвилі",
    "choosing between two people or two paths, or an honest talk about what you both want",
    "вибір між двома людьми чи двома шляхами або чесна розмова про те, чого ви обоє хочете",
    "choose what matches your values, not what is easier",
    "обирай те, що відповідає твоїм цінностям, а не те, що простіше",
  ],
  // 7 Колісниця
  [
    "determination and drive toward a goal, won through discipline",
    "рішучість і рух до мети, якого досягають дисципліною",
    "pulling in two directions, or momentum with no direction",
    "тяга в різні боки або рух без напряму",
    "a push before a deadline, a competition, a long trip, or pressing ahead toward a clear target",
    "ривок перед дедлайном, змагання, довга поїздка чи наполегливий рух до чіткої цілі",
    "decide on one direction and hold the reins",
    "визнач один напрям і тримай керування в руках",
  ],
  // 8 Сила
  [
    "calm courage: patience and warmth that win more than force",
    "спокійна мужність: терпіння й теплота, що вирішують більше за силу",
    "self-doubt, burnout, or emotions getting out of hand",
    "сумніви в собі, виснаження або емоції, що виходять з-під контролю",
    "a difficult person you handle with patience, or a fear you are slowly taming",
    "складна людина, до якої потрібен терплячий підхід, або страх, який ти поступово приборкуєш",
    "stay gentle in manner and firm in substance",
    "поводься м’яко, але стій на своєму",
  ],
  // 9 Відлюдник
  [
    "a need to step back, think alone and look for your own answer",
    "потреба відійти вбік, подумати наодинці й знайти власну відповідь",
    "isolation, or running away from questions you need to face",
    "замкнутість або втеча від питань, на які час відповісти",
    "time off to think, a period of solitude, or a mentor who points you in a direction",
    "пауза, щоб подумати, період самотності чи наставник, що підказує напрям",
    "give yourself quiet time before the next big decision",
    "дай собі тишу й час перед наступним великим рішенням",
  ],
  // 10 Колесо Фортуни
  [
    "a turning point: circumstances shift and luck changes direction",
    "поворотний момент: обставини змінюються, а удача розвертається",
    "bad timing, or resisting a change that has already begun",
    "невдалий момент або опір змінам, які вже почалися",
    "an unexpected offer, the end of a cycle, or events outside your control that reshuffle plans",
    "несподівана пропозиція, завершення циклу чи події поза твоїм контролем, що змінюють плани",
    "adapt to the change instead of fighting it",
    "пристосуйся до змін замість боротьби з ними",
  ],
  // 11 Справедливість
  [
    "fairness, honest accounting, and consequences that match actions",
    "справедливість, чесний облік і наслідки, що відповідають вчинкам",
    "unfairness, dodging responsibility, or one-sided facts",
    "несправедливість, ухиляння від відповідальності або однобічні факти",
    "a contract or legal matter, a fair decision, or a moment to own your part in what happened",
    "договір чи юридична справа, справедливе рішення або момент визнати власну частку в тому, що сталося",
    "stick to the facts and own your part",
    "тримайся фактів і визнай свою частку",
  ],
  // 12 Повішений
  [
    "a deliberate pause and a view from a different angle",
    "свідома пауза і погляд під іншим кутом",
    "stalling, or sacrificing yourself for no result",
    "зволікання або марна жертва без результату",
    "a project on hold, a decision that cannot be rushed, or a sacrifice that has lost its point",
    "проєкт на паузі, рішення, яке не можна квапити, або жертва, що втратила сенс",
    "stop pushing and look at it differently before you act",
    "перестань тиснути й подивись на ситуацію інакше, перш ніж діяти",
  ],
  // 13 Смерть
  [
    "a real ending that makes room for something new",
    "справжнє завершення, що звільняє місце для нового",
    "holding on to what is already over, or fear of accepting a change",
    "чіпляння за те, що вже минуло, або страх прийняти зміну",
    "leaving a job or a relationship, closing a chapter, or a habit that has to go",
    "звільнення чи розрив, закритий розділ життя або звичка, якої час позбутися",
    "let go of what has finished, and say so clearly",
    "відпусти те, що завершилося, і скажи про це чітко",
  ],
  // 14 Поміркованість
  [
    "balance and patience: a bit of everything in the right proportions",
    "баланс і терпіння: усього потроху в правильних пропорціях",
    "excess, impatience, or one area of life swallowing the rest",
    "крайнощі, нетерпіння або одна сфера, що поглинає решту",
    "a compromise, recovery after stress, or a steady routine that finally works",
    "компроміс, відновлення після стресу чи стабільний ритм, який нарешті працює",
    "slow down and adjust one thing at a time",
    "уповільнся й підлаштовуй по одній речі за раз",
  ],
  // 15 Диявол
  [
    "attachment that holds you: a habit, a dependency, or a deal you keep staying in",
    "прив’язаність, що тримає: звичка, залежність чи угода, у якій ти лишаєшся",
    "starting to break free and seeing what exactly holds you",
    "початок звільнення: стає видно, що саме тримає",
    "an unhealthy relationship, work or money that is hard to give up, or a habit that runs your day",
    "нездорові стосунки, робота чи гроші, від яких важко відмовитись, або звичка, що керує твоїм днем",
    "name what holds you, and work out what it costs you",
    "назви те, що тебе тримає, і порахуй, чого воно тобі коштує",
  ],
  // 16 Вежа
  [
    "a sudden shake-up that brings down what was not solid",
    "раптовий струс, що валить усе нестійке",
    "a collapse you are putting off, or the aftermath of one",
    "крах, який відкладається, або його наслідки",
    "an unexpected dismissal or breakup, a truth that comes out, or plans that fall apart",
    "несподіване звільнення чи розрив, правда, що відкрилась, або плани, які розвалюються",
    "do not cling to what is already breaking; protect what really matters",
    "не чіпляйся за те, що вже руйнується, і збережи те, що справді важливе",
  ],
  // 17 Зірка
  [
    "hope and recovery after a hard time: a quiet sense that things will work out",
    "надія і відновлення після важкого часу: тихе відчуття, що все налагодиться",
    "lost faith, or feeling drained and disconnected",
    "втрачена віра, виснаження й відчуття відірваності",
    "healing after a crisis, a calm plan for the future, or a small sign that you are on the right path",
    "одужання після кризи, спокійний план на майбутнє чи маленький знак, що ти на правильному шляху",
    "keep going gently; rest, and trust small progress",
    "рухайся далі без поспіху, відпочивай і довіряй малому поступу",
  ],
  // 18 Місяць
  [
    "uncertainty: not everything is clear, and fears or illusions distort the picture",
    "невизначеність: не все зрозуміло, а страхи й ілюзії спотворюють картину",
    "confusion clearing, and a hidden truth coming to the surface",
    "розсіювання плутанини, коли прихована правда виходить на поверхню",
    "mixed signals from someone, anxiety at night, or a situation where key facts are missing",
    "суперечливі сигнали від людини, нічна тривога або ситуація, де бракує ключових фактів",
    "do not decide out of fear; wait for the facts",
    "не вирішуй у тривозі: дочекайся фактів",
  ],
  // 19 Сонце
  [
    "clear success, strength and plainly good news",
    "очевидний успіх, сили й просто гарні новини",
    "muted joy, or good things that take longer than hoped",
    "приглушена радість або добре, що приходить пізніше, ніж хотілося",
    "a result you can be proud of, a happy period with someone close, or recovered confidence",
    "результат, яким можна пишатися, щасливий період із близькою людиною чи відновлена впевненість",
    "enjoy it and share it; do not talk yourself out of it",
    "радій цьому й діліться цим, не відмовляй себе від радості",
  ],
  // 20 Суд
  [
    "a moment of taking stock and a call to start again on honest terms",
    "момент підбиття підсумків і поклик почати наново на чесних умовах",
    "harsh self-criticism, or ignoring a call you already hear",
    "самокритика або ігнорування поклику, який ти вже чуєш",
    "rethinking your career, forgiving an old mistake, or a decision to change your life",
    "переосмислення кар’єри, прощення давньої помилки або рішення змінити життя",
    "take an honest look back, then act on what you see",
    "чесно оглянься назад і дій за результатом",
  ],
  // 21 Світ
  [
    "completion: a cycle closes and long work gives a result",
    "завершення: цикл закривається, і довга робота дає результат",
    "something almost finished but left open: a loose end that holds you back",
    "майже завершена справа, що лишається відкритою: хвіст, який тримає",
    "graduation, finishing a big project, a completed move, or the feeling that a chapter was closed well",
    "випуск, завершення великого проєкту, завершений переїзд або відчуття, що розділ закрито добре",
    "finish the last piece before you start the next",
    "доведи останню частину до кінця, перш ніж братися за наступну",
  ],
]
