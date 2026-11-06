import { Section, P, Bullets, Rules, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import TaskBoard from './TaskBoard.jsx'
import taskBoardSource from './TaskBoard.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'MissingKey',
      title: 'список без key',
      tryIt: 'Список виглядає нормально. Відкрий консоль (F12).',
      answer:
        'Для кожного елемента списку React вимагає `key`. Без нього він не може надійно розрізняти елементи й попереджає в консолі «Each child in a list should have a unique "key" prop». Візьми стабільний унікальний ідентифікатор даних (id); для простого списку рядків, що не змінюється, можна й сам рядок.',
      fixedCode: `
{fruits.map((fruit) => (
  <li key={fruit}>{fruit}</li>
))}`,
    },
    {
      file: 'IndexKey',
      title: 'key = index і додавання зверху',
      tryIt: 'Впиши щось у поле першого рядка, а потім натисни «Додати зверху».',
      answer:
        'Текст «прилип» до позиції, а не до «Яблук». З `key={index}` елемент «Нове» отримав ключ 0 — той самий, що мало «Яблука», тож React вирішив, що це той самий елемент і залишив у ньому введений текст. Ключем має бути стабільний id самих даних, який «їде» разом з елементом.',
      fixedCode: `
const [items, setItems] = useState([
  { id: 1, name: 'Яблука' },
  { id: 2, name: 'Банани' },
])
// ...
{items.map((item) => (
  <li key={item.id}>{item.name}: <input type="text" /></li>
))}`,
    },
    {
      file: 'RandomKey',
      title: 'key = Math.random()',
      tryIt: 'Впиши щось у поле й натисни «Перерендерити».',
      answer:
        'Ключ змінюється при кожному рендері, тому React вважає, що це щоразу НОВІ елементи: знищує старі разом із введеним текстом і створює нові. Крім втрати state, це ще й повільно. Ключ має бути стабільним: береться з даних, а не генерується в render.',
      fixedCode: `
const items = [
  { id: 'apple', name: 'Яблука' },
  { id: 'banana', name: 'Банани' },
]
// ...
<li key={item.id}>…</li>`,
    },
    {
      file: 'MapNoReturn',
      title: 'map нічого не повертає',
      answer:
        'Після `=>` стоять фігурні дужки — це тіло функції, а не об’єкт чи розмітка. Без `return` колбек повертає `undefined`, тому React нічого не малює. Заміни фігурні дужки на круглі (неявне повернення) або додай `return`.',
      fixedCode: `
{names.map((name) => (
  <li key={name}>{name}</li>
))}

// або
{names.map((name) => {
  return <li key={name}>{name}</li>
})}`,
    },
    {
      file: 'ObjectsAsChild',
      title: 'вивели масив об’єктів',
      answer:
        'React може вивести масив рядків, чисел чи елементів, але не масив звичайних об’єктів. Перетвори кожен об’єкт на JSX через `.map()` і не забудь `key`.',
      fixedCode: `
{users.map((user) => (
  <p key={user.id}>{user.name}</p>
))}`,
    },
    {
      file: 'MutateSort',
      title: 'сортуємо state «на місці»',
      tryIt: 'Натисни «Сортувати» — що змінилось? Потім відкрий відповідь.',
      answer:
        '`sort()` змінює масив на місці та повертає те саме посилання, а `setNumbers(numbers)` передає його ж. React порівнює за посиланням, бачить «нічого нового» і не перемальовує. Сортуй копію: `[...numbers].sort(…)`.',
      fixedCode: `
function sort() {
  setNumbers([...numbers].sort((a, b) => a - b))
}`,
    },
    {
      file: 'MapUndefined',
      title: 'дані ще не прийшли',
      answer:
        '`useState()` без аргументу дає `undefined`, а `undefined.map` — це помилка. Типовий сценарій: дані завантажуються з сервера. Став початкове значення `[]` або перевіряй наявність (`users?.map`, ранній вихід «Завантаження…»).',
      fixedCode: `
const [users, setUsers] = useState([]) // порожній масив замість undefined`,
    },
  ],
  comps,
  raws,
  causes.lists,
)

export default function ListsLesson() {
  return (
    <>
      <h1>4. Умови та списки (key)</h1>

      <Section title="Що це таке">
        <P>
          {'У React немає спеціальних «директив» на кшталт `if` чи `for` у розмітці. Умови й цикли — це **звичайний JavaScript**: у фігурних дужках використовуємо вирази (`?:`, `&&`, `.map()`), а складнішу логіку пишемо до `return`.'}
        </P>
        <Rules
          head={['Задача', 'Інструмент']}
          rows={[
            ['Показати або нічого', '`{isOpen && <Menu />}`'],
            ['Або-або', '`{isLogged ? <Profile /> : <Login />}`'],
            ['Складна логіка / кілька станів', '`if` до `return` або ранній `return null`'],
            ['Вивести масив', '`{items.map((x) => <li key={x.id}>…</li>)}`'],
            ['Залишити лише частину', '`items.filter(…).map(…)`'],
            ['Відсортувати без мутації', '`[...items].sort(…)`'],
            ['Додати / змінити / видалити в state', '`[...items, x]`, `items.map(…)`, `items.filter(…)`'],
            ['Порожній стан', '`items.length > 0 ? <List /> : <Empty />`'],
          ]}
        />
        <P>
          {'**`key`** — головна вимога списків. Це «ім’я» елемента серед сусідів: за ним React розуміє, що той самий елемент змінив позицію, а що нове чи видалене. Правила: унікальний серед сусідів, стабільний між рендерами, береться з даних (id), ставиться на корінь того, що повертає `map`. У React Native `FlatList` вимагає того ж самого (`keyExtractor`).'}
        </P>
      </Section>

      <Section title="Приклад з реального життя: список задач">
        <P>
          {'Додай задачу, відмітити виконаною, видали, відфільтруй, знайди. Подивись, що в коді немає жодного окремого state для «видимого списку»: він обчислюється з `tasks`, `filter` і `query`.'}
        </P>
        <Demo>
          <TaskBoard />
        </Demo>
        <CodeBlock code={taskBoardSource} />
        <Bullets
          items={[
            'Додавання: `[...tasks, новий]`. Зміна: `tasks.map(…)`. Видалення: `tasks.filter(…)`. Жодних `push`/`splice`.',
            '`key={t.id}` — стабільний ідентифікатор, тому відмічені чекбокси «їдуть» разом з елементами при фільтрації.',
            'Порожній стан: `visible.length === 0` → окреме повідомлення замість порожнього `<ul>`.',
            'Лічильник «залишилось» — теж похідне значення, а не state.',
          ]}
        />
      </Section>

      <Section title="Знайди помилку">
        <P>{'Сім помилок зі списками. Деякі видно лише після дії чи в консолі — читай підказку 👉.'}</P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <P>{'Відкрий `src/lessons/04-lists/Task.jsx`: список покупок, шість пунктів і бонус.'}</P>
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Закріплення: тест">
        <P>{'12 питань про умови, списки та key.'}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
