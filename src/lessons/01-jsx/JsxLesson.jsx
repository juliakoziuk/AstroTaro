import { Section, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { addChoices } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import ProductCard from './ProductCard.jsx'
import productCardSource from './ProductCard.jsx?raw'
import ProfileCardTask from './ProfileCardTask.jsx'

import ClassAttr from './bugs/ClassAttr.jsx'
import classAttrCode from './bugs/ClassAttr.jsx?raw'
import twoRootsCode from './bugs/TwoRoots.txt?raw'
import unclosedTagsCode from './bugs/UnclosedTags.txt?raw'
import StringStyle from './bugs/StringStyle.jsx'
import stringStyleCode from './bugs/StringStyle.jsx?raw'
import MissingBraces from './bugs/MissingBraces.jsx'
import missingBracesCode from './bugs/MissingBraces.jsx?raw'
import CommentText from './bugs/CommentText.jsx'
import commentTextCode from './bugs/CommentText.jsx?raw'
import ifInsideJsxCode from './bugs/IfInsideJsx.txt?raw'
import ZeroAnd from './bugs/ZeroAnd.jsx'
import zeroAndCode from './bugs/ZeroAnd.jsx?raw'
import ObjectAsChild from './bugs/ObjectAsChild.jsx'
import objectAsChildCode from './bugs/ObjectAsChild.jsx?raw'

const products = [
  {
    id: 1,
    name: 'Навушники Aura',
    price: 1890,
    oldPrice: 2490,
    inStock: true,
    imageUrl: '/favicon.svg',
    tags: ['bluetooth', 'шумоподавлення'],
  },
  {
    id: 2,
    name: 'Чохол для телефону',
    price: 350,
    oldPrice: 350,
    inStock: true,
    imageUrl: '/favicon.svg',
    tags: ['силікон'],
  },
  {
    id: 3,
    name: 'Павербанк 20000',
    price: 1200,
    oldPrice: 1500,
    inStock: false,
    imageUrl: '/favicon.svg',
    tags: ['usb-c', '20000 mAh'],
  },
]

const compiledExample = `
// Те, що ти пишеш:
<h1 className="title">Привіт, {name}!</h1>

// Те, що отримує браузер після збірки (Vite):
jsx("h1", { className: "title", children: ["Привіт, ", name, "!"] })
`

const bugs = [
  {
    number: 1,
    title: 'ця картка виглядає ніби нормально',
    code: classAttrCode,
    Live: ClassAttr,
    answer:
      'У JSX атрибути називаються так, як у DOM-API, а не як в HTML: className замість class і htmlFor замість for (class і for — зарезервовані слова JavaScript). Відкрий консоль браузера (F12): React скаржиться на обидва.',
    fixedCode: `
<div className="product">
  <label htmlFor="email">Email</label>
  <input id="email" type="email" />
</div>`,
  },
  {
    number: 2,
    title: 'два елементи в одному return',
    code: twoRootsCode,
    compileError:
      'Vite покаже червону помилку на весь екран: «Adjacent JSX elements must be wrapped in an enclosing tag».',
    answer:
      'Функція може повернути лише одне значення, а JSX — це вираз. Тому кореневий елемент має бути один. Якщо зайвий div не потрібен (наприклад, зламається верстка), використовуй фрагмент <>…</>: він нічого не додає в DOM.',
    fixedCode: `
function Header() {
  return (
    <>
      <h1>Мій магазин</h1>
      <p>Найкращі ціни</p>
    </>
  )
}`,
  },
  {
    number: 3,
    title: 'теги без закриття, як в HTML',
    code: unclosedTagsCode,
    compileError:
      'Vite покаже помилку розбору (на кшталт «Expected corresponding JSX closing tag for \'br\'»): теги <input> і <br> не закриті.',
    answer:
      'В HTML <input> і <br> можна не закривати, у JSX — ні. Кожен тег має бути закритий: або парою (<div></div>), або самозакритий із слешем (<input />).',
    fixedCode: `
<form>
  <input type="email" placeholder="Email" />
  <br />
  <button>Увійти</button>
</form>`,
  },
  {
    number: 4,
    title: 'style рядком, як в HTML',
    code: stringStyleCode,
    Live: StringStyle,
    answer:
      'У JSX style приймає об\'єкт, а не рядок. Властивості пишуться в camelCase (fontSize, а не font-size), числа без одиниць означають px. Дужки подвійні: зовнішні — «вираз JS», внутрішні — сам об\'єкт.',
    fixedCode: `
<p style={{ color: 'red', fontSize: 20 }}>Пароль занадто короткий</p>`,
  },
  {
    number: 5,
    title: 'дані не підставились',
    code: missingBracesCode,
    Live: MissingBraces,
    answer:
      'Лапки "…" — це звичайний рядок, тому src="{user.avatar}" шукає файл з назвою {user.avatar}. А в тексті без {} змінна — просто слово. Значення з JS підставляється тільки у фігурних дужках: src={user.avatar} і {user.name}. (width="40" — нормально, це справді рядок.)',
    fixedCode: `
<img src={user.avatar} alt="avatar" width="40" />
<p>Привіт, {user.name}!</p>`,
  },
  {
    number: 6,
    title: 'коментарі',
    code: commentTextCode,
    Live: CommentText,
    answer:
      'Усередині JSX // і /* */ — це просто текст, який React виводить на сторінку. Коментар у JSX — це JS-вираз у дужках: {/* ... */}. Поза JSX (над return, всередині функції) звичайні коментарі працюють як завжди.',
    fixedCode: `
<div>
  {/* Заголовок блоку новин */}
  <h3>Новини</h3>
  {/* тут буде список */}
</div>`,
  },
  {
    number: 7,
    title: 'if всередині {}',
    code: ifInsideJsxCode,
    compileError:
      'Vite покаже помилку розбору «Unexpected token» на слові if: у {} можна лише вираз, а if — інструкція.',
    answer:
      'У фігурних дужках можна писати лише вирази (те, що дає значення): змінні, виклики функцій, тернарний оператор, &&. if, for, while — інструкції, їх там не буде. Заміни на тернарний оператор або виконай if до return і поклади результат у змінну.',
    fixedCode: `
<p>Статус: {isOnline ? 'онлайн' : 'офлайн'}</p>

// або до return:
let statusText = 'офлайн'
if (isOnline) statusText = 'онлайн'
return <p>Статус: {statusText}</p>`,
  },
  {
    number: 8,
    title: 'кошик порожній, а на екрані нуль',
    code: zeroAndCode,
    Live: ZeroAnd,
    answer:
      'false, null і undefined React не малює, але число 0 малює. Вираз cart.items.length && … при довжині 0 повертає саме 0. Зроби умову справжнім boolean: length > 0 або !!length, або тернарний оператор з null.',
    fixedCode: `
{cart.items.length > 0 && <p>Товарів у кошику: {cart.items.length}</p>}

// або
{cart.items.length ? <p>…</p> : null}`,
  },
  {
    number: 9,
    title: 'вивели весь об\'єкт',
    code: objectAsChildCode,
    Live: ObjectAsChild,
    answer:
      'React вміє малювати рядки, числа та елементи (і масиви з них), але не звичайні об\'єкти. Виведи потрібні поля окремо: {order.id}, {order.status}. Якщо хочеш побачити весь об\'єкт для дебагу — {JSON.stringify(order)}.',
    fixedCode: `
<p>Замовлення №{order.id}: {order.status}</p>

// для дебагу:
<pre>{JSON.stringify(order, null, 2)}</pre>`,
  },
]

export default function JsxLesson() {
  return (
    <>
      <h1>1. JSX</h1>

      <Section title="Що це таке">
        <p className="lead">
          JSX — це синтаксис, який виглядає як HTML, але живе всередині JavaScript. Браузер його не розуміє: перед запуском
          збірка (у нашому проекті — Vite) перетворює кожен тег на виклик функції, що створює опис елемента.
        </p>
        <CodeBlock code={compiledExample} />
        <p>
          Звідси головне: <strong>JSX — це не HTML і не рядок, а JavaScript-вираз</strong>. Його можна покласти в змінну,
          передати у функцію або повернути з неї (саме це робить компонент). Усі «дивні» правила нижче випливають із цього.
        </p>

        <table className="rules">
          <thead>
            <tr>
              <th>Правило</th>
              <th>Приклад</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Один кореневий елемент (або фрагмент)</td>
              <td>
                <code>{'<>…</>'}</code>
              </td>
            </tr>
            <tr>
              <td>Усі теги закриті</td>
              <td>
                <code>{'<img />'}</code>, <code>{'<br />'}</code>
              </td>
            </tr>
            <tr>
              <td>Атрибути як у DOM-API, camelCase</td>
              <td>
                <code>className</code>, <code>htmlFor</code>, <code>onClick</code>, <code>tabIndex</code>
              </td>
            </tr>
            <tr>
              <td>Значення з JS — у фігурних дужках</td>
              <td>
                <code>{'src={url}'}</code>, <code>{'<p>{name}</p>'}</code>
              </td>
            </tr>
            <tr>
              <td>У {'{}'} лише вирази, не інструкції</td>
              <td>
                тернарний оператор і <code>&&</code> можна, <code>if</code> і <code>for</code> — ні
              </td>
            </tr>
            <tr>
              <td>style — об'єкт</td>
              <td>
                <code>{"style={{ fontSize: 20 }}"}</code>
              </td>
            </tr>
            <tr>
              <td>Компоненти з великої літери</td>
              <td>
                <code>{'<ProductCard />'}</code> — компонент, <code>{'<div />'}</code> — тег
              </td>
            </tr>
            <tr>
              <td>Коментар — теж у дужках</td>
              <td>
                <code>{'{/* ... */}'}</code>
              </td>
            </tr>
            <tr>
              <td>
                Не малюються: <code>false</code>, <code>null</code>, <code>undefined</code>. Малюється: <code>0</code>
              </td>
              <td>
                <code>{'{count > 0 && …}'}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </Section>

      <Section title="Приклад з реального життя: картка товару">
        <p>
          Типова фіча інтернет-магазину. Тут є майже все з таблиці: умовні бейдж і кнопка, ціна зі знижкою, прозорість
          залежно від наявності, label з input. Порівняй три картки з різними даними — той самий код малює їх по-різному.
        </p>
        <Demo>
          <div className="cards">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </Demo>
        <CodeBlock code={productCardSource} />
        <p>
          Зверни увагу: <code>discount</code> і <code>hasDiscount</code> — звичайні змінні <em>до</em> return, а в JSX
          лише використовуються. Складну логіку краще виносити туди, а не писати всередині розмітки.
        </p>
      </Section>

      <Section title="Знайди помилку">
        <p>
          Дев'ять прикладів, які ламаються в JSX найчастіше. Для кожного: подивись код та результат, спробуй сама
          сформулювати, що не так, і лише потім відкрий відповідь. Проводь експерименти: файли лежать у{' '}
          <code>src/lessons/01-jsx/bugs/</code> — виправляй їх і дивись, що зміниться.
        </p>
        {addChoices(bugs, causes.jsx).map((b) => (
          <Bug key={b.number} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <p>
          Відкрий файл <code>src/lessons/01-jsx/ProfileCardTask.jsx</code>. У коментарях на початку — вісім пунктів і
          бонус. Результат перемальовується одразу після збереження файлу.
        </p>
        <Demo title="Твоє завдання — результат">
          <ProfileCardTask />
        </Demo>
        <p>Закінчиш — покажи мені код, переглянемо разом і розберемо, що можна зробити краще.</p>
      </Section>

      <Section title="Закріплення: тест">
        <p>
          13 питань. Обери відповідь — одразу побачиш, правильна вона чи ні, і прочитаєш пояснення. Відповідь змінити
          не можна, тож спершу подумай. Питання можна пройти ще раз кнопкою внизу.
        </p>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
