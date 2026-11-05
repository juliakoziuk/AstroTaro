import { Section, P, Bullets, Rules, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import FlexPlayground from './FlexPlayground.jsx'
import Layouts from './Layouts.jsx'
import layoutsSource from './Layouts.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'JustifyVsAlign',
      title: 'елемент не по центру',
      answer:
        'У рядка (`row`) головна вісь горизонтальна, тому `justifyContent: \'center\'` відцентрував лише по горизонталі. По вертикалі (поперечна вісь) центрує `alignItems: \'center\'`. Запам’ятай: justify — вздовж напряму, align — впоперек.',
      fixedCode: `
style={{
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center', // горизонталь
  alignItems: 'center',     // вертикаль
  height: 120,
}}`,
    },
    {
      file: 'NoDisplayFlex',
      title: 'flex-властивості «не працюють»',
      answer:
        'На вебі `justifyContent` і `alignItems` діють лише на контейнер з `display: \'flex\'`. Без нього вони ігноруються. (У React Native `display: \'flex\'` вже увімкнений за замовчуванням, тому там цієї помилки не буде.)',
      fixedCode: `
style={{
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: 100,
}}`,
    },
    {
      file: 'UnitlessString',
      title: 'розміри рядками без одиниць',
      answer:
        '`\'32\'` — рядок без одиниці виміру, для CSS це недійсне значення, і воно ігнорується. Використовуй число (`32` → 32px) або рядок з одиницею (`\'32px\'`). У React Native — лише числа та відсотки (`\'50%\'`).',
      fixedCode: `
<p style={{ fontSize: 32, color: '#6d4aff' }}>…</p>
<p style={{ marginTop: 30 }}>…</p>`,
    },
    {
      file: 'FlexNoHeight',
      title: 'flex: 1 нічого не розтягує',
      answer:
        '`flex: 1` ділить ВІЛЬНИЙ простір, але в рамки немає визначеної висоти, тож вільного простору немає: вона така, як вміст. Задай висоту (`height`, `minHeight`) або дозволь розтягнутися їй самій від її батька (`flex: 1` вище по дереві). У мобільних екранах так і роблять: корінь має `flex: 1`.',
      fixedCode: `
<div style={{ display: 'flex', flexDirection: 'column', height: 160 }}>
  <div style={{ flex: 1 }}>…</div>
</div>`,
    },
    {
      file: 'AbsoluteNoRelative',
      title: 'абсолютний бейдж «втік»',
      answer:
        '`position: \'absolute\'` позиціонує елемент відносно найближчого предка, у якого теж задано `position` (relative/absolute…). У картки його немає, тож бейдж прив’язався до рамки демо. Додай картці `position: \'relative\'`.',
      fixedCode: `
<div style={{ position: 'relative', width: 220, padding: 16 }}>
  <span style={{ position: 'absolute', top: 8, right: 8 }}>NEW</span>
  …
</div>`,
    },
    {
      file: 'SpreadOrder',
      title: 'стиль з пропа не перевизначає базовий',
      answer:
        'В об’єкті пізніші ключі перезаписують ранні. `{ ...style, ...base }` — базові стилі йдуть ПІСЛЯ і затирають передані. Поміняй порядок: `{ ...base, ...style }`. У React Native те саме робить масив: `style={[base, style]}` — останній елемент має пріоритет.',
      fixedCode: `
function Message({ style, children }) {
  return <p style={{ ...base, ...style }}>{children}</p>
}`,
    },
  ],
  comps,
  raws,
  causes.styles,
)

export default function StylesLesson() {
  return (
    <>
      <h1>12. Стилі та Flexbox</h1>

      <Section title="Що це таке">
        <P>
          {'У вебі стилі пишуть у CSS-файлах, але в React їх можна передавати й **JavaScript-об’єктом** через проп `style`. У React Native це **єдиний** спосіб: там немає CSS, `div` і `class`. Розкладка екрана описується **Flexbox**.'}
        </P>
        <Rules
          head={['Властивість', 'Що робить']}
          rows={[
            ['`display: \'flex\'`', 'робить елемент flex-контейнером (у React Native — вже за замовчуванням)'],
            ['`flexDirection`', 'напрям головної осі: `row` (рядок) або `column` (колонка)'],
            ['`justifyContent`', 'розташування вздовж ГОЛОВНОЇ осі: `flex-start`, `center`, `flex-end`, `space-between`…'],
            ['`alignItems`', 'розташування вздовж ПОПЕРЕЧНОЇ осі: `stretch`, `center`, `flex-start`, `flex-end`'],
            ['`flex: 1`', 'елемент займає вільний простір (діти ділять його пропорційно)'],
            ['`gap`', 'проміжок між елементами'],
            ['`flexWrap: \'wrap\'`', 'переносити елементи на наступний рядок'],
            ['`alignSelf`', 'вирівнювання окремого елемента у поперечній осі'],
            ['`padding` / `margin`', 'внутрішній і зовнішній відступи (числа = px; у RN = dp)'],
            ['`position: \'absolute\'` + `top/left/right/bottom`', 'вийти з потоку й прив’язатись до позиціонованого батька'],
          ]}
        />
        <Bullets
          items={[
            '**Дві осі.** Змінюєш `flexDirection` — осі міняються місцями. `justifyContent` — вздовж напряму, `alignItems` — впоперек.',
            'Стиль у React — об’єкт із **camelCase**-ключами: `backgroundColor`, `fontSize`, `borderRadius`.',
            'Числа — це розміри без одиниць (px у вебі, dp у React Native). Рядки з одиницями ('+"'20px'"+') у React Native недопустимі.',
            'Об’єднання стилів: на вебі `{ ...base, ...extra }`, у React Native — масив `[base, extra]`.',
            '**Відмінності веб ↔ React Native:** `flexDirection` за замовчуванням `column` (а не `row`), `display: \'flex\'` усюди, немає каскаду і наслідування (окрім вкладених `Text`), немає `border: \'1px solid\'`.',
          ]}
        />
      </Section>

      <Section title="Інтерактивна пісочниця Flexbox">
        <P>{'Міняй параметри й спостерігай. Звертай увагу на код під блоком: саме такий об’єкт ти писатимеш.'}</P>
        <Demo>
          <FlexPlayground />
        </Demo>
      </Section>

      <Section title="Приклад з реального життя: три типові розкладки">
        <P>
          {'Центрування, екран «шапка — контент — таб-бар» (контент має `flex: 1`) та рядок списку з аватаром, текстом і стрілкою. Подивись, як у кожного елемента лише кілька властивостей.'}
        </P>
        <Demo>
          <Layouts />
        </Demo>
        <CodeBlock code={layoutsSource} />
      </Section>

      <Section title="Знайди помилку">
        <P>{'Шість помилок зі стилями й flexbox.'}</P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <Bullets
          items={[
            'Відкрий `src/lessons/12-styles/Task.jsx`: зверстай екран профілю лише на style-об’єктах та flexbox.',
            'Це практика, найближча до реальних екранів React Native.',
          ]}
        />
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Закріплення: тест">
        <P>{'11 питань про стилі та Flexbox.'}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
