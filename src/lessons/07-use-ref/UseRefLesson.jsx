import { Section, P, Bullets, Rules, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import ChatBox from './ChatBox.jsx'
import chatSource from './ChatBox.jsx?raw'
import Stopwatch from './Stopwatch.jsx'
import stopwatchSource from './Stopwatch.jsx?raw'
import RefVsState from './RefVsState.jsx'
import refVsStateSource from './RefVsState.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'RefForDisplay',
      title: 'ref замість state для даних на екрані',
      tryIt: 'Натисни «+1» кілька разів.',
      answer:
        'Зміна `count.current` не повідомляє React, що треба перемальовувати компонент, тому число на екрані не змінюється (воно оновиться, лише коли щось інше викличе рендер). Те, що користувач бачить, має жити в state.',
      fixedCode: `
const [count, setCount] = useState(0)
<button onClick={() => setCount(count + 1)}>+1</button>
<p>Кліків: {count}</p>`,
    },
    {
      file: 'RefBeforeMount',
      title: 'звертаємось до ref під час рендера',
      answer:
        'Під час першого рендера DOM-елемента ще не існує, тому `inputRef.current` — `null`, і `null.focus()` кидає помилку. DOM-ref читають в `useEffect` (після рендера) або в обробниках подій.',
      fixedCode: `
useEffect(() => {
  inputRef.current.focus()
}, [])`,
    },
    {
      file: 'LetInsteadOfRef',
      title: 'id таймера в звичайній змінній',
      tryIt: 'Натисни «Старт», а потім «Стоп».',
      answer:
        'Після `setSeconds` компонент перемальовується: функція виконується заново, і створюється нова змінна `intervalId = null`. «Стоп» з нового рендера викликає `clearInterval(null)` і нічого не зупиняє. Значення, що має пережити рендери, але не відображається, зберігають у `useRef`.',
      fixedCode: `
const intervalRef = useRef(null)

function start() {
  intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
}
function stop() {
  clearInterval(intervalRef.current)
}`,
    },
    {
      file: 'ForgotCurrent',
      title: 'забули .current',
      tryIt: 'Натисни «Фокус» і відкрий консоль (F12).',
      answer:
        '`useRef` повертає об’єкт `{ current }`, а сам DOM-елемент лежить у `inputRef.current`. Виклик `inputRef.focus()` — це виклик методу в об’єкта-обгортки, якого там немає: «inputRef.focus is not a function». Помилку в обробнику події видно лише в консолі.',
      fixedCode: `<button onClick={() => inputRef.current.focus()}>Фокус</button>`,
    },
    {
      file: 'SameRefManyInputs',
      title: 'один ref на три поля',
      tryIt: 'Натисни «Фокус на перше поле».',
      answer:
        'Один ref вміщує лише одне значення, тому `fieldRef.current` вказує на останнє поле, якому його присвоїли. Для кількох елементів створюй кілька ref (`firstRef`, `secondRef`) або зберігай їх у масиві/`Map` через callback-ref.',
      fixedCode: `
const firstRef = useRef(null)
const secondRef = useRef(null)
// ...
<input ref={firstRef} />
<input ref={secondRef} />
<button onClick={() => firstRef.current.focus()}>Фокус на перше</button>`,
    },
    {
      file: 'GetElementById',
      title: 'document.getElementById у повторно використаному компоненті',
      tryIt: 'Натисни «Фокус у моє поле» у формі Б.',
      answer:
        'Компонент використано двічі, а `id="name-field"` зустрічається на сторінці двічі. `getElementById` повертає перший знайдений елемент — із форми А. Використовуй `useRef`: кожен екземпляр компонента отримує свій. (В React Native `document` узагалі немає, там лише ref.)',
      fixedCode: `
function NameField({ title }) {
  const inputRef = useRef(null)
  return (
    <div>
      <input ref={inputRef} type="text" />
      <button onClick={() => inputRef.current.focus()}>Фокус</button>
    </div>
  )
}`,
    },
  ],
  comps,
  raws,
  causes.ref,
)

export default function UseRefLesson() {
  return (
    <>
      <h1>7. useRef</h1>

      <Section title="Що це таке">
        <P>
          {'`useRef` повертає об’єкт `{ current: … }`, який React зберігає між рендерами. Зміна `ref.current` **не викликає перерендер**. Це «коробочка» для значень, які компоненту треба пам’ятати, але які не повинні перемальовувати екран.'}
        </P>
        <P>{'Дві основні задачі:'}</P>
        <Bullets
          items={[
            '**Доступ до DOM-елемента** (в React Native — до нативного компонента): `<input ref={inputRef} />` → `inputRef.current.focus()`, прокрутка, вимірювання, відео/аудіо.',
            '**Зберігати «технічні» значення між рендерами**: id таймера, попереднє значення, прапорець, екземпляр сторонньої бібліотеки.',
          ]}
        />
        <Rules
          head={['Порівняння', 'useState', 'useRef']}
          rows={[
            ['Зміна запускає перерендер?', 'так', 'ні'],
            ['Переживає рендери?', 'так', 'так'],
            ['Для чого', 'те, що бачить користувач', 'технічне значення, DOM-елемент'],
            ['Як змінюють', '`setValue(…)`', '`ref.current = …` (напряму)'],
          ]}
        />
        <Rules
          rows={[
            ['`ref.current` для DOM заповнюється ПІСЛЯ рендера', 'читай в `useEffect` або обробнику, не в тілі компонента'],
            ['Ініціалізація', '`useRef(null)` для DOM, `useRef(0)` для значення'],
            ['Один ref — один елемент', 'для кількох полів потрібні кілька ref'],
            ['Не міняй і не читай `ref.current` під час рендера', 'інакше результат стає непередбачуваним'],
            ['У React 19 ref — звичайний проп', '`function Field({ ref })` (раніше — `forwardRef`)'],
          ]}
        />
        <P>{'У React Native `useRef` потрібен ще частіше: фокус `TextInput`, прокрутка `ScrollView`/`FlatList` — усе через ref.'}</P>
      </Section>

      <Section title="Приклад: ref проти state">
        <Demo>
          <RefVsState />
        </Demo>
        <CodeBlock code={refVsStateSource} />
      </Section>

      <Section title="Приклад з реального життя: чат з автофокусом і прокруткою">
        <P>{'Після відправки повідомлення список автоматично прокручується донизу, а фокус повертається в поле.'}</P>
        <Demo>
          <ChatBox />
        </Demo>
        <CodeBlock code={chatSource} />
      </Section>

      <Section title="Приклад: секундомір">
        <P>{'`intervalRef` зберігає id таймера між рендерами; `startedAtRef` — момент старту. На екрані лише `elapsed` (state).'}</P>
        <Demo>
          <Stopwatch />
        </Demo>
        <CodeBlock code={stopwatchSource} />
      </Section>

      <Section title="Знайди помилку">
        <P>{'Шість помилок з `useRef`. Для більшості потрібна дія — читай підказки 👉.'}</P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <Bullets
          items={[
            'Відкрий `src/lessons/07-use-ref/Task.jsx`: автофокус, прокрутка блоку, лічильник у ref, попереднє значення, пауза таймера.',
            'Для кожного визнач: це має бути state чи ref?',
          ]}
        />
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Закріплення: тест">
        <P>{'11 питань про `useRef`.'}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
