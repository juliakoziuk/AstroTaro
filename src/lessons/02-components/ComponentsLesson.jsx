import { Section, P, Bullets, Rules, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import Example from './Example.jsx'
import exampleSource from './Example.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'LowercaseComponent',
      title: 'компонент є, а на екрані порожньо',
      answer:
        'Назва компонента має починатися з великої літери. `<badge />` React вважає звичайним HTML-тегом (як `<div>`), створює невідомий елемент без вмісту і попереджає в консолі (F12). Перейменуй функцію на `Badge`.',
      fixedCode: `
function Badge({ text }) {
  return <span className="pill">{text}</span>
}
// ...
<Badge text="Новий" />`,
    },
    {
      file: 'MutateProps',
      title: 'змінюємо props усередині дитини',
      answer:
        'Props доступні лише для читання: у режимі розробки React їх «заморожує», тому присвоєння кидає помилку. Потрібне нове значення обчисли в окрему змінну (`const next = props.value + 1`), а якщо дані мають змінюватися з часом — тримай їх у state (урок 5).',
      fixedCode: `
function Counter({ value }) {
  const next = value + 1
  return <p>Значення: {next}</p>
}`,
    },
    {
      file: 'StringNumber',
      title: 'число передали рядком',
      answer:
        'Значення в лапках — завжди рядок, а `"100" + 50` дає `"10050"`. Для чисел, булевих значень, масивів і об’єктів використовуй фігурні дужки: `value={100}`.',
      fixedCode: `<Price value={100} />`,
    },
    {
      file: 'NoDestructuring',
      title: 'забули фігурні дужки в параметрах',
      answer:
        'React викликає компонент з одним аргументом — об’єктом props: `Hello({ name: \'Оля\' })`. Без деструктуризації змінна `name` — весь об’єкт, а виводити об’єкт React не вміє. Пиши `function Hello({ name })` або `props.name`.',
      fixedCode: `
function Hello({ name }) {
  return <p>Привіт, {name}!</p>
}`,
    },
    {
      file: 'MissingChildren',
      title: 'вміст між тегами зник',
      answer:
        'Компонент не вивів `children`, тому вкладений `<p>` просто загубився — без жодної помилки. Додай `children` у параметри й виведи їх у розмітці.',
      fixedCode: `
function Card({ title, children }) {
  return (
    <div className="card">
      <h4>{title}</h4>
      {children}
    </div>
  )
}`,
    },
    {
      file: 'UndefinedProp',
      title: 'проп не передали, а компонент на нього розраховує',
      answer:
        'Другий `<Greeting />` без `name`: значення `undefined`, а `undefined.toUpperCase()` — помилка. Закривай такі випадки значенням за замовчуванням (`{ name = \'гість\' }`) або перевіркою перед використанням.',
      fixedCode: `
function Greeting({ name = 'гість' }) {
  return <p>Привіт, {name.toUpperCase()}!</p>
}`,
    },
    {
      file: 'KeyAsProp',
      title: 'читаємо key з props',
      answer:
        '`key` — службовий атрибут для самого React (розрізняти елементи списку). До компонента він не доходить, тому `props.key` — `undefined`, а в консолі попередження. Потрібне значення передай окремим пропом, наприклад `id="a1"`.',
      fixedCode: `
<Item key="a1" id="a1" label="Перший" />

function Item({ id, label }) {
  return <li>id = {id}, назва = {label}</li>
}`,
    },
  ],
  comps,
  raws,
  causes.components,
)

export default function ComponentsLesson() {
  return (
    <>
      <h1>2. Компоненти, props, children</h1>

      <Section title="Що це таке">
        <P>
          {'**Компонент** — це функція, яка отримує дані й повертає JSX. Увесь інтерфейс React-застосунку — дерево компонентів: маленькі (кнопка, аватар) складаються у більші (картка, сторінка). Один раз описав — використовуєш скільки завгодно разів з різними даними.'}
        </P>
        <P>
          {'**Props** — це вхідні параметри компонента, один об’єкт. Дані течуть тільки вниз: від батька до дитини. Дитина може їх лише читати. Якщо їй треба «повідомити» батька, батько передає їй функцію (колбек).'}
        </P>
        <Rules
          rows={[
            ['Компонент — функція з великої літери, що повертає JSX', '`function Avatar() { return <img /> }`'],
            ['Props — єдиний аргумент, його деструктуризують', '`function Avatar({ name, size })`'],
            ['Props лише для читання', 'не пиши `props.size = 10`'],
            ['Значення за замовчуванням — у деструктуризації', '`{ size = 40 }`'],
            ['Рядки — в лапках, усе інше — у `{}`', '`name="Оля"`, `age={30}`, `online={false}`'],
            ['Проп без значення = `true`', '`<Badge online />`'],
            ['`children` — вкладений вміст', '`<Card>текст</Card>` → `props.children`'],
            ['JSX і функції теж можна передавати як props', '`footer={<b>ok</b>}`, `onSelect={handleSelect}`'],
            ['`key` і `ref` — службові, як звичайні props не читаються', '`<Item key={id} />`'],
            ['Рендер має бути «чистим»: ті самі props → той самий результат', 'без змін зовнішніх змінних і props'],
          ]}
        />
        <P>
          {'У React Native компоненти, props і children працюють **точнісінько так само** — змінюються лише самі «цеглинки» (замість `div` буде `View`). Тому цей урок — фундамент усього курсу.'}
        </P>
      </Section>

      <Section title="Приклад з реального життя: блок «Команда»">
        <P>
          {'Звичайна фіча будь-якого сайту: список людей. Є три компоненти: `Avatar` (ініціали), `UserBadge` (аватар + ім’я + роль) та `Card` (рамка з заголовком, вмістом `children` і «слотом» `footer`).'}
        </P>
        <Demo>
          <Example />
        </Demo>
        <CodeBlock code={exampleSource} />
        <Bullets
          items={[
            '`Avatar` має значення за замовчуванням `size = 40` — компонент працює і без цього пропа.',
            '`online` — булевий проп: `<UserBadge online />` те саме, що `online={true}`.',
            '`Card` не знає, що в ньому лежить: просто виводить `{children}`. Так будують універсальні «обгортки».',
            '`footer` — це JSX, переданий як звичайний проп: компонент сам вирішує, де його вивести.',
          ]}
        />
      </Section>

      <Section title="Знайди помилку">
        <P>
          {'Сім типових помилок із props. Спочатку подивись на код і результат та сформулюй, що не так; відповідь — під спойлером. Файли лежать у `src/lessons/02-components/bugs/`: виправляй і дивись, що зміниться.'}
        </P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <P>
          {'Відкрий `src/lessons/02-components/Task.jsx`. У коментарях на початку — що треба зробити (чотири пункти і бонус). Результат оновлюється одразу після збереження.'}
        </P>
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Закріплення: тест">
        <P>{'12 питань. Обирай відповідь — одразу побачиш пояснення.'}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
