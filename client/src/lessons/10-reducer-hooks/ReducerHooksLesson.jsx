import { Section, P, Bullets, Rules, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import TodoReducer from './TodoReducer.jsx'
import todoSource from './TodoReducer.jsx?raw'
import CustomHooksDemo from './CustomHooksDemo.jsx'
import hooksSource from './CustomHooksDemo.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'ReducerMutates',
      title: 'reducer змінює state',
      tryIt: 'Натисни кнопку один раз і порахуй, скільки елементів з’явилось.',
      answer:
        'У режимі розробки React викликає reducer двічі, щоб виявити нечистоту. `state.items.push(...)` змінює існуючий масив, тож обидва виклики додають елемент — з’являються по два. Reducer має повертати новий state, не змінюючи старий: `{ ...state, items: [...state.items, item] }`.',
      fixedCode: `
case 'add':
  return {
    ...state,
    items: [...state.items, 'Елемент ' + (state.items.length + 1)],
  }`,
    },
    {
      file: 'ReducerNoReturn',
      title: 'гілка reducer без return',
      tryIt: 'Натисни «+1».',
      answer:
        'У гілці `inc` об’єкт просто «написаний» як вираз, а `return` немає. Reducer повертає `undefined`, state стає `undefined`, і `state.count` падає з помилкою. Кожна гілка має завершуватись `return`.',
      fixedCode: `
case 'inc':
  return { count: state.count + 1 }`,
    },
    {
      file: 'WrongAction',
      title: 'дія — рядок замість об’єкта',
      tryIt: 'Натисни «+1» кілька разів. Нічого не змінюється, і помилок немає!',
      answer:
        '`dispatch(\'inc\')` передає рядок, а reducer читає `action.type` — у рядка його немає (`undefined`). Спрацьовує `default: return state` — мовчки нічого не відбувається. Відправляй об’єкти `{ type: \'inc\' }` і в `default` кидай помилку, щоб баг не ховався.',
      fixedCode: `
dispatch({ type: 'inc' })

// у reducer:
default:
  throw new Error('Невідома дія: ' + action.type)`,
    },
    {
      file: 'SeparateHookState',
      title: 'очікували спільний стан від хука',
      tryIt: 'Клікай на кнопку й дивись на заголовок.',
      answer:
        'Кожен виклик `useCounter()` створює власний `useState`. Хук ділить логіку (код), а не дані. Щоб кнопка й заголовок бачили один лічильник, підніми state до спільного батька й передай через props, або використай контекст.',
      fixedCode: `
function Parent() {
  const { count, increment } = useCounter() // один виклик
  return (
    <>
      <CounterButton count={count} onClick={increment} />
      <CounterLabel count={count} />
    </>
  )
}`,
    },
    {
      file: 'DebounceNoCleanup',
      title: 'debounce без cleanup',
      tryIt: 'Швидко надрукуй слово (наприклад, «react») і почекай секунду. Скільки «запитів»?',
      answer:
        'Кожна літера запускає свій `setTimeout`, і жоден не скасовується — після паузи спрацьовують усі, і «запитів» стільки ж, скільки літер (debounced змінюється за кожним). Потрібен cleanup: `return () => clearTimeout(id)` скасує попередній таймер.',
      fixedCode: `
useEffect(() => {
  const id = setTimeout(() => setDebounced(value), delay)
  return () => clearTimeout(id)
}, [value, delay])`,
    },
    {
      file: 'HookInHandler',
      title: 'хук усередині обробника події',
      compileError:
        'Не запускаємо наживо. **Що буде:** React кине помилку «Invalid hook call. Hooks can only be called inside of the body of a function component», бо хуки не можна викликати в обробниках. Помилка з’явиться лише при кліку.',
      answer:
        'Хуки мають викликатись на верхньому рівні компонента або власного хука — завжди, у тому самому порядку. В обробнику використовуй значення, отримані з хука, який оголошено над ним.',
      fixedCode: `
function SaveButton() {
  const [saved, setSaved] = useState(false) // на верхньому рівні

  function handleClick() {
    setSaved(true)
  }

  return <button onClick={handleClick}>{saved ? 'Збережено' : 'Зберегти'}</button>
}`,
    },
  ],
  comps,
  raws,
  causes.reducer,
)

export default function ReducerHooksLesson() {
  return (
    <>
      <h1>10. useReducer і власні хуки</h1>

      <Section title="Що це таке">
        <P>
          {'**`useReducer`** — альтернатива `useState` для складного state. Замість багатьох `setX` у різних місцях ти описуєш усі можливі зміни в одній функції **reducer** `(state, action) => newState`, а компонент лише відправляє «події» через `dispatch`.'}
        </P>
        <CodeBlock
          code={`
const [state, dispatch] = useReducer(reducer, initialState)

dispatch({ type: 'added', title: 'Купити хліб' })  // що сталося

function reducer(state, action) {                   // як state змінюється
  switch (action.type) {
    case 'added': return [...state, { title: action.title }]
    default: throw new Error('Невідома дія: ' + action.type)
  }
}`}
        />
        <P>
          {'**Власні хуки** — спосіб винести повторювану логіку з компонентів. Це звичайна функція з назвою `useЩось`, яка всередині викликає інші хуки (`useState`, `useEffect`, `useContext`…) і повертає те, що потрібно компонентам.'}
        </P>
        <Rules
          rows={[
            ['Reducer — чиста функція', 'не мутує state, без запитів і таймерів'],
            ['Дії — об’єкти з `type`', '`{ type: \'removed\', id: 5 }`'],
            ['У `default` кидай помилку', 'щоб помилку в дії було видно'],
            ['`useReducer` vs `useState`', 'складний state / багато змін → reducer; простий → useState'],
            ['`dispatch` має стабільне посилання', 'можна безпечно передавати в `memo` та залежності'],
            ['Власний хук = функція з префіксом `use`', '`useToggle`, `useLocalStorage`, `useFetch`'],
            ['Хуки — на верхньому рівні, в однаковому порядку', 'не в `if`, не в циклах, не в обробниках'],
            ['Хук ділить код, а не дані', 'кожен виклик — власний state'],
            ['`useReducer` + Context', 'міні-Redux без сторонніх бібліотек'],
          ]}
        />
        <P>{'У React Native цей арсенал використовується скрізь: форми, кошики, автентифікація, а `useReducer` + Context часто замінює Redux у невеликих застосунках.'}</P>
      </Section>

      <Section title="Приклад з реального життя: список задач на reducer">
        <P>{'Усі зміни — у `todosReducer`. Компонент лише повідомляє, **що сталося** (`added`, `toggled`, `removed`).'}</P>
        <Demo>
          <TodoReducer />
        </Demo>
        <CodeBlock code={todoSource} />
      </Section>

      <Section title="Власні хуки: useToggle, useLocalStorage, useDebounce">
        <P>{'Введи ім’я й перезавантаж сторінку: воно збережеться завдяки `useLocalStorage`. Пошук викликається з паузою завдяки `useDebounce`.'}</P>
        <Demo>
          <CustomHooksDemo />
        </Demo>
        <CodeBlock code={hooksSource} />
      </Section>

      <Section title="Знайди помилку">
        <P>{'Шість помилок з reducer-ами та власними хуками.'}</P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <Bullets
          items={[
            'Відкрий `src/lessons/10-reducer-hooks/Task.jsx`: кошик на `useReducer`, збереження через власний `useLocalStorage`, `useToggle` для показу кошика.',
            'Перевір, що жодна гілка reducer не мутує state.',
          ]}
        />
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Закріплення: тест">
        <P>{'12 питань про `useReducer` і власні хуки.'}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
