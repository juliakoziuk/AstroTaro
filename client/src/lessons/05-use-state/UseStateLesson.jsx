import { Section, P, Bullets, Rules, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import CartDemo from './CartDemo.jsx'
import cartSource from './CartDemo.jsx?raw'
import StateBasics from './StateBasics.jsx'
import basicsSource from './StateBasics.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'MutateObject',
      title: 'змінюємо об’єкт у state напряму',
      tryIt: 'Натисни «З днем народження» кілька разів.',
      answer:
        '`user.age++` змінює існуючий об’єкт, а `setUser(user)` передає те саме посилання. React порівнює за посиланням, бачить, що нічого не змінилось, і не перемальовує компонент. Створюй копію: `setUser({ ...user, age: user.age + 1 })`.',
      fixedCode: `
function birthday() {
  setUser({ ...user, age: user.age + 1 })
}`,
    },
    {
      file: 'DoubleSet',
      title: '+3 додає лише 1',
      tryIt: 'Натисни «+3».',
      answer:
        'Під час одного рендера `count` — «знімок» (наприклад, 0). Три виклики `setCount(count + 1)` тричі ставлять 1. Якщо нове значення залежить від попереднього, пиши функціонально: `setCount((c) => c + 1)`.',
      fixedCode: `
function addThree() {
  setCount((c) => c + 1)
  setCount((c) => c + 1)
  setCount((c) => c + 1)
}`,
    },
    {
      file: 'ReadAfterSet',
      title: 'повідомлення «відстає» на один крок',
      tryIt: 'Клікни «+1» двічі та порівняй обидва рядки.',
      answer:
        '`setCount` не змінює змінну `count` в поточному обробнику: він лише планує новий рендер. Рядок `\'Тепер лічильник = \' + count` використовує старе значення. Обчисли нове значення в змінну й використай її в обох місцях, а ще краще — не зберігай повідомлення в state, а виведи його з `count`.',
      fixedCode: `
function increment() {
  setCount(count + 1)
}
// повідомлення — похідне від count:
<p>Тепер лічильник = {count}</p>`,
    },
    {
      file: 'ConditionalHook',
      title: 'хук усередині if',
      tryIt: 'Натисни «Показати нотатку».',
      answer:
        'React ідентифікує хуки за порядком виклику. При першому рендері був один хук, при другому (open = true) — два, і React ламається: «Rendered more hooks than during the previous render». Викликай хуки завжди на верхньому рівні й в одному порядку, а умову застосовуй до значення.',
      fixedCode: `
const [open, setOpen] = useState(false)
const [text] = useState('Моя нотатка') // завжди, без умов
const note = open ? text : ''`,
    },
    {
      file: 'ComponentInComponent',
      title: 'компонент, оголошений усередині компонента',
      tryIt: 'Клікни на «Внутрішній» кілька разів, а потім на «Батько».',
      answer:
        'Щоразу, коли батько рендериться, функція `Counter` створюється ЗАНОВО — для React це інший тип компонента, тож старий знищується разом зі state, а новий монтується з нуля. Оголошуй компоненти на верхньому рівні файлу, а не всередині інших.',
      fixedCode: `
function Counter() {
  const [n, setN] = useState(0)
  return <button onClick={() => setN(n + 1)}>Внутрішній: {n}</button>
}

export default function Parent() { /* ... <Counter /> ... */ }`,
    },
    {
      file: 'DerivedState',
      title: 'повне ім’я не оновлюється',
      tryIt: 'Зміни ім’я чи прізвище в полях.',
      answer:
        '`useState(first + \' \' + last)` обчислює початкове значення один раз, а далі `fullName` живе власним життям і ніхто його не оновлює. Те, що обчислюється з іншого state, не зберігають у state — рахують під час рендера: `const fullName = first + \' \' + last`.',
      fixedCode: `
const [first, setFirst] = useState('Олена')
const [last, setLast] = useState('Коваль')
const fullName = first + ' ' + last // звичайна змінна`,
    },
    {
      file: 'PropInitialState',
      title: 'дитина не бачить нового значення',
      tryIt: 'Натисни кнопку «Батько» кілька разів.',
      answer:
        '`useState(start)` бере проп лише при першому рендері, пізніші зміни ігноруються. Якщо дитині потрібне актуальне значення — читай проп напряму. Якщо їй потрібен власний state, який скидається разом з пропом, дай `key={n}`.',
      fixedCode: `
function Child({ start }) {
  return <p>Дитина показує: {start}</p>
}`,
    },
    {
      file: 'StaleTimeout',
      title: 'таймер «бачить» старе значення',
      tryIt: 'Натисни «Запам’ятати», а за 2 секунди кілька разів «+1».',
      answer:
        'Функція в `setTimeout` запам’ятала значення `count` з моменту кліку (замикання). Це не баг, а закон: кожен рендер має власний «знімок». Щоб прочитати найсвіжіше значення пізніше, використовують `useRef` (урок 7) або функціональне оновлення state.',
      fixedCode: `
const countRef = useRef(count)
useEffect(() => { countRef.current = count })

function remember() {
  setTimeout(() => setSaved('Лічильник був ' + countRef.current), 2000)
}`,
    },
  ],
  comps,
  raws,
  causes.state,
)

export default function UseStateLesson() {
  return (
    <>
      <h1>5. useState</h1>

      <Section title="Що це таке">
        <P>
          {'**State** — це пам’ять компонента. Звичайна змінна всередині функції «забувається» при кожному рендері, а state React зберігає між рендерами. Коли ти викликаєш функцію-оновлювач (`setX`), React запускає новий рендер компонента з новим значенням — так оновлюється інтерфейс.'}
        </P>
        <CodeBlock
          code={`
const [count, setCount] = useState(0)
//     ^ значення  ^ оновлювач     ^ початкове значення (лише для першого рендера)`}
        />
        <P>
          {'Найважливіше — **модель «знімка»**: у кожному рендері `count` — це константа з поточним значенням. `setCount` не змінює її на місці, він просить React перемалювати компонент уже з новим числом.'}
        </P>
        <Rules
          rows={[
            ['State — для даних, що змінюються й впливають на розмітку', 'лічильник, текст поля, відкрите вікно, список'],
            ['Оновлення тільки через `setX`', '`setCount(5)`'],
            ['Нове значення від старого — функціонально', '`setCount((c) => c + 1)`'],
            ['Об’єкти й масиви — не мутувати, а копіювати', '`{ ...user, age: 21 }`, `[...items, x]`'],
            ['Хуки — лише на верхньому рівні, в одному порядку', 'без `if`, циклів і вкладених функцій'],
            ['Те, що обчислюється з state, — не state', '`const total = price * qty`'],
            ['Початкове значення береться лише один раз', '`useState(props.x)` не слідкує за `props.x`'],
            ['Важке початкове значення — через функцію', '`useState(() => read())`'],
            ['Кожен екземпляр компонента має свій state', 'два `<Counter />` незалежні'],
            ['Скинути state — змінити `key`', '`<Form key={userId} />`'],
            ['Спільні дані — піднімаємо state до спільного батька', 'батько тримає state, діти отримують props'],
          ]}
        />
        <P>
          {'У React Native `useState` працює **зовсім так само** — це той самий React.'}
        </P>
      </Section>

      <Section title="Приклад з реального життя: кошик">
        <P>
          {'Класика інтернет-магазину. У state лише список товарів із кількістю; **кількість товарів і сума не зберігаються, а обчислюються**. При кількості 0 товар зникає з кошика (`map` + `filter`).'}
        </P>
        <Demo>
          <CartDemo />
        </Demo>
        <CodeBlock code={cartSource} />
      </Section>

      <Section title="«Знімок» значення та функціональне оновлення">
        <P>
          {'Натисни обидві кнопки: перша тричі робить `setA(a + 1)`, друга — `setB(prev => prev + 1)`. Зверни увагу на різницю результатів. Нижче — оновлення об’єкта через spread.'}
        </P>
        <Demo>
          <StateBasics />
        </Demo>
        <CodeBlock code={basicsSource} />
      </Section>

      <Section title="Знайди помилку">
        <P>{'Вісім помилок зі state. Майже всі видно лише після кліку — читай підказки 👉.'}</P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <Bullets
          items={[
            'Відкрий `src/lessons/05-use-state/Task.jsx`: п’ять міні-компонентів + бонус.',
            'Лайк, зірки, FAQ-акордеон, лічильник з межами, нотатка з лімітом символів.',
            'Для кожного визнач: що тут state, а що можна обчислити.',
          ]}
        />
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Закріплення: тест">
        <P>{'12 питань про `useState`.'}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
