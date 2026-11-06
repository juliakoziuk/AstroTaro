import { Section, P, Bullets, Rules, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import UsersList from './UsersList.jsx'
import usersSource from './UsersList.jsx?raw'
import ResponseCheck from './ResponseCheck.jsx'
import responseSource from './ResponseCheck.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'NoLoadingState',
      title: 'дані ще не прийшли, а ми їх уже виводимо',
      answer:
        'Початкове значення `null`, а `null.map` — помилка. Поки дані завантажуються, їх немає. Або починай з `[]`, або (краще) показуй окремий стан «Завантаження…», поки `users === null`.',
      fixedCode: `
if (users === null) return <p>⏳ Завантаження…</p>

return <ul>{users.map(…)}</ul>`,
    },
    {
      file: 'NoOkCheck',
      title: 'не перевіряємо res.ok',
      answer:
        'Для `fetch` статус 404 — «нормальна» відповідь: `res.json()` повернув `{ error: \'Not found\' }`, а в нас там немає `name` та `city`, тому екран показує порожні лапки без жодної помилки. Перевіряй `res.ok` і кидай помилку.',
      fixedCode: `
.then((res) => {
  if (!res.ok) throw new Error('HTTP ' + res.status)
  return res.json()
})`,
    },
    {
      file: 'NoCatch',
      title: 'немає catch',
      tryIt: 'Почекай секунду: запит «впаде». Відкрий консоль (F12).',
      answer:
        'Промис відхилився, а `.catch` немає: помилка іде в консоль як unhandled rejection, а екран назавжди залишається у «Завантаженні». Завжди обробляй помилку й показуй її користувачу.',
      fixedCode: `
fakeFetch('/users/1')
  .then((res) => res.json())
  .then(setUser)
  .catch((error) => setError(error.message))`,
    },
    {
      file: 'LoadingNeverReset',
      title: 'спінер після помилки',
      answer:
        '`setLoading(false)` стоїть лише в `then`. Після помилки він не виконується, тож «Завантаження…» висить поруч із повідомленням про помилку. Скидай прапорець у `finally` (виконується в обох випадках).',
      fixedCode: `
getUsers()
  .then(setUsers)
  .catch((err) => setError(err.message))
  .finally(() => setLoading(false))`,
    },
    {
      file: 'NoJsonAwait',
      title: 'res.json() без await',
      tryIt: 'Натисни кнопку й подивись, що з’явилось у блоці під нею.',
      answer:
        '`res.json()` повертає Promise, а не дані. У state опинився Promise, а `JSON.stringify(Promise)` дає `{}`. Додай `await`: `const data = await res.json()`.',
      fixedCode: `
const res = await fakeFetch('/users/1')
const data = await res.json()
setUser(data)`,
    },
    {
      file: 'SequentialAwaits',
      title: 'незалежні запити по черзі',
      tryIt: 'Натисни кожну кнопку й порівняй час у мс.',
      answer:
        'Два `await` підряд виконуються послідовно: 300 + 500 ≈ 800 мс. Якщо запити не залежать один від одного, запускай їх одночасно через `Promise.all` — час дорівнюватиме найповільнішому (≈ 500 мс).',
      fixedCode: `
const [user, posts] = await Promise.all([getUser(2), getPosts(2)])`,
    },
  ],
  comps,
  raws,
  causes.data,
)

export default function DataLesson() {
  return (
    <>
      <h1>11. Дані з API (loading / error)</h1>

      <Section title="Що це таке">
        <P>
          {'Майже кожен реальний застосунок завантажує дані з сервера. А мережа — це **час очікування і ймовірність помилки**. Тому екран із даними завжди має кілька станів, а код — обробляти кожен із них.'}
        </P>
        <Rules
          head={['Стан', 'Що показати']}
          rows={[
            ['`loading`', 'спінер / «Завантаження…» / скелетон'],
            ['`success` із даними', 'сам вміст (список, картка)'],
            ['`success`, але порожньо', '«Нічого не знайдено» + підказка, що робити'],
            ['`error`', 'зрозуміле повідомлення і кнопка «Спробувати ще раз»'],
          ]}
        />
        <Bullets
          items={[
            'Запит — побічний ефект: `useEffect` (на старті/зміні параметрів) або обробник події (клік).',
            '`fetch` відхиляється лише при мережевій помилці. Для 404/500 перевіряй **`res.ok`** сам.',
            '`res.json()` — асинхронний, не забувай `await`.',
            'Незалежні запити виконуй одночасно: `Promise.all`.',
            'Тримай статус у **одному об’єкті** (`{ status, data, error }`), щоб не було «неможливих» комбінацій.',
            'Захищайся від «гонки запитів»: `ignore`-прапорець у cleanup або `AbortController`.',
            'У нашому курсі запити йдуть на `fakeApi.js` — «сервер» без мережі, з затримками й помилками. Код `fetch` у реальному проекті відрізнятиметься лише адресою.',
          ]}
        />
        <P>{'`fetch` у React Native — той самий. Тож усе, що ти тут опануєш, працюватиме й на телефоні.'}</P>
      </Section>

      <Section title="Приклад з реального життя: список користувачів">
        <P>
          {'Увімкни «Імітувати помилку сервера» й натисни «Спробувати ще раз». Знайди користувача за ім’ям, а за неіснуючим запитом побачиш empty state.'}
        </P>
        <Demo>
          <UsersList />
        </Demo>
        <CodeBlock code={usersSource} />
      </Section>

      <Section title="Статус відповіді: ok, 404 та мережа">
        <Demo>
          <ResponseCheck />
        </Demo>
        <CodeBlock code={responseSource} />
      </Section>

      <Section title="Знайди помилку">
        <P>{'Шість помилок із завантаженням даних.'}</P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <Bullets
          items={[
            'Відкрий `src/lessons/11-data/Task.jsx`: екран «Користувачі й дописи» зі станами loading/error/success та захистом від гонки.',
            'Бонус: власний хук `useAsync` і справжній `fetch` до jsonplaceholder.',
          ]}
        />
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Закріплення: тест">
        <P>{`${quiz.length} питань про роботу з даними.`}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
