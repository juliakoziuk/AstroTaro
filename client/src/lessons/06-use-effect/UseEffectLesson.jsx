import { Section, P, Bullets, Rules, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import LifecycleLog from './LifecycleLog.jsx'
import lifecycleSource from './LifecycleLog.jsx?raw'
import ClockAndSearch from './ClockAndSearch.jsx'
import clockSource from './ClockAndSearch.jsx?raw'
import UserLoader from './UserLoader.jsx'
import userLoaderSource from './UserLoader.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'NoCleanupInterval',
      title: 'таймер без cleanup',
      tryIt: 'Натисни «Сховати» і подивись, чи зупиниться лічильник тіків.',
      answer:
        'Компонент зник, а `setInterval` продовжує працювати й оновлювати state батька — це витік. Збережи id таймера й очисти його в cleanup. (Лічильник росте швидше, ніж раз на секунду, бо в режимі розробки StrictMode запускає ефект двічі й обидва таймери «живуть».)',
      fixedCode: `
useEffect(() => {
  const id = setInterval(onTick, 1000)
  return () => clearInterval(id) // прибрали за собою
}, [onTick])`,
    },
    {
      file: 'StaleDeps',
      title: '`[]` там, де потрібні залежності',
      tryIt: 'Натисни «+1» кілька разів.',
      answer:
        'Ефект із `[]` виконався один раз з першим «знімком» `count = 0`, тому `doubled` застряг на 0. Усе, що ефект читає (`count`), має бути в масиві залежностей — саме про це попереджає ESLint. А ще краще: `doubled` — похідне значення, його не треба зберігати: `const doubled = count * 2`.',
      fixedCode: `
const [count, setCount] = useState(0)
const doubled = count * 2 // без ефекту і без другого state`,
    },
    {
      file: 'InfiniteLoop',
      title: 'ефект без залежностей змінює state',
      compileError:
        'Це небезпечно запускати наживо. **Що буде:** після рендера ефект викликає `setCount` → новий рендер → ефект знову викликає `setCount` → … нескінченний цикл (React напише в консолі «Maximum update depth exceeded»), вкладка навантажується на 100%.',
      answer:
        'Ефект без масиву залежностей виконується після КОЖНОГО рендера, а `setCount` викликає новий рендер. Або додай залежності, або умову, яка зупиняє цикл, або — найкраще — прибери ефект: оновлюй state в обробнику події, а похідні значення обчислюй під час рендера.',
      fixedCode: `
useEffect(() => {
  setCount(1) // потрібно лише один раз
}, [])
// або взагалі: const [count, setCount] = useState(1)`,
    },
    {
      file: 'AsyncEffect',
      title: 'async-функція як ефект',
      tryIt: 'Подивись на результат і відкрий консоль (F12).',
      answer:
        '`async`-функція завжди повертає Promise, а React очікує від ефекту або `undefined`, або функцію cleanup. Він намагається викликати цей Promise як cleanup і падає з «destroy is not a function» (а в консолі ще й пояснення «useEffect must not return anything besides a function»). Оголоси `async`-функцію всередині ефекту й виклич її (або використай `.then()`).',
      fixedCode: `
useEffect(() => {
  async function load() {
    const user = await getUser(2)
    setName(user.name)
  }
  load()
}, [])`,
    },
    {
      file: 'ObjectDep',
      title: 'об’єкт у залежностях',
      tryIt: 'Друкуй у полі й дивись на лічильник запусків ефекту.',
      answer:
        'Об’єкт `options` створюється заново при кожному рендері, а залежності порівнюються за посиланням. Для React це «нова залежність» → ефект запускається після кожного рендера (з кожним символом). Винеси сталий об’єкт за межі компонента або залежи від примітивів.',
      fixedCode: `
const OPTIONS = { uppercase: true } // поза компонентом — одне посилання

useEffect(() => { runs += 1 }, [])`,
    },
    {
      file: 'RaceCondition',
      title: 'гонка запитів',
      tryIt: 'Натисни «Користувач 1 (повільний)» і одразу «Користувач 2 (швидкий)». Почекай 2 секунди.',
      answer:
        'Запит №1 повільніший: прийшов ПІСЛЯ запиту №2 і затер свіжу відповідь, хоча вибрано id 2. Cleanup ефекту виконується при зміні `id` — саме там ставимо прапорець `ignore = true`, і запізнілу відповідь ігноруємо.',
      fixedCode: `
useEffect(() => {
  let ignore = false
  getUser(id).then((u) => {
    if (!ignore) setUser(u)
  })
  return () => { ignore = true }
}, [id])`,
    },
    {
      file: 'FetchInRender',
      title: 'запит прямо в тілі компонента',
      compileError:
        'Не запускаємо наживо. **Що буде:** запит → `setUsers` → новий рендер → знову запит → … нескінченні запити до сервера. Побічні дії не можна виконувати в render.',
      answer:
        'Тіло компонента виконується при кожному рендері, а запит змінює state, що спричиняє новий рендер: нескінченний цикл запитів. Усе, що звертається назовні (fetch, таймери, підписки), — в `useEffect` із масивом залежностей (або в обробниках подій).',
      fixedCode: `
useEffect(() => {
  fetch('/api/users')
    .then((res) => res.json())
    .then(setUsers)
}, [])`,
    },
  ],
  comps,
  raws,
  causes.effect,
)

export default function UseEffectLesson() {
  return (
    <>
      <h1>6. useEffect</h1>

      <Section title="Що це таке">
        <P>
          {'Рендер компонента має бути **чистим**: лише обчислити розмітку з props і state. Але справжньому застосунку потрібно щось робити й «назовні»: запускати таймери, слухати події вікна, завантажувати дані, міняти заголовок вкладки. Це називається **побічні ефекти (side effects)**. Їх виконують у `useEffect` — вже **після** того, як React оновив екран.'}
        </P>
        <CodeBlock
          code={`
useEffect(() => {
  // 1. код ефекту: виконується після рендера
  return () => {
    // 2. cleanup: прибрати за собою (необов’язково)
  }
}, [dep1, dep2]) // 3. залежності: коли запускати знову`}
        />
        <Rules
          head={['Форма', 'Коли виконується']}
          rows={[
            ['`useEffect(fn)`', 'після кожного рендера (майже ніколи не потрібно)'],
            ['`useEffect(fn, [])`', 'один раз, після першої появи компонента'],
            ['`useEffect(fn, [a, b])`', 'після появи і щоразу, коли змінилось `a` або `b`'],
            ['`return () => …` (cleanup)', 'перед наступним запуском ефекту та при зникненні компонента'],
            ['Залежності — все, що ефект читає з компонента', 'props, state, функції; ESLint підкаже'],
            ['Залежності порівнюються за посиланням', 'новий об’єкт/масив/функція на кожен рендер = запуск ефекту'],
            ['Не `async` напряму', '`async function load()` всередині ефекту'],
            ['StrictMode у dev: ефект → cleanup → ефект', 'так React перевіряє cleanup'],
          ]}
        />
        <P>
          {'**Коли `useEffect` НЕ потрібен:** обчислити значення з props/state (роби це в рендері), відреагувати на клік (обробник події), скинути state при зміні props (`key`). Якщо ефект лише копіює одне значення в інше — це майже завжди помилка.'}
        </P>
        <P>
          {'У React Native `useEffect` працює так само: таймери, підписки, запити, робота зі сховищем. Тільки замість `window`/`document` будуть API телефону.'}
        </P>
      </Section>

      <Section title="Життєвий цикл на практиці">
        <P>
          {'Показуй/прибирай віджет і змінюй `value`. У журналі видно, коли виконується код ефекту, а коли — cleanup. Зверни увагу на подвійний запуск при першому показі (StrictMode).'}
        </P>
        <Demo>
          <LifecycleLog />
        </Demo>
        <CodeBlock code={lifecycleSource} />
      </Section>

      <Section title="Приклад: годинник, ширина вікна, debounce-пошук">
        <P>{'Три типові ефекти з cleanup: `setInterval`, `addEventListener` та `setTimeout`.'}</P>
        <Demo>
          <ClockAndSearch />
        </Demo>
        <CodeBlock code={clockSource} />
      </Section>

      <Section title="Приклад з реального життя: завантаження користувача">
        <P>
          {'Натисни «Користувач 1» і одразу «Користувач 2»: завдяки прапорцю `ignore` відповідь повільного запиту №1 не затре свіжий результат. Є стани `loading`, `success`, `error`. Докладніше про дані — в уроці 11.'}
        </P>
        <Demo>
          <UserLoader />
        </Demo>
        <CodeBlock code={userLoaderSource} />
      </Section>

      <Section title="Знайди помилку">
        <P>{'Сім помилок з ефектами. Два приклади небезпечні (цикли), тому показані лише кодом.'}</P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <Bullets
          items={[
            'Відкрий `src/lessons/06-use-effect/Task.jsx`: годинник, ширина вікна, зворотний відлік, завантаження користувача, нотатка в `localStorage`.',
            'У кожному: чи є cleanup? що в залежностях?',
            'Запусти `npm run lint` — правило `exhaustive-deps` допоможе.',
          ]}
        />
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Закріплення: тест">
        <P>{'13 питань про `useEffect`.'}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
