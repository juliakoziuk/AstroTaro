import { Section, P, Bullets, Rules, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import RenderCounters from './RenderCounters.jsx'
import countersSource from './RenderCounters.jsx?raw'
import MemoValues from './MemoValues.jsx'
import memoValuesSource from './MemoValues.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'InlineFnBreaksMemo',
      title: 'memo є, а дитина все одно оновлюється (функція)',
      tryIt: 'Клікай на лічильник батька й дивись на бейдж дитини.',
      answer:
        '`memo` порівнює props за посиланням. Стрілка `() => …` створюється заново при кожному рендері батька, тож проп `onSave` щоразу «новий» і `memo` не допомагає. Закріпи функцію через `useCallback`.',
      fixedCode: `
const handleSave = useCallback(() => console.log('saved'), [])
<Child onSave={handleSave} />`,
    },
    {
      file: 'InlineObjectBreaksMemo',
      title: 'memo є, а дитина все одно оновлюється (об’єкт)',
      tryIt: 'Клікай на лічильник батька.',
      answer:
        '`{ fontSize: 24 }` — новий об’єкт при кожному рендері. Сталий об’єкт винеси за межі компонента (`const avatarStyle = { fontSize: 24 }`) або закріпи через `useMemo`.',
      fixedCode: `
const avatarStyle = { fontSize: 24 } // поза компонентом

<Avatar style={avatarStyle} />`,
    },
    {
      file: 'StaleCallback',
      title: 'useCallback з порожніми залежностями',
      tryIt: 'Натисни «+1» кілька разів, а потім «Показати count».',
      answer:
        'Функція закешувалась у першому рендері з `count = 0` і залежності `[]` ніколи не змушують її оновитись. Усе, що читає колбек, має бути в масиві: `[count]`.',
      fixedCode: `
const showCount = useCallback(() => {
  setShown('Зараз count = ' + count)
}, [count])`,
    },
    {
      file: 'WrongMemoDeps',
      title: 'useMemo із `[]` — пошук «застряг»',
      tryIt: 'Введи в поле «ан».',
      answer:
        'Результат `useMemo` порахований один раз і ніколи не оновлюється, бо залежності не містять `query`. Додай `[query]`. (Для такого дешевого фільтра `useMemo` узагалі не потрібен — це лише приклад помилки в залежностях.)',
      fixedCode: `
const visible = useMemo(
  () => FRUITS.filter((f) => f.toLowerCase().includes(query.toLowerCase())),
  [query],
)`,
    },
    {
      file: 'MemoWithChildren',
      title: 'memo + children',
      tryIt: 'Клікай на лічильник батька.',
      answer:
        '`<p>…</p>` між тегами — це React-елемент, об’єкт, який створюється при кожному рендері батька. `props.children` щоразу нове, тож `memo` не допомагає. Це нормально для дешевих компонентів; якщо дуже треба — закріпи елемент (`useMemo` або константа поза компонентом).',
      fixedCode: `
const staticText = <p>Статичний текст, який ніколи не змінюється</p>

<Panel>{staticText}</Panel>`,
    },
    {
      file: 'MutatedDep',
      title: 'залежність мутували',
      tryIt: 'Натисни «Додати товар за 100» кілька разів і порівняй кількість і суму.',
      answer:
        'Кількість росте (компонент перемальовується через `forceRender`), а сума ні: `items.push()` змінює той самий масив, посилання `items` не змінилось, і `useMemo` вважає залежність незмінною. Оновлюй state імутабельно: `setItems([...items, newItem])`.',
      fixedCode: `
function add() {
  setItems([...items, { name: 'Ще книга', price: 100 }])
}`,
    },
  ],
  comps,
  raws,
  causes.memo,
)

export default function MemoLesson() {
  return (
    <>
      <h1>9. memo, useMemo, useCallback</h1>

      <Section title="Що це таке">
        <P>
          {'За замовчуванням React перемальовує **усе піддерево**, коли оновлюється компонент: батько рендериться — рендеряться й усі його діти, навіть якщо їхні props не змінились. Для більшості застосунків це абсолютно нормально. Але якщо дерево велике, а компоненти важкі, можна **пропускати зайву роботу**.'}
        </P>
        <Rules
          head={['Інструмент', 'Що кешує', 'Коли використовувати']}
          rows={[
            ['`memo(Component)`', 'результат рендера компонента', 'важкий компонент, що часто рендериться з незмінними props'],
            ['`useCallback(fn, deps)`', 'саму функцію (посилання)', 'функція йде в `memo`-компонент або в залежності ефекту'],
            ['`useMemo(() => value, deps)`', 'значення (результат обчислення)', 'дороге обчислення або стабільний об’єкт/масив для `memo`/ефекту'],
          ]}
        />
        <Bullets
          items={[
            '`memo` порівнює props **поверхнево, за посиланням**. Нова функція/об’єкт/масив/JSX = «змінений» проп.',
            'Залежності `useMemo`/`useCallback` теж порівнюються за посиланням: мутація масиву їх не «відчуває».',
            'У залежностях — **усе**, що читає функція чи обчислення (`exhaustive-deps` підкаже).',
            'Мемоїзація має ціну. Не додавай її «про всяк випадок»: спершу виміряй (React DevTools → Profiler).',
            'React Compiler (React 19) може розставляти мемоїзацію автоматично, але лише для коду, що дотримується правил: чисті компоненти, неімутабельний state.',
          ]}
        />
        <P>{'У React Native це особливо важливо для довгих списків: `FlatList` перемальовує елементи, а `React.memo` для рядка списку — класичний прийом.'}</P>
      </Section>

      <Section title="Бачимо перемальовування: бейджі «оновлень»">
        <P>
          {'Клікай «Перерендерити батька» і дивись на бейджі. Звичайний компонент оновлюється щоразу, `memo` без props — ніколи, `memo` з новою функцією — щоразу (!), а `memo` з `useCallback` — ніколи.'}
        </P>
        <Demo>
          <RenderCounters />
        </Demo>
        <CodeBlock code={countersSource} />
      </Section>

      <Section title="useMemo: стабільні значення">
        <P>{'Друкуй у полі. Обидва списки отримують однаковий результат, але лише другий має **стабільне посилання**.'}</P>
        <Demo>
          <MemoValues />
        </Demo>
        <CodeBlock code={memoValuesSource} />
      </Section>

      <Section title="Знайди помилку">
        <P>{'Шість типових помилок. Бейджі в прикладах показують, скільки разів компонент оновився.'}</P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <Bullets
          items={[
            'Відкрий `src/lessons/09-memo/Task.jsx`. Зараз кожен клік перемальовує все.',
            'Додай `memo`, `useCallback` і `useMemo` так, щоб бейджі росли лише там, де змінились дані.',
          ]}
        />
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Закріплення: тест">
        <P>{'11 питань про мемоїзацію.'}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
