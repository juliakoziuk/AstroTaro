// Фінальний тест по всьому курсу. Питання нові (не повторюють тести уроків).
// topic — назва теми для підсумку «Результат по темах».

const J = 'JSX'
const C = 'Компоненти та props'
const E = 'Події та форми'
const L = 'Умови та списки'
const S = 'useState'
const F = 'useEffect'
const R = 'useRef'
const X = 'Context'
const M = 'memo / useMemo / useCallback'
const D = 'useReducer і власні хуки'
const A = 'Дані з API'
const ST = 'Стилі та Flexbox'
const N = 'Навігація'
const RN = 'React Native'

const finalQuiz = [
  // ---------- JSX ----------
  {
    topic: J,
    text: 'Що поверне цей компонент на екрані?',
    code: `
function Hello() {
  const name = 'Оля'
  return <p>Привіт, {name.toUpperCase()}!</p>
}`,
    options: ['Привіт, name.toUpperCase()!', 'Привіт, ОЛЯ!', 'Помилку: у JSX не можна викликати методи', 'Привіт, !'],
    correct: 1,
    explanation: 'У `{}` можна писати будь-який JS-вираз, зокрема виклик методу. Результат `"ОЛЯ"` підставляється в текст.',
  },
  {
    topic: J,
    text: 'Який запис коректний?',
    options: [
      '<img src={photo}>',
      '<img src={photo} />',
      '<img src="{photo}" />',
      '<img src=photo />',
    ],
    correct: 1,
    explanation: 'Теги мають бути закриті (`/>`), а значення з JS — у фігурних дужках без лапок.',
  },
  {
    topic: J,
    text: 'Яким буде результат `{items.length && <List />}`, якщо `items = []`?',
    options: ['Нічого', 'Число 0 на екрані', '`<List />` з порожнім списком', 'Помилка'],
    correct: 1,
    explanation: '`0 && x` дає `0`, а React малює число 0. Використовуй `items.length > 0 && …`.',
  },
  {
    topic: J,
    text: 'Чому `<div class="box">` у JSX — погана ідея?',
    options: [
      'Атрибут називається `className`, бо `class` — зарезервоване слово JS; React попереджає в консолі',
      'Тому що `div` не можна використовувати',
      'Тому що клас має починатися з великої літери',
      'Усе правильно',
    ],
    correct: 0,
    explanation: 'Правильно: `className`. Аналогічно `htmlFor` замість `for`.',
  },

  // ---------- Компоненти та props ----------
  {
    topic: C,
    text: 'Чому цей компонент виводить `[object Object]`-помилку?',
    code: `
function Welcome(user) {
  return <h1>Привіт, {user}</h1>
}
<Welcome user="Оля" />`,
    options: [
      'Бо `Welcome` має називатись з малої літери',
      'Бо параметр `user` — це весь об’єкт props `{ user: "Оля" }`; потрібна деструктуризація `{ user }`',
      'Бо рядки не можна передавати як props',
      'Бо забули `key`',
    ],
    correct: 1,
    explanation: 'Функція отримує один об’єкт `props`. Об’єкт не можна вивести як дочірній елемент, тому React кидає помилку.',
  },
  {
    topic: C,
    text: 'Як правильно змінити дані, які компонент отримав через props?',
    options: [
      '`props.count++`',
      'Не змінювати: попросити батька (через проп-функцію) оновити свій state',
      'Скопіювати в глобальну змінну',
      'Використати `Object.freeze`',
    ],
    correct: 1,
    explanation: 'Props тільки для читання. Дані належать батькові, а дитина повідомляє його через колбек.',
  },
  {
    topic: C,
    text: 'Що таке `children`?',
    options: [
      'Масив імен дочірніх компонентів',
      'Проп із вмістом, вкладеним між відкриваючим і закриваючим тегами компонента',
      'Метод класу',
      'Хук',
    ],
    correct: 1,
    explanation: '`<Card>текст</Card>` → `props.children === "текст"`. Компонент сам вирішує, де його вивести.',
  },
  {
    topic: C,
    text: 'Що означає `<Modal visible />`?',
    options: ['`visible="visible"`', '`visible={true}`', '`visible={undefined}`', 'Синтаксична помилка'],
    correct: 1,
    explanation: 'Проп без значення — скорочення для `true`.',
  },
  {
    topic: C,
    text: 'Яка перевага винесення UI у маленькі компоненти?',
    options: [
      'Код стає повільнішим, зате красивішим',
      'Перевикористання, ізоляція (кожен має свій state і логіку), простіше читати та тестувати',
      'Менше файлів',
      'Це вимагає React',
    ],
    correct: 1,
    explanation: 'Дерево маленьких компонентів — основа React: один раз описав — використовуєш скрізь з різними props.',
  },

  // ---------- Події та форми ----------
  {
    topic: E,
    text: 'Яка різниця між `onClick={go}` та `onClick={go()}`?',
    options: [
      'Немає різниці',
      'Перше передає функцію (викличеться при кліку), друге викликає `go` під час рендера',
      'Друге швидше',
      'Перше — помилка',
    ],
    correct: 1,
    explanation: 'Обробник — це функція, а не її результат. Виклик у рендері викликає побічні ефекти й цикли.',
  },
  {
    topic: E,
    text: 'Яка ознака контрольованого поля?',
    options: [
      'Є атрибут `required`',
      '`value` береться зі state, а `onChange` оновлює цей state',
      'Поле має `id`',
      'Поле в `<form>`',
    ],
    correct: 1,
    explanation: 'Джерело істини — state React, а не DOM.',
  },
  {
    topic: E,
    text: 'Що робить `e.preventDefault()` в `onSubmit`?',
    options: [
      'Очищає поля',
      'Скасовує стандартну відправку форми і перезавантаження сторінки',
      'Зупиняє спливання події',
      'Валідує форму',
    ],
    correct: 1,
    explanation: 'Без нього сторінка перезавантажиться, а state втратиться.',
  },
  {
    topic: E,
    text: 'Користувач ввів `20` в `<input type="number">`. Що таке `e.target.value`?',
    options: ['Число 20', 'Рядок "20"', 'undefined', 'Булеве true'],
    correct: 1,
    explanation: 'Значення полів — завжди рядки. Конвертуй: `Number(e.target.value)`.',
  },
  {
    topic: E,
    text: 'Як оновити одне поле об’єкта форми?',
    options: [
      '`form.email = value`',
      '`setForm({ ...form, email: value })`',
      '`setForm.email(value)`',
      '`form = { email: value }`',
    ],
    correct: 1,
    explanation: 'Створи копію з новим значенням, не мутуючи старий об’єкт.',
  },

  // ---------- Умови та списки ----------
  {
    topic: L,
    text: 'Що найкраще використати як `key` для елементів списку з бази даних?',
    options: ['Індекс масиву', '`Math.random()`', 'Унікальний `id` запису', 'Назву елемента завжди'],
    correct: 2,
    explanation: 'Ключ має бути стабільним і унікальним серед сусідів. `id` з бази — ідеально.',
  },
  {
    topic: L,
    text: 'Чому ця розмітка не показує нічого?',
    code: `
{users.map((u) => {
  <li key={u.id}>{u.name}</li>
})}`,
    options: [
      'Бракує `key`',
      'Тіло стрілкової функції у `{}` не має `return`, тож map повертає масив `undefined`',
      '`users` — не масив',
      'JSX не підтримує `map`',
    ],
    correct: 1,
    explanation: 'Або круглі дужки (неявне повернення), або явний `return`.',
  },
  {
    topic: L,
    text: 'Який спосіб видалення елемента зі state-масиву правильний?',
    options: [
      '`list.splice(i, 1); setList(list)`',
      '`setList(list.filter((x) => x.id !== id))`',
      '`delete list[i]`',
      '`setList(list.pop())`',
    ],
    correct: 1,
    explanation: '`filter` створює новий масив. Інші варіанти мутують існуючий.',
  },
  {
    topic: L,
    text: 'Як безпечно показати порожній список?',
    options: [
      '`{items.length && <List />}`',
      '`{items.length > 0 ? <List items={items} /> : <p>Порожньо</p>}`',
      '`{items ? <List /> : null}`',
      '`{!items && <p>Порожньо</p>}`',
    ],
    correct: 1,
    explanation: 'Явне порівняння та тернарний оператор дозволяють показати empty state та уникнути виводу «0».',
  },
  {
    topic: L,
    text: 'Де має зберігатись відфільтрований список для показу?',
    options: [
      'У власному state, який синхронізуємо ефектом',
      'Не зберігається: обчислюється під час рендера з повного списку й значення фільтра',
      'У `localStorage`',
      'У `ref`',
    ],
    correct: 1,
    explanation: 'Похідні дані не дублюють у state — так вони не розсинхронізуються.',
  },

  // ---------- useState ----------
  {
    topic: S,
    text: 'Скільки буде в `count` після одного кліку?',
    code: `
const [count, setCount] = useState(0)
const add2 = () => {
  setCount(count + 1)
  setCount(count + 1)
}`,
    options: ['0', '1', '2', 'Залежить від версії'],
    correct: 1,
    explanation: '`count` — «знімок» поточного рендера: обидва виклики ставлять 1. Потрібне `setCount(c => c + 1)`.',
  },
  {
    topic: S,
    text: 'Що поверне `useState(initial)`?',
    options: ['Значення', 'Масив: [значення, функція оновлення]', 'Об’єкт', 'Проміс'],
    correct: 1,
    explanation: 'Тому використовується деструктуризація: `const [x, setX] = useState(…)`.',
  },
  {
    topic: S,
    text: 'Чому хуки не можна викликати в `if`?',
    options: [
      'JavaScript забороняє',
      'React ідентифікує хуки за порядком виклику; він має бути однаковим при кожному рендері',
      'Так швидше',
      'Через `strict mode`',
    ],
    correct: 1,
    explanation: 'Порядок хуків — «ключ» до їхнього state. Умовний хук ламає цей порядок.',
  },
  {
    topic: S,
    text: 'Яка проблема тут?',
    code: `
const [first, setFirst] = useState('Олена')
const [last, setLast] = useState('Коваль')
const [full, setFull] = useState(first + ' ' + last)`,
    options: [
      'Проблем немає',
      '`full` обчислюється з інших state і не оновлюється: має бути звичайною змінною `const full = first + \' \' + last`',
      'Не можна мати три state',
      'Потрібно `useReducer`',
    ],
    correct: 1,
    explanation: 'Похідне значення не дублюють у state.',
  },
  {
    topic: S,
    text: 'Компонент, оголошений всередині іншого, при кожному рендері батька…',
    options: [
      'Зберігає свій state',
      'Пересоздається як новий тип, тому втрачає state (скидається)',
      'Стає швидшим',
      'Нічого особливого',
    ],
    correct: 1,
    explanation: 'Оголошуй компоненти на верхньому рівні файлу.',
  },
  {
    topic: S,
    text: 'Як «скинути» state дочірнього компонента, коли змінився `userId`?',
    options: ['`window.location.reload()`', '`<Profile key={userId} />`', '`setState(null)` зовні', 'Неможливо'],
    correct: 1,
    explanation: 'Зміна `key` змушує React створити компонент заново з початковим state.',
  },

  // ---------- useEffect ----------
  {
    topic: F,
    text: 'Коли виконується код ефекту?',
    options: ['До рендера', 'Після того, як React оновив екран', 'Лише при кліку', 'Лише раз за життя застосунку'],
    correct: 1,
    explanation: 'Ефекти виконуються після рендера (commit).',
  },
  {
    topic: F,
    text: 'Що означає `useEffect(fn, [])`?',
    options: [
      'Виконати після кожного рендера',
      'Виконати один раз після першої появи компонента (і cleanup при зникненні)',
      'Ніколи не виконувати',
      'Виконувати при зміні будь-якого state',
    ],
    correct: 1,
    explanation: 'Порожній масив залежностей — «нічого не змінюється, тож не запускай повторно».',
  },
  {
    topic: F,
    text: 'Що має повертати функція ефекту?',
    options: [
      'Promise',
      '`undefined` або функцію cleanup',
      'JSX',
      'Нове значення state',
    ],
    correct: 1,
    explanation: 'Тому `async`-функцію напряму в `useEffect` передавати не можна.',
  },
  {
    topic: F,
    text: 'Навіщо cleanup у цьому ефекті?',
    code: `
useEffect(() => {
  const id = setInterval(tick, 1000)
  return () => clearInterval(id)
}, [])`,
    options: [
      'Це прикраса',
      'Щоб при зникненні компонента зупинити таймер і не допустити витоку',
      'Щоб прискорити таймер',
      'Щоб викликати ефект двічі',
    ],
    correct: 1,
    explanation: 'Без cleanup таймер працював би далі й оновлював неіснуючий компонент.',
  },
  {
    topic: F,
    text: 'Чому в режимі розробки ефект запускається двічі при першому показі?',
    options: [
      'Помилка Vite',
      'StrictMode навмисно виконує ефект → cleanup → ефект, щоб виявити відсутній cleanup',
      'Через два компоненти',
      'Через повільний ПК',
    ],
    correct: 1,
    explanation: 'У продакшені цього немає.',
  },
  {
    topic: F,
    text: 'Для чого `ignore`-прапорець у cleanup при запиті?',
    options: [
      'Прискорити запит',
      'Захист від «гонки»: відповідь застарілого запиту не повинна перезаписати актуальні дані',
      'Скасувати state',
      'Для логування',
    ],
    correct: 1,
    explanation: 'Cleanup виконується при зміні залежностей — там позначаємо старий запит як неактуальний.',
  },
  {
    topic: F,
    text: 'Для чого `useEffect` НЕ потрібен?',
    options: [
      'Підписка на `resize`',
      'Обчислення `total` з `price * qty`',
      'Запит даних при відкритті сторінки',
      'Таймер',
    ],
    correct: 1,
    explanation: 'Значення, що обчислюється з props/state, рахують під час рендера.',
  },

  // ---------- useRef ----------
  {
    topic: R,
    text: 'Чим `useRef` відрізняється від `useState`?',
    options: [
      'Нічим',
      'Зміна `ref.current` не викликає перерендер, а значення переживає рендери',
      'ref не переживає рендери',
      'ref — лише для чисел',
    ],
    correct: 1,
    explanation: 'Ref — «коробочка» для технічних значень та DOM-елементів.',
  },
  {
    topic: R,
    text: 'Коли можна безпечно викликати `inputRef.current.focus()`?',
    options: [
      'У тілі компонента під час рендера',
      'В обробнику події або в `useEffect` — коли елемент уже в DOM',
      'Ніколи',
      'Лише в конструкторі',
    ],
    correct: 1,
    explanation: 'Під час першого рендера `current` ще `null`.',
  },
  {
    topic: R,
    text: 'Де зберігати id таймера `setInterval`, щоб зупинити його з іншого обробника?',
    options: ['У `let` всередині компонента', 'У `useRef`', 'У `props`', 'У `key`'],
    correct: 1,
    explanation: 'Звичайна змінна створюється заново при кожному рендері, а ref зберігається.',
  },
  {
    topic: R,
    text: 'Чому не варто використовувати `document.getElementById` для DOM у компонентах?',
    options: [
      'Не працює в Chrome',
      '`id` має бути унікальним на сторінці, а компонент можна відрендерити кілька разів; ref прив’язаний до конкретного екземпляра (і в RN `document` немає)',
      'Це дорого',
      'Це заборонено синтаксисом',
    ],
    correct: 1,
    explanation: 'Ref — «адреса» саме цього елемента.',
  },

  // ---------- Context ----------
  {
    topic: X,
    text: 'Яку проблему вирішує Context?',
    options: [
      'Повільний рендер',
      'Prop drilling: передачу даних через багато проміжних компонентів',
      'Помилки мережі',
      'Стилізацію',
    ],
    correct: 1,
    explanation: 'Provider віддає значення, `useContext` читає його в будь-якому нащадку.',
  },
  {
    topic: X,
    text: 'Що отримає `useContext`, якщо над компонентом немає Provider?',
    options: ['Помилку React', 'Значення за замовчуванням з `createContext(default)`', 'Завжди `null`', 'Значення сусіда'],
    correct: 1,
    explanation: 'Тому, якщо default — `undefined`, деструктуризація впаде; захищайся власним хуком.',
  },
  {
    topic: X,
    text: 'Чому тема не перемикається?',
    code: `
function ThemeProvider({ children }) {
  let theme = 'light'
  const toggle = () => { theme = theme === 'light' ? 'dark' : 'light' }
  return <Ctx value={{ theme, toggle }}>{children}</Ctx>
}`,
    options: [
      'Контекст не працює з функціями',
      'Звичайна змінна не запускає рендер; значення має жити в `useState` Provider-а',
      'Потрібен `memo`',
      'Потрібен `useRef`',
    ],
    correct: 1,
    explanation: 'Context лише «транспортує» значення; state живе в Provider.',
  },
  {
    topic: X,
    text: 'Що буде, коли `value` у Provider змінилось?',
    options: [
      'Нічого',
      'Усі споживачі цього контексту перемалюються',
      'Весь застосунок перезавантажиться',
      'Лише останній споживач',
    ],
    correct: 1,
    explanation: 'Тому не клади у контекст дані, що змінюються щосекунди.',
  },

  // ---------- memo ----------
  {
    topic: M,
    text: 'Що робить `React.memo(Component)`?',
    options: [
      'Кешує запити',
      'Пропускає перемальовування, якщо props не змінились (поверхневе порівняння)',
      'Вимикає state',
      'Зберігає дані в localStorage',
    ],
    correct: 1,
    explanation: 'Порівняння за посиланням: нова функція/об’єкт = «змінений» проп.',
  },
  {
    topic: M,
    text: 'Чому `memo` не допомагає в цьому випадку?',
    code: `<Child onSave={() => save()} />`,
    options: [
      'Бо `save` не імпортований',
      'Стрілка створюється заново при кожному рендері батька — нове посилання; потрібен `useCallback`',
      'Бо Child без key',
      'Бо `memo` працює лише з об’єктами',
    ],
    correct: 1,
    explanation: 'Функції та об’єкти в тілі компонента — нові при кожному рендері.',
  },
  {
    topic: M,
    text: 'Що кешує `useMemo`?',
    options: ['Функцію', 'Результат обчислення (значення)', 'DOM-вузол', 'Запит'],
    correct: 1,
    explanation: '`useCallback(fn)` — те саме, що `useMemo(() => fn)`: кешує саму функцію.',
  },
  {
    topic: M,
    text: 'Яка помилка в цьому коді?',
    code: `
const show = useCallback(() => alert(count), [])`,
    options: [
      'Немає',
      'Масив залежностей не містить `count`: функція завжди бачитиме значення першого рендера',
      'Не можна використовувати `alert`',
      'Треба `useMemo`',
    ],
    correct: 1,
    explanation: 'Усе, що читає колбек, має бути в залежностях.',
  },
  {
    topic: M,
    text: 'Яке твердження про оптимізацію правильне?',
    options: [
      'Мемоїзуй усе',
      'Спочатку виміряй проблему (Profiler), потім оптимізуй вузькі місця; зайва мемоїзація має ціну',
      'Оптимізація завжди шкодить',
      'Потрібно лише в production',
    ],
    correct: 1,
    explanation: 'Передчасна оптимізація ускладнює код без виграшу.',
  },

  // ---------- reducer / hooks ----------
  {
    topic: D,
    text: 'Яка сигнатура reducer?',
    options: ['`(action) => state`', '`(state, action) => newState`', '`(props) => JSX`', '`() => void`'],
    correct: 1,
    explanation: 'Чиста функція, що повертає новий state на основі поточного і дії.',
  },
  {
    topic: D,
    text: 'Чому `state.items.push(x)` у reducer — помилка?',
    options: [
      'Це допустимо',
      'Reducer має бути чистим: мутація ламає порівняння за посиланням і у StrictMode дає дублікати (reducer викликається двічі)',
      'push заборонений у React',
      'Reducer не працює з масивами',
    ],
    correct: 1,
    explanation: 'Повертай новий об’єкт/масив: `{ ...state, items: [...state.items, x] }`.',
  },
  {
    topic: D,
    text: 'Що таке власний хук?',
    options: [
      'Спеціальний клас',
      'Функція з назвою `useЩось`, яка викликає інші хуки й повторно використовує логіку',
      'Плагін Vite',
      'Метод компонента',
    ],
    correct: 1,
    explanation: 'Хук ділить код, а не дані: кожен виклик має власний state.',
  },
  {
    topic: D,
    text: 'Два компоненти викликають `useCounter()`. Їхні лічильники…',
    options: ['Спільні', 'Незалежні', 'Спільні, якщо вони сусіди', 'Залежать від порядку імпорту'],
    correct: 1,
    explanation: 'Щоб ділитись, підніми state до спільного батька або використай Context.',
  },
  {
    topic: D,
    text: 'Чому `dispatch(\'inc\')` нічого не робить у reducer із `switch(action.type)`?',
    options: [
      'Бо `dispatch` асинхронний',
      'У рядка немає `.type` (це `undefined`), тому спрацьовує `default`; треба відправляти об’єкт `{ type: \'inc\' }`',
      'Бо `inc` зарезервоване слово',
      'Бо потрібен `await`',
    ],
    correct: 1,
    explanation: 'У `default` краще кидати помилку, щоб баг не приховувався.',
  },

  // ---------- дані з API ----------
  {
    topic: A,
    text: 'Що робить `fetch`, коли сервер відповів 404?',
    options: [
      'Кидає помилку',
      'Завершується успішно; статус треба перевірити через `res.ok`',
      'Повторює запит',
      'Повертає `null`',
    ],
    correct: 1,
    explanation: '`fetch` відхиляється лише при мережевих збоях.',
  },
  {
    topic: A,
    text: 'Які стани має мати екран із даними?',
    options: [
      'Лише success',
      'loading, success, error (і «порожньо»)',
      'Лише error',
      'Стани не потрібні',
    ],
    correct: 1,
    explanation: 'Користувач завжди має бачити, що відбувається.',
  },
  {
    topic: A,
    text: 'Навіщо `Promise.all`?',
    options: [
      'Щоб виконати запити по черзі',
      'Щоб запустити незалежні запити одночасно і дочекатись усіх',
      'Щоб скасувати запити',
      'Щоб кешувати',
    ],
    correct: 1,
    explanation: 'Загальний час ≈ найповільнішого запиту, а не сумі.',
  },
  {
    topic: A,
    text: 'Де зазвичай скидати `loading = false`?',
    options: [
      'Лише в `then`',
      'У `finally` (і при успіху, і при помилці)',
      'Лише в `catch`',
      'Нікуди',
    ],
    correct: 1,
    explanation: 'Інакше після помилки спінер крутитиметься вічно.',
  },
  {
    topic: A,
    text: 'Що не так?',
    code: `
const res = await fetch(url)
const data = res.json()
setUser(data)`,
    options: [
      'Усе добре',
      '`res.json()` повертає Promise: потрібен `await`',
      'Потрібен `useRef`',
      'Помилка в `setUser`',
    ],
    correct: 1,
    explanation: 'У state потрапить Promise, а не дані.',
  },

  // ---------- стилі ----------
  {
    topic: ST,
    text: '`flexDirection: \'row\'`, треба відцентрувати елемент по вертикалі. Яка властивість?',
    options: ['`justifyContent: \'center\'`', '`alignItems: \'center\'`', '`textAlign: \'center\'`', '`verticalAlign`'],
    correct: 1,
    explanation: 'У рядка вертикаль — поперечна вісь (керується `alignItems`).',
  },
  {
    topic: ST,
    text: 'Що робить `flex: 1`?',
    options: [
      'Задає ширину 1 px',
      'Розтягує елемент на весь вільний простір по головній осі',
      'Ховає елемент',
      'Вимикає прокрутку',
    ],
    correct: 1,
    explanation: 'Кілька елементів з `flex: 1` ділять простір порівну.',
  },
  {
    topic: ST,
    text: 'Який запис стилю правильний у React?',
    options: [
      '`style="color: red"`',
      '`style={{ color: \'red\', fontSize: 20 }}`',
      '`style={color: \'red\'}`',
      '`style={\'color: red\'}`',
    ],
    correct: 1,
    explanation: '`style` приймає об’єкт з camelCase-ключами; числа — пікселі.',
  },
  {
    topic: ST,
    text: 'Чому абсолютний бейдж «втік» зі своєї картки у вебі?',
    options: [
      'Бо не було flex',
      'У картки немає `position: \'relative\'`, тому позиціонування рахується від іншого предка',
      'Бо забули `key`',
      'Бо `top` не працює',
    ],
    correct: 1,
    explanation: 'Абсолютний елемент прив’язується до найближчого позиціонованого предка.',
  },

  // ---------- навігація ----------
  {
    topic: N,
    text: 'Як передати `id` на інший екран у React Navigation?',
    options: [
      'Через глобальну змінну',
      '`navigation.navigate(\'Details\', { id })`, а читати з `route.params`',
      'Через `localStorage`',
      'Неможливо',
    ],
    correct: 1,
    explanation: 'Параметри екрана — аналог props.',
  },
  {
    topic: N,
    text: 'Чому не можна викликати `navigation.navigate()` у тілі компонента?',
    options: [
      'Повільно',
      'Це побічний ефект під час рендера: роби це в обробнику події або `useEffect`',
      'Забороняє TypeScript',
      'Можна без обмежень',
    ],
    correct: 1,
    explanation: 'Рендер має бути чистим.',
  },
  {
    topic: N,
    text: 'Як влаштований «стек екранів»?',
    options: [
      'Усі екрани показані одночасно',
      '`navigate` кладе екран зверху, `goBack` знімає верхній',
      'Кожен екран — окремий застосунок',
      'Екрани — це URL у браузері',
    ],
    correct: 1,
    explanation: 'Це push/pop масиву екранів.',
  },

  // ---------- React Native ----------
  {
    topic: RN,
    text: 'Чим `View` у React Native схожий на `div`?',
    options: [
      'Нічим',
      'Це базовий контейнер (flex-контейнер, за замовчуванням з `flexDirection: \'column\'`)',
      'Це текстовий елемент',
      'Це кнопка',
    ],
    correct: 1,
    explanation: 'Текст усередині — лише через `Text`.',
  },
  {
    topic: RN,
    text: 'Яка подія натискання в React Native?',
    options: ['`onClick`', '`onPress`', '`onTap`', '`onChange`'],
    correct: 1,
    explanation: '`onPress` у `Pressable`, `TouchableOpacity`, `Button`.',
  },
  {
    topic: RN,
    text: 'Який запис стилю допустимий у React Native?',
    options: [
      '`{ fontSize: \'20px\' }`',
      '`{ fontSize: 20 }`',
      '`{ border: \'1px solid red\' }`',
      '`{ font-size: 20 }`',
    ],
    correct: 1,
    explanation: 'Розміри — числа, окремі властивості (`borderWidth`, `borderColor`), camelCase.',
  },
  {
    topic: RN,
    text: 'Який компонент потрібен для довгого списку на телефоні?',
    options: ['`ul`', '`FlatList`', '`Table`', '`div` з `map`'],
    correct: 1,
    explanation: '`FlatList` віртуалізує список: малює лише видимі елементи.',
  },
  {
    topic: RN,
    text: 'Що з вивченого працює в React Native без змін?',
    options: [
      'HTML-теги',
      'Компоненти, props, state, хуки, Context, reducer, fetch та async/await',
      'CSS-файли',
      '`window` і `document`',
    ],
    correct: 1,
    explanation: 'Це «серце» React — воно однакове.',
  },
  {
    topic: RN,
    text: 'Чим замінити `localStorage` у React Native?',
    options: [
      'Нічим, він є',
      '`AsyncStorage` (або `expo-secure-store`/MMKV)',
      '`sessionStorage`',
      'Cookies',
    ],
    correct: 1,
    explanation: 'У RN немає браузера: сховище надає бібліотека, і воно асинхронне.',
  },
]

export default finalQuiz
