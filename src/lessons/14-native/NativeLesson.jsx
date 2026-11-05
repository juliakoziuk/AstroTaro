import { Section, P, Bullets, Rules, CodeBlock, Demo, PhoneFrame, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import CounterWeb from './CounterWeb.jsx'
import webSource from './CounterWeb.jsx?raw'
import CounterNative from './CounterNative.jsx'
import nativeSource from './CounterNative.jsx?raw'
import NativeTasksApp from './NativeTasksApp.jsx'
import tasksSource from './NativeTasksApp.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'TextOutsideText',
      title: 'текст без <Text>',
      phone: 140,
      answer:
        'У React Native текст дозволений **лише** всередині `<Text>`. `View` — це контейнер, а не «текстовий» елемент, тому справжній RN кидає помилку «Text strings must be rendered within a <Text> component». Обгорни рядок у `<Text>`.',
      fixedCode: `
<View>
  <Text>Привіт, світе!</Text>
</View>`,
    },
    {
      file: 'OnClickNotPress',
      title: 'onClick замість onPress',
      phone: 220,
      tryIt: 'Натисни кнопку кілька разів.',
      answer:
        'У React Native немає миші, тому події `onClick` не існує — проп мовчки ігнорується. Використовуй `onPress` (а ще `onLongPress`, `onPressIn`, `onPressOut`).',
      fixedCode: `<Pressable onPress={() => setCount(count + 1)} …>`,
    },
    {
      file: 'PxStrings',
      title: 'розміри з «px»',
      phone: 140,
      answer:
        'У React Native розміри — це **числа** (щільнісно-незалежні пікселі, dp) або відсотки у рядку (`\'50%\'`). Рядок `\'20px\'` — це CSS, у RN недопустимий (справжній RN ігнорує такий стиль або показує помилку; наш симулятор показує помилку). Пиши `fontSize: 20`.',
      fixedCode: `<Text style={{ fontSize: 20 }}>Великий текст</Text>`,
    },
    {
      file: 'DefaultColumn',
      title: 'два Text мали стояти поруч',
      phone: 140,
      answer:
        'У React Native `flexDirection` за замовчуванням — `column`, тож діти йдуть зверху вниз. (У вебі за замовчуванням `row`.) Щоб поруч — задай `flexDirection: \'row\'` контейнеру (і `gap` для відступу).',
      fixedCode: `
<View style={{ flexDirection: 'row', gap: 12, padding: 16 }}>
  <Text>Ліворуч</Text>
  <Text>Праворуч</Text>
</View>`,
    },
    {
      file: 'OnChangeEvent',
      title: 'e.target.value у TextInput',
      phone: 200,
      tryIt: 'Спробуй щось надрукувати в полі.',
      answer:
        'У React Native подія `onChange` не має `e.target.value` (там нативний елемент, не DOM). Текст лежить у `e.nativeEvent.text`. Зручніший варіант — `onChangeText`, який одразу віддає рядок.',
      fixedCode: `<TextInput value={name} onChangeText={setName} … />`,
    },
    {
      file: 'ImageNoSize',
      title: 'картинка без розміру',
      phone: 200,
      answer:
        'Для віддалених зображень (`{ uri }`) React Native не знає розміру заздалегідь і робить їх 0×0 — вони «невидимі». Задай `width` і `height` у `style`.',
      fixedCode: `<Image source={{ uri: '…' }} style={{ width: 64, height: 64 }} />`,
    },
    {
      file: 'WebOnlyApis',
      title: 'веб-API та HTML-теги в RN',
      compileError:
        'Код з веб-тегами не запускаємо: у справжньому RN він не працює. **Що буде:** `div`, `h1`, `button` не існують як вбудовані компоненти (помилка), а `localStorage`, `window`, `document`, `alert` відсутні в середовищі (ReferenceError чи інша поведінка).',
      answer:
        'React Native — не браузер: немає DOM, CSS, `window`, `document`, `localStorage`. Заміни: `div` → `View`, текст → `Text`, `button` → `Pressable`/`Button`, `onClick` → `onPress`, CSS → `StyleSheet`, `localStorage` → `AsyncStorage`, `alert` → `Alert.alert(...)`, `window.innerWidth` → `useWindowDimensions()`.',
      fixedCode: `
import { View, Text, Pressable, Alert, useWindowDimensions } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'

const { width } = useWindowDimensions()
const saved = await AsyncStorage.getItem('name') // асинхронно!

<View>
  <Text>{saved}</Text>
  <Pressable onPress={() => Alert.alert('Привіт')}><Text>Hi</Text></Pressable>
</View>`,
    },
  ],
  comps,
  raws,
  causes.native,
)

export default function NativeLesson() {
  return (
    <>
      <h1>14. Від React до React Native</h1>

      <Section title="Що це таке">
        <P>
          {'**React Native** — це React, який малює не HTML у браузері, а **справжні нативні елементи** iOS та Android. Ти пишеш JavaScript, компоненти, хуки, state — усе, що вже вивчив. Змінюються лише «цеглинки» інтерфейсу, стилі та доступ до можливостей телефона.'}
        </P>
        <Bullets
          items={[
            '**Не змінюється:** JSX, компоненти, props, children, `useState`, `useEffect`, `useRef`, `useContext`, `useReducer`, власні хуки, `fetch`, `async/await`, списки з `key`, умовний рендер.',
            '**Змінюється:** замість HTML-тегів — `View`, `Text`, `Image`…; замість CSS — `StyleSheet`; замість `onClick` — `onPress`; замість `localStorage` — `AsyncStorage`; замість React Router — React Navigation.',
            '**Немає:** DOM, `window`, `document`, CSS-файлів і каскаду, `div`/`span`/`input`.',
            '**Як запускати:** найпростіше через **Expo** — створюєш проект однією командою й відкриваєш його на телефоні в додатку Expo Go.',
          ]}
        />
        <Rules
          head={['Веб (React DOM)', 'React Native', 'Примітка']}
          rows={[
            ['`div`', '`View`', 'flex-контейнер, за замовчуванням колонка'],
            ['`p`, `span`, `h1`…', '`Text`', 'увесь текст — лише в `Text`'],
            ['`button`', '`Pressable` (`Button`)', 'проп `onPress`, а не `onClick`'],
            ['`input`', '`TextInput`', '`onChangeText`, `value`, `placeholder`'],
            ['`img`', '`Image`', 'для `uri` задай `width` і `height`'],
            ['`ul` + `map`', '`FlatList`', '`data`, `renderItem`, `keyExtractor`'],
            ['`div` з `overflow: auto`', '`ScrollView`', 'прокрутка'],
            ['`input type="checkbox"`', '`Switch`', '`value`, `onValueChange`'],
            ['CSS / `className`', '`StyleSheet.create` + `style`', 'числа без `px`, camelCase, масиви для комбінацій'],
            ['`localStorage`', '`AsyncStorage`', 'асинхронне сховище'],
            ['`window.alert`', '`Alert.alert`', ''],
            ['React Router', 'React Navigation / Expo Router', 'див. урок 13'],
          ]}
        />
      </Section>

      <Section title="Один і той самий лічильник: веб і React Native">
        <P>
          {'Логіка (`useState`, функція оновлення) однакова. Порівняй розмітку, подію й стилі. Праворуч — симулятор «телефона» з нашим навчальним `react-native` (імпорт у файлі виглядає так само, як у справжньому проекті).'}
        </P>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'flex-start' }}>
          <div>
            <Demo title="Веб">
              <CounterWeb />
            </Demo>
            <CodeBlock code={webSource} />
          </div>
          <div>
            <PhoneFrame height={220}>
              <CounterNative />
            </PhoneFrame>
            <CodeBlock code={nativeSource} />
          </div>
        </div>
        <P>
          {'⚠️ Це **симулятор у браузері**: він показує правила RN (текст лише в `Text`, `onPress`, числові стилі, `FlatList`), але справжній застосунок запускається в Expo на телефоні чи емуляторі.'}
        </P>
      </Section>

      <Section title="Приклад з реального життя: екран «Задачі» у стилі React Native">
        <P>
          {'Поле вводу, кнопка, перемикач, `FlatList` із `keyExtractor`, порожній стан, `Pressable` зі зміною вигляду при натисканні. Подивись, як це схоже на веб-версію зі списком задач з уроку 4.'}
        </P>
        <PhoneFrame height={470}>
          <NativeTasksApp />
        </PhoneFrame>
        <CodeBlock code={tasksSource} />
      </Section>

      <Section title="Знайди помилку (типові помилки при переході на RN)">
        <P>{'Сім типових помилок. Симулятор поводиться як справжній RN там, де це можливо.'}</P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <Bullets
          items={[
            'Відкрий `src/lessons/14-native/Task.jsx`: перенеси веб-картку товару в React Native-версію.',
            'Праворуч видно результат у «телефоні», ліворуч — веб-еталон.',
          ]}
        />
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Твій перший справжній проект на React Native">
        <P>{'Тобі знадобиться Node.js (він у тебе вже є, бо працює Vite) і телефон із додатком **Expo Go** (App Store / Google Play). Команди виконуються в терміналі:'}</P>
        <CodeBlock
          code={`
# 1. створити проект
npx create-expo-app@latest my-first-app
cd my-first-app

# 2. запустити; відскануй QR-код додатком Expo Go
npx expo start

# 3. навігація (якщо проект без Expo Router)
npx expo install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context

# 4. сховище на пристрої
npx expo install @react-native-async-storage/async-storage`}
        />
        <Bullets
          items={[
            '**Крок 1.** Створи проект і переконайся, що «Hello» з’являється на телефоні.',
            '**Крок 2.** Перенеси компоненти з цього курсу: лічильник, список задач, форму (замінюючи `div`/`button`/`onClick`).',
            '**Крок 3.** Додай навігацію (React Navigation або Expo Router): список → деталі з параметрами.',
            '**Крок 4.** Збережи дані в `AsyncStorage` і завантаж їх через `useEffect`.',
            '**Крок 5.** Підключи API (`fetch`) зі станами loading / error.',
            '**Далі:** TypeScript, анімації (Reanimated), форми (React Hook Form), TanStack Query, публікація через EAS Build.',
          ]}
        />
        <P>{'Рекомендована документація: reactnative.dev (офіційна) та docs.expo.dev. Спочатку — розділ «Core Components» і «Handling Touches».'}</P>
      </Section>

      <Section title="Закріплення: тест">
        <P>{`${quiz.length} питань про відмінності React Native.`}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
