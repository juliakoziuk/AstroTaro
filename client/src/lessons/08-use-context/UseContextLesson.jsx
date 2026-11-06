import { Section, P, Bullets, Rules, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import ThemeAndAuth from './ThemeAndAuth.jsx'
import themeSource from './ThemeAndAuth.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'NoProvider',
      title: 'читаємо контекст без Provider',
      answer:
        '`createContext()` без аргументу має default `undefined`, а Provider немає, тому `useContext` повертає `undefined`, і деструктуризація `{ theme }` падає. Обгорни дерево в Provider і/або напиши власний хук із перевіркою та зрозумілою помилкою.',
      fixedCode: `
<ThemeContext value={{ theme: 'light' }}>
  <Badge />
</ThemeContext>`,
    },
    {
      file: 'ProviderNoValue',
      title: 'Provider без value',
      answer:
        'Значення за замовчуванням (`\'light\'`) діє лише тоді, коли Provider над компонентом немає зовсім. Якщо Provider є, а `value` не задано, споживач отримує `undefined`, а не default. Тому текст у лапках порожній. Завжди передавай `value`.',
      fixedCode: `
<ThemeContext value="dark">
  <Badge />
</ThemeContext>`,
    },
    {
      file: 'PlainVariable',
      title: 'значення в звичайній змінній, а не в state',
      tryIt: 'Натисни кнопку кілька разів.',
      answer:
        'Зміна звичайної змінної `theme` не запускає рендер, тому ніхто не дізнається про новий `theme`. Context лише «транспортує» значення; щоб споживачі оновлювались, дані мають жити в `useState` у Provider-компоненті.',
      fixedCode: `
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')
  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'))
  return <ThemeContext value={{ theme, toggle }}>{children}</ThemeContext>
}`,
    },
    {
      file: 'OutsideProvider',
      title: 'споживач поза Provider',
      answer:
        'Provider діє лише на своє піддерево. Другий `<Hello />` стоїть поза ним, тому бере значення за замовчуванням `\'en\'`. Піднімай Provider вище — так, щоб він охоплював усі компоненти, які читають контекст (зазвичай на рівні кореня застосунку).',
      fixedCode: `
<LangContext value="uk">
  <Hello />
  <Hello />
</LangContext>`,
    },
    {
      file: 'NewValueEveryRender',
      title: 'нове значення value при кожному рендері',
      tryIt: 'Клікай на лічильник і спостерігай, як росте «Мої рендери». Споживач не залежить від лічильника!',
      answer:
        'Об’єкт `{ name: \'Олена\' }` у `value` створюється заново при кожному рендері батька. Контекст порівнює значення за посиланням, бачить «нове» і перемальовує всіх споживачів, навіть якщо `memo` на самому компоненті. Закріпи значення: `useMemo` (урок 9) або винеси константу за межі компонента.',
      fixedCode: `
const user = { name: 'Олена' } // поза компонентом: одне посилання

<UserContext value={user}>…</UserContext>

// або всередині:
const value = useMemo(() => ({ name }), [name])`,
    },
  ],
  comps,
  raws,
  causes.context,
)

export default function UseContextLesson() {
  return (
    <>
      <h1>8. useContext</h1>

      <Section title="Що це таке">
        <P>
          {'Props передаються від батька до дитини. Якщо дані (тема, користувач, мова) потрібні глибоко в дереві, доводиться «прокидати» їх через усі проміжні компоненти — **prop drilling**. **Context** дозволяє віддати значення один раз угорі й прочитати його з будь-якого місця нижче.'}
        </P>
        <CodeBlock
          code={`
const ThemeContext = createContext('light')   // 1. створити (в дужках — значення за замовчуванням)

<ThemeContext value={theme}>                   // 2. віддати вниз
  <App />
</ThemeContext>

const theme = useContext(ThemeContext)         // 3. прочитати в будь-якому нащадку`}
        />
        <Rules
          rows={[
            ['Provider віддає значення всьому піддереву', '`<Ctx value={…}>…</Ctx>`'],
            ['Споживач бере значення в НАЙБЛИЖЧОГО Provider над собою', 'вкладені Provider перевизначають значення'],
            ['Default — лише коли Provider немає над компонентом', 'не плутай з `value={undefined}`'],
            ['Context лише транспортує, state живе в Provider', '`useState` у `ThemeProvider`'],
            ['`value` змінилось → усі споживачі перемалюються', 'не клади в контекст дані, що змінюються щосекунди'],
            ['Об’єкт у `value` — нове посилання щороку', 'закріплюй `useMemo` або виноси константу'],
            ['Власний хук `useTheme()`', 'приховує контекст і перевіряє наявність Provider'],
            ['Розділяй контексти за темами', '`ThemeContext`, `AuthContext`, `CartContext`'],
          ]}
        />
        <P>{'У React Native контекст — головний інструмент для теми, авторизації, мови та кошика. React Navigation та більшість бібліотек теж побудовані на ньому.'}</P>
      </Section>

      <Section title="Приклад з реального життя: тема та авторизація">
        <P>
          {'Два контексти: тема й користувач. `Sidebar` і `Content` — **проміжні** компоненти, які нічого не знають про тему й користувача та не отримують жодних props. А `DeepChild` усе одно бачить обидва значення.'}
        </P>
        <Demo>
          <ThemeAndAuth />
        </Demo>
        <CodeBlock code={themeSource} />
        <Bullets
          items={[
            'Provider-и зберігають `useState` і додають до значення зручні функції: `toggleTheme`, `login`, `logout`.',
            'Хуки `useTheme` / `useAuth` кидають помилку, якщо забули Provider, — одразу зрозуміло, що не так.',
            'Дві окремі теми-контексти не змушують усіх перемальовуватися при зміні лише одного.',
          ]}
        />
      </Section>

      <Section title="Знайди помилку">
        <P>{'П’ять типових помилок із контекстом.'}</P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <Bullets
          items={[
            'Відкрий `src/lessons/08-use-context/Task.jsx`: кошик через Context (Provider, власний хук, список товарів, бейдж, панель кошика).',
            'Компоненти `ProductList`, `CartBadge` і `CartPanel` не мають отримувати props про кошик.',
          ]}
        />
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Закріплення: тест">
        <P>{'11 питань про Context.'}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
