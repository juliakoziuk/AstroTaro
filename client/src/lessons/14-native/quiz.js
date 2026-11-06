// Тест до уроку «Від React до React Native».
const quiz = [
  {
    text: 'Що таке React Native?',
    options: [
      'Інша мова програмування',
      'Фреймворк, у якому ти пишеш інтерфейс на React (JS + компоненти + хуки), а він малюється нативними елементами iOS і Android, а не веб-сторінкою',
      'Веб-версія React для мобільних браузерів',
      'Бібліотека анімацій',
    ],
    correct: 1,
    explanation:
      'React описує, ЩО показати, а «рендерер» вирішує, ЯК. React DOM малює HTML-елементи, React Native — справжні нативні елементи (UIView на iOS, android.view.View на Android). Тому концепції React переносяться, а «цеглинки» інші.',
  },
  {
    text: 'Що з перерахованого у React Native працює так само, як у вебі?',
    options: [
      'Теги `div`, `span`, `button`',
      'JSX, компоненти, props, state, хуки (`useState`, `useEffect`…), Context, reducer, `fetch` — вся логіка',
      'CSS-файли та селектори',
      'Об’єкти `window` і `document`',
    ],
    correct: 1,
    explanation:
      'Усе, що ти вивчив у уроках 1–11, — це React і працює без змін. Відрізняється лише «вюшка»: компоненти інтерфейсу, стилі, події натискання, навігація та доступ до пристрою.',
  },
  {
    text: 'На які компоненти RN замінюють `div` і `p`/`span`?',
    options: [
      '`Box` і `Label`',
      '`View` (контейнер) і `Text` (будь-який текст)',
      '`Container` і `Paragraph`',
      '`Div` і `Span` (імпортуються з react-native)',
    ],
    correct: 1,
    explanation:
      '`View` — аналог `div` (flex-контейнер). `Text` — єдине місце, де можна виводити текст. Є ще `Image`, `ScrollView`, `FlatList`, `TextInput`, `Pressable`, `Switch`, `ActivityIndicator` та інші.',
  },
  {
    text: 'Що станеться, якщо написати `<View>Привіт</View>`?',
    options: [
      'Виведеться «Привіт»',
      'Помилка «Text strings must be rendered within a <Text> component»: текст у RN дозволений лише всередині `<Text>`',
      'Привіт буде жирним',
      'Нічого не відбудеться',
    ],
    correct: 1,
    explanation:
      'Це одна з найчастіших помилок новачків. Будь-який рядок чи число, які мають бути на екрані, обгортай у `<Text>`.',
  },
  {
    text: 'Як називається проп натискання для `Pressable` / `TouchableOpacity`?',
    options: ['`onClick`', '`onPress`', '`onTap`', '`onTouch`'],
    correct: 1,
    explanation:
      'У React Native немає миші, тому `onClick` не існує — використовується `onPress` (а також `onLongPress`, `onPressIn`, `onPressOut`).',
  },
  {
    text: 'Як стилізують компоненти в React Native?',
    options: [
      'CSS-файлами з класами',
      'JS-об’єктами у пропі `style`, зазвичай зібраними через `StyleSheet.create({…})`; без селекторів, каскаду та одиниць виміру (px)',
      'Тільки inline-рядками (`style="…"`)',
      'Через HTML-атрибути',
    ],
    correct: 1,
    explanation:
      'Стилі — це об’єкти з camelCase-ключами й числовими розмірами (dp). `StyleSheet.create` робить код чистішим і валідує стилі. Для кількох стилів — масив: `style={[a, b]}`.',
  },
  {
    text: 'Яке значення `flexDirection` за замовчуванням у React Native?',
    options: ['`row`', '`column`', '`row-reverse`', 'Немає значення'],
    correct: 1,
    explanation:
      'У RN усі `View` — flex-контейнери з напрямом `column` (зверху вниз). Хочеш поруч — `flexDirection: \'row\'`.',
  },
  {
    text: 'Чому `<Image source={{ uri: \'…\' }} />` без `width`/`height` нічого не показує?',
    options: [
      'Бо `Image` потребує `key`',
      'Для віддалених картинок RN не знає розміру заздалегідь, тому за замовчуванням він 0×0: розмір треба задати вручну',
      'Бо потрібен `alt`',
      'Бо картинки підтримуються лише у вебі',
    ],
    correct: 1,
    explanation:
      'Для локальних картинок (`require`/`import`) розмір відомий, а для `uri` — ні. Вказуй `style={{ width: 64, height: 64 }}` (або `aspectRatio` + `width`).',
  },
  {
    text: 'Який компонент слід використовувати для довгих списків у RN?',
    options: [
      '`ul` з `.map()`',
      '`FlatList` (віртуалізований: малює лише видимі елементи); для коротких списків можна `ScrollView` + `.map()`',
      '`Table`',
      '`Grid`',
    ],
    correct: 1,
    explanation:
      'Телефон має обмежену пам’ять. `FlatList` створює лише елементи, що видно на екрані, і перевикористовує їх при прокрутці. Потребує `data`, `renderItem` і `keyExtractor` (аналог `key`).',
  },
  {
    text: 'Як правильно читати текст з `TextInput`?',
    options: [
      '`onChange={(e) => setText(e.target.value)}`',
      '`onChangeText={setText}` (отримує рядок) або `onChange={(e) => setText(e.nativeEvent.text)}`',
      '`onInput={…}`',
      '`onKeyPress` лише',
    ],
    correct: 1,
    explanation:
      'У RN подія не має `e.target.value`; текст лежить у `e.nativeEvent.text`, а для зручності є `onChangeText`, який одразу дає рядок.',
  },
  {
    text: 'Чим замінюють `localStorage` у React Native?',
    options: [
      'Він працює так само',
      'Сховищем на пристрої: `AsyncStorage` (`@react-native-async-storage/async-storage`), `expo-secure-store` для секретів або SQLite/MMKV',
      '`sessionStorage`',
      'Cookies',
    ],
    correct: 1,
    explanation:
      'В RN немає браузера, тому немає `window`, `document`, `localStorage`. Замість них — бібліотеки для платформи. Зверни увагу: `AsyncStorage` асинхронний (`await`).',
  },
  {
    text: 'Що таке Expo?',
    options: [
      'Альтернатива React',
      'Набір інструментів і сервісів навколо React Native: швидкий старт проекту (`create-expo-app`), запуск на телефоні через Expo Go, готові модулі (камера, файли, сповіщення), збірка',
      'Редактор коду',
      'Тестова бібліотека',
    ],
    correct: 1,
    explanation:
      'Expo — рекомендований спосіб почати: не потрібно налаштовувати Xcode/Android Studio для першого запуску. Достатньо `npx create-expo-app@latest`, `npx expo start` і додатку Expo Go на телефоні.',
  },
  {
    text: 'Що з цього стане проблемою при перенесенні вебкоду на React Native?',
    options: [
      'Хуки',
      'Використання `div`, `className`, CSS-файлів, `onClick`, `window`/`document` і HTML-тегів',
      'Компоненти й props',
      'Контекст',
    ],
    correct: 1,
    explanation:
      'Усе «DOM-специфічне» треба переписати: розмітку на `View`/`Text`, стилі на `StyleSheet`, події на `onPress`, доступ до браузерних API на бібліотеки для пристрою.',
  },
]

export default quiz
