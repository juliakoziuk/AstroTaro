import { Section, P, Bullets, Rules, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import SignupForm from './SignupForm.jsx'
import signupSource from './SignupForm.jsx?raw'
import EventsDemo from './EventsDemo.jsx'
import eventsSource from './EventsDemo.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'CallHandler',
      title: 'обробник викликали замість того, щоб передати',
      answer:
        '`onClick={increment()}` викликає функцію під час рендера, а `increment` робить `setCount` → новий рендер → знову виклик → нескінченний цикл, і React зупиняє його помилкою «Too many re-renders». Передавай саму функцію: `onClick={increment}` або `onClick={() => increment()}`.',
      fixedCode: `<button onClick={increment}>Клікнули: {count}</button>`,
    },
    {
      file: 'LowercaseOnclick',
      title: 'кнопка не реагує',
      tryIt: 'Клікни на кнопку й відкрий консоль (F12).',
      answer:
        'У JSX події називаються в camelCase: `onClick`, `onChange`, `onSubmit`. Атрибут `onclick` React не вважає обробником і лише попереджає в консолі, а клік нічого не робить.',
      fixedCode: `<button onClick={() => setLikes(likes + 1)}>👍 {likes}</button>`,
    },
    {
      file: 'FormReload',
      title: 'після відправки форма «зникає»',
      tryIt: 'Натисни «Підписатися». Сторінка перезавантажиться, це і є помилка (урок відкриється знову).',
      answer:
        'Без `e.preventDefault()` браузер виконує стандартну відправку форми — перезавантажує сторінку, і весь state втрачається. Дякуємо-повідомлення ніколи не з’явиться. Додай параметр `e` і скасуй стандартну поведінку.',
      fixedCode: `
function handleSubmit(e) {
  e.preventDefault()
  setSent(true)
}`,
    },
    {
      file: 'NoOnChange',
      title: 'у поле неможливо друкувати',
      tryIt: 'Спробуй щось змінити в полі й відкрий консоль.',
      answer:
        '`value={text}` прив’язує поле до state: що в state, те й у полі. Без `onChange` state ніхто не змінює, тож поле «заморожене» (а React про це попереджає). Додай `onChange={(e) => setText(e.target.value)}` — або використай `defaultValue`, якщо контроль не потрібен.',
      fixedCode: `<input type="text" value={text} onChange={(e) => setText(e.target.value)} />`,
    },
    {
      file: 'CheckboxValue',
      title: 'чекбокс «застряг»',
      tryIt: 'Постав галочку, а потім зніми її.',
      answer:
        'У чекбокса стан лежить в `e.target.checked`. `e.target.value` — це незмінний рядок "on", тому після першого кліку `agree` стає "on" (істинне значення) і більше не повертається до `false`.',
      fixedCode: `<input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />`,
    },
    {
      file: 'MutateFormState',
      title: 'змінюємо state напряму',
      tryIt: 'Спробуй надрукувати своє ім’я в полі.',
      answer:
        '`form.name = …` змінює існуючий об’єкт, а `setForm(form)` передає те саме посилання. React вважає, що нічого не змінилось, не перемальовує компонент, а контрольоване поле повертає старе значення. Передавай копію: `setForm({ ...form, name: e.target.value })`.',
      fixedCode: `
function handleChange(e) {
  setForm({ ...form, name: e.target.value })
}`,
    },
    {
      file: 'NumberString',
      title: 'вік додається як текст',
      tryIt: 'Зміни число в полі й подивись, що пише під ним.',
      answer:
        'Значення поля — завжди рядок. Спочатку `age` — число 20 і `20 + 10 = 30`, але після введення `age` стає рядком "25", а `"25" + 10` дає "2510". Перетворюй на число: `setAge(Number(e.target.value))`.',
      fixedCode: `<input type="number" value={age} onChange={(e) => setAge(Number(e.target.value))} />`,
    },
  ],
  comps,
  raws,
  causes.events,
)

export default function EventsFormsLesson() {
  return (
    <>
      <h1>3. Події та форми</h1>

      <Section title="Що це таке">
        <P>
          {'**Подія** — це реакція на дію користувача: клік, введення тексту, натискання клавіші, відправка форми. У React обробник — це функція, яку ти передаєш у проп `onClick`, `onChange` тощо. React викликає її сам і передає об’єкт події `e`.'}
        </P>
        <P>
          {'**Форма** у React зазвичай «контрольована»: значення кожного поля живе в state, поле завжди показує те, що у state, а будь-яка зміна проходить через `onChange` → `setState`. Завдяки цьому ти завжди знаєш, що ввів користувач, і можеш його перевірити, очистити, заблокувати кнопку.'}
        </P>
        <Rules
          rows={[
            ['Назви подій у camelCase', '`onClick`, `onChange`, `onSubmit`, `onKeyDown`, `onBlur`'],
            ['У проп передають ФУНКЦІЮ, а не її виклик', '`onClick={save}` ✅, `onClick={save()}` ❌'],
            ['Аргумент у обробник — через стрілку', '`onClick={() => remove(id)}`'],
            ['Подія `e` — об’єкт із даними', '`e.target.value`, `e.target.checked`, `e.key`'],
            ['`e.preventDefault()` скасовує стандартну дію', 'відправка форми, перехід за посиланням'],
            ['`e.stopPropagation()` зупиняє спливання події', 'клік не дійде до батька'],
            ['Контрольоване поле: `value` + `onChange`', '`value={name} onChange={(e) => setName(e.target.value)}`'],
            ['Чекбокс — `checked`, а не `value`', '`checked={agree}`'],
            ['Значення полів — завжди рядки', '`Number(e.target.value)`'],
            ['Один обробник на кілька полів', '`setForm({ ...form, [e.target.name]: e.target.value })`'],
          ]}
        />
        <P>
          {'У React Native замість `onClick` буде `onPress`, а замість `onChange` — зручніший `onChangeText` (отримує одразу рядок). Логіка контрольованих полів та форм **така сама**.'}
        </P>
      </Section>

      <Section title="Приклад з реального життя: форма реєстрації">
        <P>
          {'Спробуй: введи коротке ім’я, залиш поле й подивись, як з’являється помилка; переконайся, що кнопка активна лише при валідній формі. Зверни увагу: **помилки не зберігаються в state**, а обчислюються з `form` під час рендера.'}
        </P>
        <Demo>
          <SignupForm />
        </Demo>
        <CodeBlock code={signupSource} />
        <Bullets
          items={[
            'Один `handleChange` обслуговує всі поля завдяки атрибутам `name` та обчислюваному ключу `[name]`.',
            '`touched` — окремий state, щоб не лякати помилками, поки користувач ще нічого не вводив.',
            '`e.preventDefault()` у `handleSubmit` — обов’язково, інакше сторінка перезавантажиться.',
            'Лічильник символів `form.about.length` — теж просто значення, обчислене з state.',
          ]}
        />
      </Section>

      <Section title="Різні події: клік, спливання, клавіатура">
        <Demo>
          <EventsDemo />
        </Demo>
        <CodeBlock code={eventsSource} />
        <P>
          {'Натисни першу кнопку — у журналі два записи (кнопка та батько). Друга кнопка з `stopPropagation` дає лише один.'}
        </P>
      </Section>

      <Section title="Знайди помилку">
        <P>{'Сім типових помилок із подіями та формами. Деякі приклади потребують дій: прочитай підказку 👉 над результатом.'}</P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <P>{'Відкрий `src/lessons/03-events-forms/Task.jsx`: у коментарях п’ять пунктів і два бонуси.'}</P>
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Закріплення: тест">
        <P>{'12 питань про події та форми.'}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
