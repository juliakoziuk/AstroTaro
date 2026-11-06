// Тлумачення аспектів за парами планет: `ease` — для злагоджених аспектів (сполучення, секстиль, тригон),
// `hard` — для напружених (квадратура, опозиція). Для пар без `hard` (Сонце–Меркурій тощо) напружених аспектів
// не буває. Пари двох повільних планет (Уран, Нептун, Плутон між собою) тут не описані: вони спільні для покоління.
// Тексти нейтральні за родом.
import type { T2 } from './readings'

interface Pair {
  ease: T2
  hard?: T2
}

export const PAIRS: Record<string, Pair> = {
  'Sun-Moon': {
    ease: ['Will and feelings pull together: you know what you want and what you need, and act from a calm inner unity.', 'Воля й почуття тягнуть в один бік: ти знаєш, чого хочеш і що тобі потрібно, і дієш із внутрішньої єдності.'],
    hard: ['What you want and what you need disagree: you may feel torn between goals and comfort, and growth comes from honouring both.', 'Те, чого ти хочеш, і те, що тобі потрібно, не збігаються: ти можеш розриватися між цілями й комфортом, а зростання — у тому, щоб чути обидва голоси.'],
  },
  'Sun-Mercury': {
    ease: ['Mind and identity work as one: you think the way you are and put yourself into your words.', 'Розум і ідентичність діють заодно: ти думаєш так, як ти є, і вкладаєш себе у слова.'],
  },
  'Sun-Venus': {
    ease: ['Warmth, charm and self-expression go together: people like you easily and you know what you value.', 'Тепло, чарівність і самовираження йдуть разом: ти легко подобаєшся людям і знаєш, що цінуєш.'],
  },
  'Sun-Mars': {
    ease: ['Willpower and drive reinforce each other: you act on what you want with energy and courage.', 'Воля й енергія підсилюють одна одну: ти дієш відповідно до власних бажань, енергійно й сміливо.'],
    hard: ['Ego and impulse clash: strong drive that can turn into impatience or conflict, which you learn to channel into effort.', 'Его й імпульс стикаються: сильна енергія, що може обертатися нетерпінням чи сутичками; вчися спрямовувати її в зусилля.'],
  },
  'Sun-Jupiter': {
    ease: ['Confidence and optimism feed each other: you attract opportunity and generosity and believe in your own growth.', 'Упевненість і оптимізм живлять одне одного: ти притягуєш можливості й щедрість та віриш у власне зростання.'],
    hard: ['Big appetite and big promises: you risk overreaching, and do best when ambition is paired with follow-through.', 'Великий апетит і великі обіцянки: є ризик переоцінити себе; найкраще виходить, коли амбіції підкріплені виконанням.'],
  },
  'Sun-Saturn': {
    ease: ['Responsibility and identity cooperate: you build self-respect through patient, steady effort.', 'Відповідальність і ідентичність співпрацюють: ти будуєш самоповагу через терпляче, стабільне зусилля.'],
    hard: ['A harsh inner critic and a heavy sense of duty: self-doubt is possible, yet discipline eventually turns it into real authority.', 'Суворий внутрішній критик і важке відчуття обов’язку: можливі сумніви в собі, та з часом дисципліна перетворює це на справжній авторитет.'],
  },
  'Sun-Uranus': {
    ease: ['Originality is part of your identity: you act independently, handle change well and carry a spark of genius.', 'Оригінальність — частина твоєї ідентичності: ти дієш самостійно, добре переносиш зміни й несеш іскру геніальності.'],
    hard: ['A restless need to be free: you break away from routine or authority suddenly, and sharp turns in life teach you who you are.', 'Неспокійна потреба у свободі: ти раптово розриваєш із рутиною чи авторитетом, а різкі повороти в житті вчать тебе, хто ти є.'],
  },
  'Sun-Neptune': {
    ease: ['Sensitivity and imagination colour your identity: you inspire, feel compassion and are attuned to art and spirit.', 'Чутливість і уява забарвлюють ідентичність: ти надихаєш, співчуваєш і чуєш мистецтво та дух.'],
    hard: ['Your sense of self can blur: you idealise or lose boundaries, so keep a clear anchor in daily reality.', 'Відчуття себе може розмиватися: ти ідеалізуєш або губиш межі, тож тримай чітку опору в щоденній реальності.'],
  },
  'Sun-Pluto': {
    ease: ['Quiet intensity and resilience: after crises you recover with added strength, and your will to renew yourself is firm.', 'Тиха інтенсивність і стійкість: після криз ти відновлюєшся з додатковою силою, а воля до оновлення в тебе міцна.'],
    hard: ['Power struggles and all-or-nothing moments: intense people or events force you to transform and take your power back.', 'Боротьба за владу й моменти «усе або нічого»: інтенсивні люди чи події змушують тебе трансформуватися й повертати собі силу.'],
  },
  'Moon-Mercury': {
    ease: ['Feeling and thinking talk to each other: you can put emotions into words and understand why you feel as you do.', 'Почуття й думки розмовляють між собою: ти вмієш висловити емоції та розумієш, чому відчуваєш саме так.'],
    hard: ['Head and heart talk past each other: you may over-think feelings or feel your thoughts, and clarity comes from naming emotions out loud.', 'Розум і серце говорять повз одне одного: можеш надто аналізувати почуття або «відчувати» думки; ясність приходить, коли називаєш емоції вголос.'],
  },
  'Moon-Venus': {
    ease: ['Emotional warmth and affection flow freely: you give and receive love gently, and comfort comes through beauty and closeness.', 'Емоційне тепло й ніжність течуть вільно: ти м’яко даєш і приймаєш любов, а затишок приходить через красу й близькість.'],
    hard: ['The need for love and the wish for pleasure compete: you may seek comfort in indulgence or find it hard to ask for affection directly.', 'Потреба в любові й жага задоволень конкурують: ти можеш шукати розради в надмірностях або важко просити про ніжність прямо.'],
  },
  'Moon-Mars': {
    ease: ['Feeling and action are well connected: you respond fast and protectively, and your emotions give you drive.', 'Почуття й дія тісно пов’язані: ти реагуєш швидко й захисно, а емоції дають тобі енергію.'],
    hard: ['Feelings come out as irritation or sharp reactions: anger flares fast, and you learn to turn that heat into honest, timely action.', 'Почуття виходять роздратуванням чи різкими реакціями: злість спалахує швидко, а ти вчишся перетворювати цей жар на чесну, вчасну дію.'],
  },
  'Moon-Jupiter': {
    ease: ['Generous, optimistic feelings: you trust life, comfort others easily and feel emotionally supported.', 'Щедрі, оптимістичні почуття: ти довіряєш життю, легко втішаєш інших і відчуваєш емоційну підтримку.'],
    hard: ['Emotions are inflated and generous to a fault: when moved you may overindulge or promise too much, so measure what you give.', 'Емоції роздуті й щедрі до надмірності: розчулившись, ти можеш забагато собі дозволити чи пообіцяти, тож зважуй, що віддаєш.'],
  },
  'Moon-Saturn': {
    ease: ['Emotional maturity and self-control: under pressure you stay steady and meet responsibilities without losing warmth.', 'Емоційна зрілість і самоконтроль: під тиском ти зберігаєш стійкість і виконуєш обов’язки, не втрачаючи тепла.'],
    hard: ['Feelings are guarded and carry old worries about being enough or being safe; softness comes slowly, but it grows into deep reliability.', 'Почуття під охороною й несуть давні тривоги про «достатньо» та «безпечно»; м’якість приходить повільно, зате виростає в глибоку надійність.'],
  },
  'Moon-Uranus': {
    ease: ['Emotional independence: you adapt quickly to change, and need a measure of freedom to feel at home.', 'Емоційна незалежність: ти швидко пристосовуєшся до змін, а щоб почуватися вдома, потрібна міра свободи.'],
    hard: ['Unpredictable moods and a restless need for freedom: security feels both necessary and confining, so build a stable base with room to move.', 'Непередбачувані настрої й неспокійна потреба у свободі: безпека здається і потрібною, і сковуючою, тож будуй стабільну основу з простором для руху.'],
  },
  'Moon-Neptune': {
    ease: ['Deep empathy and intuition: you feel what others feel, and music, art and dreams nourish you.', 'Глибока емпатія й інтуїція: ти відчуваєш те, що відчувають інші, а музика, мистецтво й сни тебе живлять.'],
    hard: ['You absorb moods like a sponge and may blur your feelings with other people’s; boundaries and rest keep sensitivity from turning into confusion.', 'Ти вбираєш настрої, як губка, і можеш змішувати свої почуття з чужими; межі й відпочинок стережуть чутливість від плутанини.'],
  },
  'Moon-Pluto': {
    ease: ['Deep, loyal feelings and emotional resilience: you sense hidden currents and turn pain into strength.', 'Глибокі, вірні почуття й емоційна стійкість: ти відчуваєш приховані течії й перетворюєш біль на силу.'],
    hard: ['Intense, sometimes possessive feelings and strong reactions: old emotional patterns surface until you face them, and then they become real depth.', 'Інтенсивні, інколи власницькі почуття й сильні реакції: давні емоційні сценарії спливають, доки їх не зустрінеш, а тоді стають справжньою глибиною.'],
  },
  'Mercury-Venus': {
    ease: ['Words and charm go together: you speak pleasantly, like beautiful ideas and negotiate gracefully.', 'Слова й чарівність ідуть разом: ти говориш приємно, любиш гарні ідеї й граційно домовляєшся.'],
  },
  'Mercury-Mars': {
    ease: ['A quick, energetic mind: you argue well, decide fast and act on ideas.', 'Швидкий, енергійний розум: ти вмієш сперечатися, швидко вирішуєш і втілюєш ідеї.'],
    hard: ['Sharp words and a short fuse: you can win arguments that were not worth starting, so choose what to say before the heat arrives.', 'Гострі слова й запальність: можна виграти суперечки, яких не варто було починати, тож добирай слова, поки не накрило жаром.'],
  },
  'Mercury-Jupiter': {
    ease: ['Big-picture thinking with good luck in learning, teaching and travel: your ideas find supporters.', 'Масштабне мислення й удача в навчанні, викладанні та подорожах: твої ідеї знаходять прихильників.'],
    hard: ['Grand ideas and loose details: you promise more than you check, so verify the small print.', 'Грандіозні ідеї й вільне поводження з деталями: ти обіцяєш більше, ніж перевіряєш, тож звіряй дрібний шрифт.'],
  },
  'Mercury-Saturn': {
    ease: ['Disciplined, careful thinking: you plan well, speak with weight and finish what you study.', 'Дисципліноване, обережне мислення: ти добре плануєш, говориш вагомо й доводиш до кінця те, що вивчаєш.'],
    hard: ['Self-doubt in speech and a strict inner censor: you may overthink before speaking, yet your words gain depth and authority with time.', 'Сумніви у власних словах і суворий внутрішній цензор: можеш надто довго зважувати перед тим, як сказати, зате з часом слова набувають глибини й ваги.'],
  },
  'Mercury-Uranus': {
    ease: ['A brilliant, inventive mind: ideas arrive suddenly, and you see solutions others miss.', 'Блискучий, винахідливий розум: ідеї приходять раптово, а рішення ти бачиш там, де інші їх не помічають.'],
    hard: ['Racing, nervous thoughts and a taste for provocation: you say things abruptly, so let ideas settle before sharing them.', 'Стрімкі, нервові думки й смак до провокацій: ти кажеш різко, тож дай ідеям відстоятися, перш ніж ділитися ними.'],
  },
  'Mercury-Neptune': {
    ease: ['A poetic, intuitive mind: you think in images, read between the lines and speak or write with feeling.', 'Поетичний, інтуїтивний розум: ти мислиш образами, читаєш між рядків і говориш чи пишеш із відчуттям.'],
    hard: ['Thoughts can drift or blur: details slip and misunderstandings happen, so write things down and check facts.', 'Думки можуть пливти й розмиватися: дрібниці вислизають, трапляються непорозуміння, тож записуй і перевіряй факти.'],
  },
  'Mercury-Pluto': {
    ease: ['A probing, persuasive mind: you dig to the root of things and your words carry weight.', 'Проникливий, переконливий розум: ти докопуєшся до суті, а слова мають вагу.'],
    hard: ['Obsessive thinking or cutting words: the mind can fix on one thing, so turn that intensity into research instead of rumination.', 'Нав’язливі думки чи ріжучі слова: розум може зациклитися, тож спрямуй цю інтенсивність у дослідження, а не в передумування.'],
  },
  'Venus-Mars': {
    ease: ['Attraction and passion work together: chemistry, flirtation and a healthy balance of giving and taking in love.', 'Потяг і пристрасть діють заодно: хімія, флірт і здоровий баланс між «давати» й «брати» у коханні.'],
    hard: ['Desire and tenderness tug against each other: chemistry is strong, but needs and approach can clash in relationships.', 'Бажання й ніжність тягнуть у різні боки: хімія сильна, та потреби й підхід у стосунках можуть конфліктувати.'],
  },
  'Venus-Jupiter': {
    ease: ['Generosity in love and money, a good taste for pleasure and the sense that life is kind to you.', 'Щедрість у коханні й грошах, добрий смак до задоволень і відчуття, що життя до тебе добре.'],
    hard: ['An appetite for pleasure and comfort: you may spend, indulge or love too freely, so notice where enough is enough.', 'Апетит до задоволень і комфорту: ти можеш витрачати, потурати собі чи любити надто вільно, тож помічай, де «досить».'],
  },
  'Venus-Saturn': {
    ease: ['Love and loyalty are serious matters: you value lasting commitments and show affection through reliability.', 'Любов і вірність для тебе серйозні: ти цінуєш тривалі зобов’язання й виявляєш ніжність через надійність.'],
    hard: ['Fear of going without love or of loss: you may hold affection back, yet relationships built slowly with you are very durable.', 'Страх лишитися без любові чи втратити: можеш стримувати ніжність, зате стосунки, що будуються поволі, з тобою дуже міцні.'],
  },
  'Venus-Uranus': {
    ease: ['Love is a mix of freedom and excitement: you are drawn to the unusual and keep friendships fresh.', 'Кохання — суміш свободи й хвилювання: тебе вабить незвичайне, а дружби лишаються свіжими.'],
    hard: ['Sudden attractions and a fear of being tied down: relationships can start or end abruptly, and you learn what freedom inside love means.', 'Раптові потяги й страх прив’язаності: стосунки можуть починатися чи закінчуватися різко, а ти вчишся, що таке свобода всередині любові.'],
  },
  'Venus-Neptune': {
    ease: ['Romantic, artistic and compassionate in love: you see the beauty in people and are drawn to soulful bonds.', 'У коханні — романтичність, артистизм і співчуття: ти бачиш красу в людях і тягнешся до душевних зв’язків.'],
    hard: ['You idealise partners and may meet disappointment when reality shows through; clarity about what you actually need makes love steadier.', 'Ти ідеалізуєш партнерів і можеш розчаровуватися, коли проступає реальність; ясність щодо того, що тобі справді потрібно, робить кохання стійкішим.'],
  },
  'Venus-Pluto': {
    ease: ['Magnetic, deep attachments: you love intensely and your bonds can heal and transform you.', 'Магнетичні, глибокі прив’язаності: ти любиш інтенсивно, а зв’язки можуть зцілювати й змінювати тебе.'],
    hard: ['Jealousy, intensity and all-or-nothing love: relationships mirror power and trust, and growth comes from letting go of control.', 'Ревнощі, інтенсивність і кохання «усе або нічого»: стосунки стають дзеркалом влади й довіри, а зростання приходить, коли відпускаєш контроль.'],
  },
  'Mars-Jupiter': {
    ease: ['Confidence and enthusiasm drive you: you take on big projects boldly and tend to be lucky when you try.', 'Упевненість і ентузіазм рухають тебе: ти сміливо береш великі проєкти й часто маєш успіх, коли пробуєш.'],
    hard: ['Energy overshoots: you start more than you can finish or push too hard, so aim your fire at one goal.', 'Енергія б’є через край: береш більше, ніж можеш завершити, або тиснеш надто сильно; спрямуй свій вогонь на одну ціль.'],
  },
  'Mars-Saturn': {
    ease: ['Controlled power: you combine drive with discipline, work patiently and have real endurance.', 'Контрольована сила: ти поєднуєш енергію з дисципліною, працюєш терпляче й маєш справжню витривалість.'],
    hard: ['The gas pedal and the brake at once: frustration and delays, but if you hold your course, hard-won results last.', 'Газ і гальмо водночас: розчарування й затримки, та якщо триматися курсу, результати, здобуті з зусиллям, тривають.'],
  },
  'Mars-Uranus': {
    ease: ['Sudden bursts of energy and a taste for independence: you start new things fast and cope well in an emergency.', 'Раптові сплески енергії й смак до самостійності: ти швидко береш до нового й добре дієш в екстремальних обставинах.'],
    hard: ['Impatient, impulsive energy and rebellion: haste leads to mistakes or sudden clashes, so channel the spark into movement and invention.', 'Нетерпляча, імпульсивна енергія й бунт: поспіх призводить до помилок і раптових сутичок, тож спрямуй іскру в рух і винахідливість.'],
  },
  'Mars-Neptune': {
    ease: ['Inspired action: you work best when moved by a dream or a cause, with gentle, creative energy.', 'Натхненна дія: ти найкраще працюєш, коли тебе веде мрія чи справа, з м’якою, творчою енергією.'],
    hard: ['Energy leaks away into doubt or avoidance: commitment is hard, so set clear goals and small steps to stay on course.', 'Енергія витікає в сумніви чи ухиляння: братися всерйоз важко, тож став чіткі цілі й малі кроки, щоб тримати курс.'],
  },
  'Mars-Pluto': {
    ease: ['Intense, focused power: you have stamina, resolve and the courage to push through hard things.', 'Інтенсивна, зосереджена сила: у тебе є витримка, рішучість і мужність пройти крізь важке.'],
    hard: ['Raw force and strong resistance: you can clash with others when power is at stake, so aim this strength at a worthy challenge.', 'Сира сила й сильний опір: можливі сутички, коли йдеться про владу, тож спрямуй цю міць на гідний виклик.'],
  },
  'Jupiter-Saturn': {
    ease: ['Optimism and realism balance each other: you grow carefully, and your plans tend to hold.', 'Оптимізм і реалізм врівноважують один одного: ти зростаєш обережно, і плани зазвичай тримаються.'],
    hard: ['Expansion meets restriction: you swing between daring and caution, and success comes from combining both.', 'Розширення зустрічає обмеження: ти хитаєшся між сміливістю й обережністю, а успіх — у поєднанні обох.'],
  },
  'Jupiter-Uranus': {
    ease: ['Luck on the side of change: unconventional opportunities, optimism about the new and the courage to leave the beaten path.', 'Удача на боці змін: нестандартні можливості, оптимізм щодо нового й сміливість зійти з битого шляху.'],
    hard: ['Restless expansion: you chase freedom and big leaps and risk overreaching, so pair vision with a plan.', 'Неспокійне розширення: ти женешся за свободою й великими стрибками та ризикуєш переоцінити сили, тож поєднуй бачення з планом.'],
  },
  'Jupiter-Neptune': {
    ease: ['Faith and compassion: spiritual or artistic openness and a generous, trusting outlook on life.', 'Віра й співчуття: духовна чи художня відкритість і щедрий, довірливий погляд на життя.'],
    hard: ['Idealism can run ahead of the facts: hope and trust are sometimes misplaced, so test big dreams against reality.', 'Ідеалізм може випереджати факти: надія й довіра іноді спрямовані не туди, тож перевіряй великі мрії реальністю.'],
  },
  'Jupiter-Pluto': {
    ease: ['Ambition with depth: you grow by transforming resources and can attract significant influence.', 'Амбіції з глибиною: ти зростаєш, трансформуючи ресурси, і можеш притягувати значний вплив.'],
    hard: ['An appetite for power and big stakes: grand ambitions meet resistance, so use influence responsibly.', 'Апетит до влади й великих ставок: грандіозні амбіції зустрічають опір, тож користуйся впливом відповідально.'],
  },
  'Saturn-Uranus': {
    ease: ['Tradition and innovation cooperate: you reform from within and make new ideas practical.', 'Традиція й новаторство співпрацюють: ти змінюєш зсередини й робиш нові ідеї практичними.'],
    hard: ['Structure against change: the urge for freedom clashes with duty, and the result is practical innovation if patience holds.', 'Структура проти змін: потяг до свободи стикається з обов’язком, а результат — практичне новаторство, якщо вистачає терпіння.'],
  },
  'Saturn-Neptune': {
    ease: ['Dreams get a form: imagination is backed by discipline, and spiritual practice becomes steady.', 'Мрії набувають форми: уяву підтримує дисципліна, а духовна практика стає стабільною.'],
    hard: ['Doubts about ideals: the real and the imagined pull apart, and learning to build with both makes your work meaningful.', 'Сумніви в ідеалах: реальне й уявне розходяться, а навчившись будувати з обох, ти робиш справу змістовною.'],
  },
  'Saturn-Pluto': {
    ease: ['Quiet, enduring strength: you can rebuild from the ground up and carry heavy responsibility.', 'Тиха, стійка сила: ти можеш відбудовуватися з нуля й упоратися з важкою відповідальністю.'],
    hard: ['A heavy sense of pressure and control: fear of loss pushes you to hold on, and real strength comes from letting go in time.', 'Тяжке відчуття тиску й контролю: страх втрати змушує триматися, а справжня сила — у тому, щоб вчасно відпускати.'],
  },
}
