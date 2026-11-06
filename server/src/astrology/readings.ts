// Авторські тлумачення натальної карти двома мовами (en, uk): кожна планета в кожному знаку має власний текст,
// а не склейку з однакових «рис знака». Таблиці індексуються порядком знаків: Овен … Риби (SIGNS в astro.ts).
// Тексти нейтральні за родом: звернення «ти» без закінчень, що залежать від статі.
import { Locale, LOCALES } from '../i18n/locale'
import { PAIRS } from './pairs'

export type T2 = [string, string]
export const at = (t: T2, l: Locale) => t[LOCALES.indexOf(l)]

const SIGN_ORDER = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']

/** Планета в знаку: 12 текстів у порядку знаків. */
const PLACEMENT: Record<string, T2[]> = {
  Sun: [
    ['Your life force comes from initiative: you feel most alive when you lead, begin things and act on instinct.', 'Твоя життєва сила йде від ініціативи: ти найповніше відчуваєш себе, коли очолюєш, починаєш і дієш за інстинктом.'],
    ['You build your identity slowly and solidly, through comfort, loyalty and things that last; being rushed drains you.', 'Ідентичність у тебе будується повільно й міцно — через затишок, вірність і те, що триває; поспіх тебе виснажує.'],
    ['Your identity lives in curiosity and exchange: you become yourself by learning, talking and trying many angles.', 'Твоя ідентичність живе в цікавості й обміні: ти стаєш собою, коли вчишся, говориш і пробуєш різні ракурси.'],
    ['You are defined by care and belonging: an emotionally safe home and loyal bonds are the ground of your strength.', 'Тебе визначають турбота й почуття належності: емоційно безпечний дім і вірні зв’язки — основа твоєї сили.'],
    ['You shine through creative self-expression and generosity; being seen and appreciated feeds your vitality.', 'Ти сяєш через творче самовираження й щедрість; коли тебе помічають і цінують, життєва сила зростає.'],
    ['You find purpose in useful work, precision and improvement; you feel whole when things are in order and you are genuinely helping.', 'Ти знаходиш сенс у корисній справі, точності та вдосконаленні; цілісність приходить, коли речі впорядковані, а ти справді допомагаєш.'],
    ['Your identity forms in relationship: balance, fairness and beauty matter, and you grow through honest partnership.', 'Ідентичність формується у стосунках: тобі важливі баланс, справедливість і краса, а зростаєш ти в чесному партнерстві.'],
    ['You live intensely and privately; depth, truth and the power to transform crises define who you are.', 'Ти живеш інтенсивно й закрито; глибина, правда й здатність перетворювати кризи визначають, хто ти.'],
    ['Meaning and freedom are your core: you grow through travel, big ideas and faith in the larger picture.', 'Сенс і свобода — твоя основа: ти зростаєш через подорожі, великі ідеї та віру у ширшу картину.'],
    ['You grow through responsibility and long-term effort; authority and achievement are earned step by step.', 'Ти зростаєш через відповідальність і довгі зусилля; авторитет і досягнення здобуваються крок за кроком.'],
    ['You are your own kind of person: independence, ideas and a wish to improve things for everyone define your path.', 'Ти — особлива людина: незалежність, ідеї та бажання вдосконалювати світ для всіх визначають твій шлях.'],
    ['There is a lot of subtle sensitivity and imagination in you: compassion, intuition and creative or spiritual depth are the heart of your identity.', 'У тобі багато тонкої чутливості та уяви: співчуття, інтуїція й творча чи духовна глибина — серце твоєї ідентичності.'],
  ],
  Moon: [
    ['Feelings flare up fast and honest; you need action and independence to release them, and you cool down just as quickly.', 'Емоції спалахують швидко й чесно; щоб їх розрядити, потрібні дія та самостійність, а відходиш ти так само швидко.'],
    ['You need calm, comfort and physical routine to feel safe; emotional steadiness is your gift, and change works best when it is gradual.', 'Щоб почуватися в безпеці, тобі потрібні спокій, затишок і тілесна рутина; емоційна стійкість — твій дар, а зміни найкраще вводити поступово.'],
    ['You process feelings by talking and thinking them through; variety and conversation soothe you, while stillness can feel restless.', 'Почуття ти опрацьовуєш через розмову й думки; розмаїття й спілкування заспокоюють, а тиша інколи тривожить.'],
    ['Deep sensitivity and a protective instinct: you need emotional safety, a home and people who feel like family; moods move like tides.', 'Глибока чутливість і захисний інстинкт: тобі потрібні емоційна безпека, дім і люди, схожі на родину; настрої приходять і відходять, як припливи.'],
    ['You need warmth, appreciation and room to express yourself; you share feelings generously and are hurt when ignored.', 'Тобі потрібні тепло, визнання й простір для самовираження; ти щедро ділишся почуттями, а коли тебе не помічають — це болить.'],
    ['You steady yourself through useful routines and analysis; you worry quietly and calm down when you can fix or organise something.', 'Ти заспокоюєшся через корисні ритуали й аналіз; тривожишся тихо, а відпускає, коли можна щось виправити чи впорядкувати.'],
    ['Peace requires harmony and good company; conflict knocks you off balance, and you read other people’s moods instantly.', 'Для спокою тобі потрібні гармонія й хороша компанія; конфлікт вибиває з рівноваги, а настрої інших ти зчитуєш миттєво.'],
    ['Your feelings run deep and stay private; you need loyalty and truth, and you rarely show how strongly you feel.', 'Твої почуття глибокі й приховані; тобі потрібні вірність і правда, а наскільки сильно ти відчуваєш, показуєш рідко.'],
    ['You need freedom, optimism and room to explore; you work through pain by looking for meaning and by humour.', 'Щоб почуватися добре, тобі потрібні свобода, оптимізм і простір для пошуків; біль ти проживаєш через пошук сенсу й гумор.'],
    ['You keep emotions under control and show care through reliability; security and respect matter, and warmth comes late but lasts.', 'Ти тримаєш емоції під контролем і виявляєш турботу через надійність; важливі безпека й повага, а тепло приходить пізніше, зате надовго.'],
    ['You need space and mental connection; you handle feelings by understanding them, and value friendship over emotional intensity.', 'Тобі потрібні простір і інтелектуальний зв’язок; почуття ти опрацьовуєш через розуміння, а дружбу цінуєш більше за емоційну напругу.'],
    ['You absorb the moods around you like a sponge; solitude, art or quiet time are how you refill and let feelings go.', 'Ти вбираєш настрої довкола, як губка; самотність, мистецтво чи тиша — це те, чим ти відновлюєшся й відпускаєш почуття.'],
  ],
  Mercury: [
    ['A quick, direct mind: you decide fast, say what you mean and have little patience for long explanations.', 'Швидкий, прямий розум: ти ухвалюєш рішення миттєво, говориш як є й мало терпиш довгі пояснення.'],
    ['A slow, practical, thorough mind: decisions take time, but your conclusions are firm and well grounded.', 'Повільний, практичний, ґрунтовний розум: рішення потребують часу, зате висновки тверді й обґрунтовані.'],
    ['An agile, curious mind: you pick things up fast, juggle several ideas at once and love wit and conversation.', 'Гнучкий, допитливий розум: ти схоплюєш швидко, тримаєш кілька ідей одразу й любиш дотепність та розмови.'],
    ['You think through feeling and memory: you learn best when something touches you, and you remember how things felt.', 'Ти мислиш через почуття й пам’ять: найкраще вчишся, коли тебе щось зачепило, і добре пам’ятаєш, як усе відчувалось.'],
    ['You speak with confidence and flair and think in big creative strokes; you like to inspire others with your ideas.', 'Ти говориш упевнено й яскраво, мислиш широкими творчими мазками й любиш надихати інших своїми ідеями.'],
    ['Precision, analysis and an eye for detail: you spot errors, sort information and explain things clearly.', 'Точність, аналітичність і око на деталі: ти помічаєш помилки, структуруєш інформацію й ясно пояснюєш.'],
    ['You weigh both sides before concluding; your speech is diplomatic and you think best in dialogue, though deciding can take long.', 'Ти зважуєш обидва боки, перш ніж зробити висновок; твоя мова дипломатична, думається найкраще в діалозі, хоч вибір буває довгим.'],
    ['A probing, investigative mind: you read between the lines, dig for hidden motives and keep your thoughts to yourself.', 'Проникливий, дослідницький розум: ти читаєш між рядків, шукаєш приховані мотиви й тримаєш думки при собі.'],
    ['You think in big pictures and philosophy; frank and enthusiastic, you may skip small details for the sake of the overall idea.', 'Ти мислиш масштабно й філософськи; говориш відверто й захоплено, іноді пропускаючи дрібниці заради загальної ідеї.'],
    ['An organised, strategic, realistic mind: you plan ahead, speak economically and trust facts and experience.', 'Організований, стратегічний, реалістичний розум: ти плануєш наперед, говориш стисло й довіряєш фактам та досвіду.'],
    ['An original, unconventional mind: you notice patterns others miss and enjoy abstract ideas and unusual solutions.', 'Оригінальний, нестандартний розум: ти помічаєш закономірності, які інші пропускають, і любиш абстрактні ідеї та незвичні рішення.'],
    ['Intuitive, imagery-based thinking: you absorb things by impression rather than logic, and may find it hard to put them into words.', 'Інтуїтивне, образне мислення: ти схоплюєш враженнями, а не логікою, і буває важко підібрати слова.'],
  ],
  Venus: [
    ['You love boldly and directly; attraction is instant, and you value passion, challenge and honesty over slow courtship.', 'Ти кохаєш сміливо й прямо; потяг виникає миттєво, а ціниш ти пристрасть, виклик і чесність більше за довге залицяння.'],
    ['Loyal, sensual and steady in love: you value touch, comfort, beauty and partners whose reliability is proven over time.', 'У коханні — вірність, чуттєвість і стабільність: ти цінуєш дотик, затишок, красу й партнерів, чия надійність перевірена часом.'],
    ['Love needs conversation and playfulness; you are drawn to minds and wit, and need variety to stay interested.', 'Коханню потрібні розмови й гра; тебе приваблюють розум і дотепність, а щоб інтерес не згас, потрібне розмаїття.'],
    ['You love through care and loyalty; you need emotional security, show affection by nurturing, and attach deeply.', 'Ти кохаєш через турботу й вірність; тобі потрібна емоційна безпека, прихильність ти виявляєш опікою й прив’язуєшся глибоко.'],
    ['Generous, warm and romantic: you love on a grand scale, enjoy being adored, and value loyalty and heartfelt gestures.', 'Щедрість, тепло й романтичність: ти любиш широко, насолоджуєшся захопленням і цінуєш вірність та щирі жести.'],
    ['You show love through attentive acts and practical help; you value sincerity, modesty and quality, and can be self-critical in romance.', 'Любов ти виявляєш уважними вчинками й практичною допомогою; цінуєш щирість, скромність і якість, а в романтиці надто суворо ставишся до себе.'],
    ['Venus is at home here: you seek harmony, beauty and true partnership; charm comes easily, and discord in love is hard to bear.', 'Тут Венера вдома: ти шукаєш гармонію, красу й справжнє партнерство; чарівність дається легко, а розбрат у коханні важко переносити.'],
    ['You love with all-or-nothing intensity: you want deep, loyal, transformative bonds, are slow to trust and hard to forget.', 'Ти кохаєш за принципом «усе або нічого»: прагнеш глибоких, вірних, змінювальних зв’язків; довіряєш повільно, а забути тебе важко.'],
    ['Love needs freedom and adventure; you value honesty, humour and a partner you can grow and explore the world with.', 'У коханні потрібні свобода й пригода; ти цінуєш чесність, гумор і партнера, з яким можна зростати й відкривати світ.'],
    ['Reserved but committed in love: you value loyalty, seriousness and long-term effort, and warm up gradually.', 'У коханні — стриманість і відданість: ти цінуєш вірність, серйозність і довгі зусилля, а теплішаєш поступово.'],
    ['You value friendship and freedom in love; you are drawn to unusual people and need a bond that leaves room to be yourself.', 'У коханні ти цінуєш дружбу й свободу; тебе тягне до незвичайних людей, а стосункам потрібен простір бути собою.'],
    ['Romantic and devoted: you seek a soulful, almost spiritual bond, and may idealise partners or give too much.', 'Романтичність і відданість: ти шукаєш душевний, майже містичний зв’язок, але можеш ідеалізувати партнерів або віддавати забагато.'],
  ],
  Mars: [
    ['Mars is at home: direct, competitive and energetic; you act first and think later, and need a physical outlet.', 'Марс удома: прямота, змагальність і енергія; ти спершу дієш, потім думаєш, і тобі потрібен фізичний вихід для сил.'],
    ['Slow to start but unstoppable once moving; you act with patience and stubborn persistence, and resist being rushed.', 'Розгойдуєшся повільно, але потім уже не зупинити; ти дієш терпляче й уперто, і опираєшся, коли тебе підганяють.'],
    ['Your energy is mental and scattered across many things; you act through words, ideas and quick moves, and need variety.', 'Твоя енергія розумова й розкидана між багатьма справами; ти дієш словом, ідеями та швидкими рухами, і тобі потрібне розмаїття.'],
    ['You act indirectly and protectively; drive follows emotion, and you fight hardest for the people and the home you love.', 'Ти дієш непрямо й захисно; рушійна сила йде за емоціями, а найзавзятіше ти борешся за тих і те, що любиш.'],
    ['You act with confidence and drama, wanting to lead and be admired; pride is both your fuel and your weak spot.', 'Ти дієш упевнено й ефектно, прагнеш вести й викликати захоплення; гордість — і твоє пальне, і вразливе місце.'],
    ['Your energy goes into precise, useful work; you act methodically, refine details and push yourself hard.', 'Енергія йде в точну, корисну роботу; ти дієш методично, доводиш деталі до ладу й багато вимагаєш від себе.'],
    ['You prefer to act through diplomacy and cooperation; open conflict is uncomfortable, so anger can come out indirectly or late.', 'Тобі ближче діяти через дипломатію й співпрацю; відкритий конфлікт некомфортний, тому злість може виходити непрямо або із запізненням.'],
    ['Controlled, strategic intensity: you act with focus and stamina, rarely give up and rarely show your plan.', 'Контрольована, стратегічна інтенсивність: ти дієш зі зосередженістю й витримкою, рідко здаєшся і не показуєш свого плану.'],
    ['You act with enthusiasm and a love of challenge; energy is high, you aim at big goals and hate restrictions.', 'Ти дієш із захватом і любов’ю до викликів; енергії багато, цілі масштабні, а обмеження дратують.'],
    ['Disciplined, ambitious drive: you work patiently toward long goals, and endurance is what pays off.', 'Дисциплінована, амбітна сила: ти терпляче йдеш до довгих цілей, а виграє в тебе витримка.'],
    ['You act on principle and ideas, rebelling against rules that feel pointless; the drive is erratic but inventive and collective.', 'Ти дієш за принципом і ідеєю, бунтуєш проти безглуздих правил; сила нерівна, зате винахідлива й спрямована на спільну справу.'],
    ['Your drive is soft and intuitive; you act when inspired, avoid direct confrontation, and can lose energy to doubt.', 'Твоя рушійна сила м’яка й інтуїтивна; ти дієш, коли надихнуло, уникаєш прямої конфронтації й можеш губити енергію в сумнівах.'],
  ],
  Jupiter: [
    ['Luck follows courage and first moves; you grow by taking initiative and trusting your own enthusiasm.', 'Удача йде за сміливістю й першими кроками; ти зростаєш, коли береш ініціативу й довіряєш власному ентузіазму.'],
    ['You grow through patience, steady resources and enjoying life; prosperity builds slowly but lasts.', 'Ти зростаєш через терпіння, стабільні ресурси й уміння насолоджуватися життям; достаток накопичується повільно, зате надовго.'],
    ['Opportunity comes through learning, contacts and ideas; you grow by staying curious and connecting people.', 'Можливості приходять через навчання, знайомства й ідеї; ти зростаєш, коли зберігаєш цікавість і поєднуєш людей.'],
    ['Growth comes through family, home and nurturing; generosity towards loved ones brings luck back to you.', 'Зростання приходить через родину, дім і опіку; щедрість до близьких повертається до тебе удачею.'],
    ['You expand through creativity, confidence and generosity; luck favours you when you shine openly.', 'Ти розширюєшся через творчість, упевненість і щедрість; удача на твоєму боці, коли ти сяєш відкрито.'],
    ['You grow through skill, service and refining the details; luck arrives as the reward of careful work.', 'Ти зростаєш через майстерність, служіння й вишліфовування деталей; удача приходить як нагорода за ретельну роботу.'],
    ['Opportunity comes through partnerships, fairness and diplomacy; good relationships are your strongest luck.', 'Можливості приходять через партнерство, справедливість і дипломатію; добрі стосунки — твоя найбільша удача.'],
    ['You grow through crisis, depth and shared resources; transformation opens doors that others do not see.', 'Ти зростаєш через кризи, глибину й спільні ресурси; трансформація відчиняє двері, яких інші не бачать.'],
    ['Jupiter is at home: luck flows through travel, study and faith; optimism itself attracts growth.', 'Юпітер удома: удача тече через подорожі, навчання й віру; сам оптимізм притягує зростання.'],
    ['You grow through discipline and structure; luck is earned slowly, and success rewards patience.', 'Ти зростаєш через дисципліну й структуру; удача здобувається повільно, а успіх винагороджує терпіння.'],
    ['Growth comes through community, innovation and independent thinking; unusual paths bring good fortune.', 'Зростання приходить через спільноту, новаторство й незалежне мислення; нестандартні шляхи приносять удачу.'],
    ['You grow through faith, compassion and imagination; intuition guides your luck, and artistic or spiritual work expands you.', 'Ти зростаєш через віру, співчуття й уяву; інтуїція веде твою удачу, а творча чи духовна праця тебе розширює.'],
  ],
  Saturn: [
    ['The lesson is patience and self-control: acting deliberately without losing courage or the confidence to lead.', 'Урок — терпіння й самоконтроль: діяти обдумано, не втрачаючи відваги й упевненості вести за собою.'],
    ['The lesson is security and self-worth: building lasting stability without clinging to possessions.', 'Урок — безпека й самоцінність: будувати міцну стабільність, не чіпляючись за речі.'],
    ['The lesson is focus and disciplined thinking; fear of being misunderstood eases as you master communication.', 'Урок — зосередженість і дисципліноване мислення; страх бути незрозумілим слабшає, коли опановуєш уміння спілкуватися.'],
    ['The lesson is emotional safety and boundaries: early responsibilities teach you to care without carrying everything alone.', 'Урок — емоційна безпека й межі: ранні обов’язки вчать турбуватися, не несучи все на собі самотужки.'],
    ['The lesson is self-expression and confidence: learning to shine without needing constant approval.', 'Урок — самовираження й упевненість: сяяти, не потребуючи постійного схвалення.'],
    ['The lesson is perfectionism and self-criticism: discipline matures into mastery when you allow yourself to be imperfect.', 'Урок — перфекціонізм і самокритика: дисципліна дозріває до майстерності, коли дозволяєш собі недосконалість.'],
    ['The lesson is commitment and fairness in relationships: finding balance between independence and partnership.', 'Урок — зобов’язання й справедливість у стосунках: знайти баланс між незалежністю та партнерством.'],
    ['The lesson is trust and letting go of control: facing the fear of loss gives lasting emotional strength.', 'Урок — довіра й відпускання контролю: зустріч зі страхом втрати дає тривалу емоційну силу.'],
    ['The lesson is faith and realism: grounding big beliefs in practice and commitment.', 'Урок — віра й реалізм: вкорінювати великі переконання в практиці та відповідальності.'],
    ['Saturn is at home: lessons of responsibility, patience and structure; authority matures with time.', 'Сатурн удома: уроки відповідальності, терпіння й структури; авторитет дозріває з часом.'],
    ['The lesson is belonging while staying yourself: turning ideals into steady, disciplined contribution.', 'Урок — належати спільноті, лишаючись собою: перетворювати ідеали на стабільний, дисциплінований внесок.'],
    ['The lesson is boundaries and practical faith: giving shape to dreams without dissolving into other people’s needs.', 'Урок — межі й практична віра: надавати форми мріям, не розчиняючись у потребах інших.'],
  ],
  Uranus: [
    ['Your generation breaks patterns through bold personal freedom and fast, impulsive change.', 'Твоє покоління ламає шаблони через сміливу особисту свободу та швидкі, імпульсивні зміни.'],
    ['Your generation shakes up values, money and the material world through steady, stubborn reinvention.', 'Твоє покоління перетрушує цінності, гроші й матеріальний світ упертим, поступовим перевинаходом.'],
    ['Your generation rewrites communication and thought; restless curiosity drives sudden shifts in how you learn.', 'Твоє покоління переписує спілкування й мислення; неспокійна цікавість викликає раптові зрушення в тому, як ти вчишся.'],
    ['Your generation reinvents family, home and belonging; emotional independence comes through unconventional roots.', 'Твоє покоління перевинаходить родину, дім і належність; емоційна незалежність приходить через нетрадиційне коріння.'],
    ['Your generation breaks patterns through self-expression: creative individuality and a need to be unique.', 'Твоє покоління ламає шаблони через самовираження: творча індивідуальність і потреба в неповторності.'],
    ['Your generation innovates in work, health and daily systems: practical change, new methods and technology.', 'Твоє покоління оновлює роботу, здоров’я й щоденні системи: практичні зміни, нові методи й технології.'],
    ['Your generation reinvents partnership and fairness; relationships are renegotiated and traditional roles loosen.', 'Твоє покоління перевинаходить партнерство й справедливість; стосунки домовляються наново, а традиційні ролі слабшають.'],
    ['Your generation breaks open taboos and power structures; intense, transformative change in intimacy and shared resources.', 'Твоє покоління розкриває табу й структури влади; інтенсивні, трансформаційні зміни в близькості й спільних ресурсах.'],
    ['Your generation questions beliefs and widens horizons: freedom, travel and new philosophies.', 'Твоє покоління ставить під сумнів переконання й розширює горизонти: свобода, подорожі, нові філософії.'],
    ['Your generation reforms institutions and authority; ambition is redirected towards new structures.', 'Твоє покоління реформує інститути й авторитети; амбіції спрямовуються на нові структури.'],
    ['Uranus is at home: your generation is inventive and collectively minded; individuality and humanitarian ideas are strong.', 'Уран удома: твоє покоління винахідливе й мислить колективно; сильні індивідуальність і гуманістичні ідеї.'],
    ['Your generation awakens intuition and imagination: dreams, spirituality and sensitivity break old patterns.', 'Твоє покоління пробуджує інтуїцію й уяву: мрії, духовність і чутливість руйнують старі шаблони.'],
  ],
  Neptune: [
    ['Your generation dreams of pioneering and personal vision; the risk is confusion about direction.', 'Твоє покоління мріє про першопрохідництво й особисте бачення; ризик — розгубленість щодо напрямку.'],
    ['Your generation dreams of beauty, nature and security; values are idealised and money or possessions can be hazy.', 'Твоє покоління мріє про красу, природу й безпеку; цінності ідеалізовані, а гроші й речі можуть бути туманними.'],
    ['Your generation dreams through words and information; imagination is fluid, and facts blur with impressions.', 'Твоє покоління мріє через слова й інформацію; уява плинна, а факти змішуються з враженнями.'],
    ['Your generation dreams of home and belonging; deep empathy and a longing for emotional safety.', 'Твоє покоління мріє про дім і належність; глибока емпатія й туга за емоційною безпекою.'],
    ['Your generation dreams of creativity and glamour; idealised heroes, art and self-expression.', 'Твоє покоління мріє про творчість і блиск; ідеалізовані герої, мистецтво й самовираження.'],
    ['Your generation dreams of service and healing; imagination about order and health, with a tendency to self-doubt.', 'Твоє покоління мріє про служіння й зцілення; уява про порядок і здоров’я, з нахилом до сумнівів у собі.'],
    ['Your generation dreams of perfect harmony and love; idealised relationships and art.', 'Твоє покоління мріє про досконалу гармонію й любов; ідеалізовані стосунки та мистецтво.'],
    ['Your generation dreams of transformation and hidden depths; fascination with mystery and the occult.', 'Твоє покоління мріє про трансформацію й приховані глибини; захоплення таємницею й окультним.'],
    ['Your generation dreams of far horizons, faith and freedom; spiritual hunger and wanderlust.', 'Твоє покоління мріє про далекі обрії, віру й свободу; духовний голод і жага мандрів.'],
    ['Your generation dreams of structure, ambition and legacy; ideals dissolve old authorities.', 'Твоє покоління мріє про структуру, амбіції й спадок; ідеали розмивають старі авторитети.'],
    ['Your generation dreams of a better, more connected world: technology, community and humanitarian vision.', 'Твоє покоління мріє про кращий, більш пов’язаний світ: технології, спільнота й гуманістичне бачення.'],
    ['Neptune is at home: compassion, mysticism and imagination at full power.', 'Нептун удома: співчуття, містика й уява на повну силу.'],
  ],
  Pluto: [
    ['Your generation is reborn through individual courage and will: a raw drive for self-renewal.', 'Твоє покоління відроджується через особисту відвагу й волю: сира жага самооновлення.'],
    ['Your generation transforms money, values and the earth; power comes through stability.', 'Твоє покоління перетворює гроші, цінності й землю; сила приходить через стабільність.'],
    ['Your generation transforms information and communication; the mind becomes a force of change.', 'Твоє покоління перетворює інформацію й спілкування; розум стає силою змін.'],
    ['Your generation transforms family, home and belonging: a deep emotional rebirth.', 'Твоє покоління перетворює родину, дім і належність: глибоке емоційне відродження.'],
    ['Your generation transforms self-expression, creativity and leadership; power through the heart.', 'Твоє покоління перетворює самовираження, творчість і лідерство; сила через серце.'],
    ['Your generation transforms work, health and service.', 'Твоє покоління перетворює працю, здоров’я й служіння.'],
    ['Your generation transforms relationships, justice and balance.', 'Твоє покоління перетворює стосунки, справедливість і баланс.'],
    ['Pluto is at home: intense, regenerative power; deep crises that lead to rebirth.', 'Плутон удома: інтенсивна, відновлювальна сила; глибокі кризи, що ведуть до відродження.'],
    ['Your generation transforms belief, truth and exploration: a hunger for meaning that reshapes worldviews.', 'Твоє покоління перетворює віру, правду й пошуки: голод сенсу, що змінює світогляд.'],
    ['Your generation transforms institutions, authority and structures.', 'Твоє покоління перетворює інститути, авторитети й структури.'],
    ['Your generation transforms society, technology and collective ideals.', 'Твоє покоління перетворює суспільство, технології й колективні ідеали.'],
    ['Your generation transforms spirituality and boundaries: dissolving and renewing the collective soul.', 'Твоє покоління перетворює духовність і межі: розчиняє й оновлює колективну душу.'],
  ],
}

/** Асцендент: як тебе бачать за першого знайомства. */
const ASCENDANT: T2[] = [
  ['People first meet someone direct, energetic and quick to act; you come across as confident and a little impatient.', 'Люди спершу бачать прямоту, енергію й швидкість дії; ти справляєш враження впевненої та трохи нетерплячої людини.'],
  ['People first meet calm, grounded warmth; you come across as steady, sensual and reliable, even a little stubborn.', 'Люди спершу бачать спокійне, приземлене тепло; ти справляєш враження стабільної, чуттєвої й надійної людини, інколи впертої.'],
  ['People first meet a curious, talkative, quick-witted presence; you come across as youthful, versatile and friendly.', 'Люди спершу бачать допитливу, говірку, дотепну присутність; ти справляєш враження жвавої, різнобічної й товариської людини.'],
  ['People first meet softness and care; you come across as sensitive and protective, with a reserve that opens slowly.', 'Люди спершу бачать м’якість і турботу; ти справляєш враження чутливої, захисної людини зі стриманістю, що відкривається поволі.'],
  ['People first meet warmth and presence; you come across as confident, generous and impossible to overlook.', 'Люди спершу бачать тепло й присутність; ти справляєш враження впевненої, щедрої людини, яку важко не помітити.'],
  ['People first meet attentiveness and practicality: you come across as modest, observant and ready to help, with a sharp eye for detail.', 'Люди спершу бачать уважність і практичність: ти справляєш враження скромної, спостережливої людини, готової допомогти, з гострим оком на деталі.'],
  ['People first meet charm and tact; you come across as polite, graceful and easy to be around.', 'Люди спершу бачать чарівність і такт; ти справляєш враження ввічливої, граційної людини, з якою легко.'],
  ['People first meet intensity and mystery; you come across as magnetic and guarded, with a gaze that sees through things.', 'Люди спершу бачать інтенсивність і таємничість; ти справляєш враження магнетичної, закритої людини з поглядом наскрізь.'],
  ['People first meet openness and enthusiasm; you come across as optimistic, frank and adventurous.', 'Люди спершу бачать відкритість і ентузіазм; ти справляєш враження оптимістичної, відвертої людини, схильної до пригод.'],
  ['People first meet seriousness and composure; you come across as capable, reserved and older than your years.', 'Люди спершу бачать серйозність і зібраність; ти справляєш враження спроможної, стриманої людини, дорослішої за свої роки.'],
  ['People first meet an original, slightly detached presence; you come across as independent, friendly and unconventional.', 'Люди спершу бачать оригінальну, трохи відсторонену присутність; ти справляєш враження незалежної, дружньої та нестандартної людини.'],
  ['People first meet a dreamy, gentle presence; you come across as empathic and elusive, with a soft, adaptable manner.', 'Люди спершу бачать мрійливу, лагідну присутність; ти справляєш враження емпатичної, невловимої людини з м’якою, гнучкою манерою.'],
]

/** Середина неба (MC): публічна роль і покликання. */
const MIDHEAVEN: T2[] = [
  ['you are called to lead, pioneer and start things, and you are noticed for courage and initiative.', 'тебе покликано очолювати, торувати шлях і починати, а помічають тебе за сміливість та ініціативу.'],
  ['you build a reputation slowly through reliability, craft and tangible results; fields tied to beauty, resources or the earth suit you.', 'ти будуєш репутацію повільно — через надійність, майстерність і відчутні результати; тобі пасують сфери, пов’язані з красою, ресурсами чи землею.'],
  ['you are known for words, ideas and connection; careers in communication, teaching, media or trade suit you, and variety matters.', 'тебе знають за слово, ідеї та зв’язки; тобі пасують комунікація, навчання, медіа чи торгівля, і важливе розмаїття.'],
  ['you stand out through care, intuition and creating belonging; work that nurtures, heals or builds a “home” for others suits you.', 'ти вирізняєшся турботою, інтуїцією та вмінням створювати відчуття належності; тобі пасує робота, що опікується, зцілює чи будує «дім» для інших.'],
  ['you are meant to be visible: leadership, creative work and performance suit you, and recognition matters to your sense of success.', 'тобі судилося бути на видноті: пасують лідерство, творчість і виступи, а визнання важливе для відчуття успіху.'],
  ['you are respected for competence and precision; careers in analysis, health, craft or service suit you, and quiet excellence is your brand.', 'тебе поважають за компетентність і точність; тобі пасують аналіз, здоров’я, ремесло чи служіння, а тиха досконалість — твоя візитівка.'],
  ['you are known for diplomacy, taste and fairness; careers in law, design, partnership or mediation suit you, and your reputation rests on relationships.', 'тебе знають за дипломатію, смак і справедливість; тобі пасують право, дизайн, партнерські чи посередницькі ролі, а репутація тримається на стосунках.'],
  ['you are seen as powerful and probing; research, psychology, finance or crisis work suit you, and you rise through depth and resilience.', 'тебе сприймають як людину сили й проникливості; тобі пасують дослідження, психологія, фінанси чи робота з кризами, а зростаєш ти через глибину та стійкість.'],
  ['you are drawn to a public role with meaning: teaching, publishing, travel or advocacy suit you, and your reputation rests on vision and honesty.', 'тебе тягне до публічної ролі зі змістом: пасують викладання, видавнича справа, подорожі чи просування ідей, а репутація стоїть на баченні й чесності.'],
  ['you climb steadily toward authority and are respected for discipline and results; leadership and institutions suit you, with success coming later and lasting.', 'ти поступово йдеш до авторитету й здобуваєш повагу за дисципліну та результати; пасують лідерство й інституції, а успіх приходить пізніше й надовго.'],
  ['you are known for originality and for serving the wider community; technology, science and social causes suit you, and you succeed by being unconventional.', 'тебе знають за оригінальність і служіння широкій спільноті; пасують технології, наука й соціальні справи, а успіху ти досягаєш через нестандартність.'],
  ['you work best where imagination and compassion count: art, healing, spirituality or caring professions suit you, and your reputation is subtle but touching.', 'ти найкраще працюєш там, де цінують уяву й співчуття: мистецтво, зцілення, духовність чи професії догляду; репутація в тебе тонка, але зворушлива.'],
]

/** Сучасні управителі знаків (для управителя карти). */
export const RULER = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Pluto', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']

/** Для аспектів: «дар» планети в злагоді та її «потреба» у напрузі (у тексті — «потреба …»). */
const STRENGTH: Record<string, { gift: T2; need: T2 }> = {
  Sun: { gift: ['vitality and self-confidence', 'життєва сила й упевненість у собі'], need: ['to be yourself and lead', 'бути собою та вести'] },
  Moon: { gift: ['emotional intuition and care', 'емоційна інтуїція й турбота'], need: ['emotional safety', 'емоційна безпека'] },
  Mercury: { gift: ['clear thinking and speech', 'ясне мислення й мова'], need: ['to understand and be understood', 'розуміти й бути зрозумілим'] },
  Venus: { gift: ['charm and affection', 'чарівність і ніжність'], need: ['love and harmony', 'любов і гармонія'] },
  Mars: { gift: ['drive and courage', 'енергія й відвага'], need: ['action and independence', 'дія й самостійність'] },
  Jupiter: { gift: ['optimism and generosity', 'оптимізм і щедрість'], need: ['growth and meaning', 'зростання й сенс'] },
  Saturn: { gift: ['discipline and endurance', 'дисципліна й витримка'], need: ['structure and security', 'структура й безпека'] },
  Uranus: { gift: ['originality', 'оригінальність'], need: ['freedom to change', 'свобода змін'] },
  Neptune: { gift: ['imagination and compassion', 'уява й співчуття'], need: ['ideals and transcendence', 'ідеали й вихід за межі'] },
  Pluto: { gift: ['depth and resilience', 'глибина й стійкість'], need: ['power and transformation', 'сила й трансформація'] },
}

interface AspectWords {
  names: [string, string]
  gifts: [string, string]
  needs: [string, string]
}
const ASPECT_TEXT: Record<string, Record<Locale, (w: AspectWords) => string>> = {
  conjunction: {
    en: (w) => `${w.names[0]} and ${w.names[1]} fuse into one force: ${w.gifts[0]} and ${w.gifts[1]} arrive as a single package, for better and for worse. Notice which of the two leads.`,
    uk: (w) => `${w.names[0]} і ${w.names[1]} зливаються в одну силу: ${w.gifts[0]} та ${w.gifts[1]} приходять єдиним пакетом, на добре й на гірше. Помічай, котре з двох веде.`,
  },
  sextile: {
    en: (w) => `${w.names[0]} supports ${w.names[1]}: the theme of ${w.gifts[0]} can lift ${w.gifts[1]}. The opportunity is there, and it works best when you use it deliberately.`,
    uk: (w) => `${w.names[0]} підтримує ${w.names[1]}: тема «${w.gifts[0]}» може підсилити тему «${w.gifts[1]}». Можливість уже є, і найкраще вона працює, коли користуєшся нею свідомо.`,
  },
  trine: {
    en: (w) => `${w.names[0]} and ${w.names[1]} cooperate effortlessly: ${w.gifts[0]} flows into ${w.gifts[1]}. It is a natural talent that is easy to take for granted.`,
    uk: (w) => `${w.names[0]} і ${w.names[1]} співпрацюють без зусиль: тема «${w.gifts[0]}» плавно переходить у тему «${w.gifts[1]}». Це природний талант, який легко сприймати як належне.`,
  },
  square: {
    en: (w) => `${w.names[0]} and ${w.names[1]} pull in different directions: the theme of ${w.needs[0]} runs against the theme of ${w.needs[1]}. The friction is uncomfortable, and it is also what pushes you to act and mature.`,
    uk: (w) => `${w.names[0]} і ${w.names[1]} тягнуть у різні боки: тема «${w.needs[0]}» суперечить темі «${w.needs[1]}». Це тертя некомфортне, але саме воно підштовхує діяти й дорослішати.`,
  },
  opposition: {
    en: (w) => `${w.names[0]} and ${w.names[1]} sit across from each other: the theme of ${w.needs[0]} faces the theme of ${w.needs[1]}. You tend to swing between the two or meet one of them in other people; growth lies in balancing both.`,
    uk: (w) => `${w.names[0]} і ${w.names[1]} стоять навпроти одне одного: тема «${w.needs[0]}» дивиться на тему «${w.needs[1]}». Тебе може гойдати між ними, а одна з тем частіше проявляється в інших людях; зростання — у балансі обох.`,
  },
}

const EXACT_TEXT: T2 = ['This aspect is very tight, so it is one of the strongest themes in your chart.', 'Цей аспект дуже точний, тож це одна з найсильніших тем твоєї карти.']


/** Тлумачення планети у знаку (без будинку й ретроградності). */
export const placementText = (planet: string, sign: string, locale: Locale): string => at(PLACEMENT[planet][SIGN_ORDER.indexOf(sign)], locale)

/** Тлумачення Середини неба (MC) у знаку. */
export const midheavenText = (sign: string, locale: Locale): string => at(MIDHEAVEN[SIGN_ORDER.indexOf(sign)], locale)

/** Тлумачення асцендента у знаку. */
export const ascendantText = (sign: string, locale: Locale): string => at(ASCENDANT[SIGN_ORDER.indexOf(sign)], locale)


/** Загальне пояснення типу аспекту: у звіті його дають лише при першій появі типу, щоб не повторювати. */
const TYPE_TAIL: Record<string, T2> = {
  conjunction: ['These two planets act as one force, so notice which of them leads.', 'Ці дві планети діють як одна сила, тож помічай, котра з них веде.'],
  sextile: ['This is an opportunity: it works best when you use it deliberately.', 'Це можливість: найкраще вона працює, коли користуєшся нею свідомо.'],
  trine: ['This comes naturally, so it is easy to take for granted.', 'Це дається природно, тож легко сприймати як належне.'],
  square: ['This friction is uncomfortable, and it is what pushes you to grow.', 'Це тертя некомфортне, але саме воно підштовхує до зростання.'],
  opposition: ['You may swing between the two sides or meet one of them in other people; growth lies in balance.', 'Тебе може гойдати між двома сторонами, або одна з них проявляється в інших людях; зростання — у балансі.'],
}
/** Сполучення із цими планетами читається за «напруженим» варіантом: вони ущільнюють і обтяжують. */
const HEAVY = new Set(['Saturn', 'Pluto'])

/**
 * Тлумачення аспекту між двома планетами. Для описаних пар (pairs.ts) — власний текст пари (злагоджений або
 * напружений за типом аспекту), для решти — склейка з «дарів» і «потреб» планет. `typeNote` додає загальне пояснення
 * типу аспекту; дуже точні аспекти (орбіс < 1,5°) отримують позначку.
 */
export function aspectText(a: string, b: string, type: string, orb: number, names: { a: string; b: string }, locale: Locale, typeNote = true): string {
  const def = ASPECT_TEXT[type]
  if (!def) return ''
  const pair = PAIRS[`${a}-${b}`] ?? PAIRS[`${b}-${a}`]
  const hard = type === 'square' || type === 'opposition' || (type === 'conjunction' && (HEAVY.has(a) || HEAVY.has(b)))
  const body = pair
    ? at(hard && pair.hard ? pair.hard : pair.ease, locale)
    : def[locale]({
        names: [names.a, names.b],
        gifts: [at(STRENGTH[a].gift, locale), at(STRENGTH[b].gift, locale)],
        needs: [at(STRENGTH[a].need, locale), at(STRENGTH[b].need, locale)],
      })
  const tail = pair && typeNote ? at(TYPE_TAIL[type], locale) : ''
  const exact = orb < 1.5 ? at(EXACT_TEXT, locale) : ''
  return [body, tail, exact].filter(Boolean).join(' ')
}
