import { StackNavigator } from './MiniNav.jsx'
import { useNavigation, useRoute } from './navCore.js'

// ЗАВДАННЯ: міні-застосунок «Блог» на мініатюрному навігаторі.
// Пиши прямо в цьому файлі, результат одразу видно на сторінці уроку.
//
// TODO 1. HomeScreen: список із 3 статей (ARTICLES). Тап → navigation.navigate('Article', { id }).
// TODO 2. ArticleScreen: читає id з route.params, показує заголовок і текст статті.
//         Заголовок у шапці задай функцією title: (params) => …
// TODO 3. У ArticleScreen кнопка «Наступна стаття»: navigate('Article', { id: наступний }).
//         Стек росте — подивись на рядок «стек» під екраном.
// TODO 4. Кнопка «На головну» викликає navigation.popToTop().
// TODO 5. Захист: якщо статті з таким id немає (params.id === 99), покажи «Статтю не знайдено»
//         замість помилки.
// БОНУС. Додай третій екран Settings з перемикачем «Темна тема» (useState) і кнопкою в шапці/на головній.
//        Подумай: де має жити стан теми, щоб його бачили всі екрани? (підказка: урок 8)

const ARTICLES = [
  { id: 1, title: 'Що таке React', text: 'Бібліотека для створення інтерфейсів.' },
  { id: 2, title: 'Що таке хуки', text: 'Функції, що підключають можливості React.' },
  { id: 3, title: 'Що таке React Native', text: 'React для мобільних застосунків.' },
]

function HomeScreen() {
  const navigation = useNavigation()
  return (
    <div>
      <p>Статей: {ARTICLES.length}</p>
      <button onClick={() => navigation.navigate('Article', { id: 1 })}>Відкрити першу (дороби список)</button>
    </div>
  )
}

function ArticleScreen() {
  const { params } = useRoute()
  return <p>Стаття id = {params.id} (дороби мене)</p>
}

export default function BlogTask() {
  return (
    <div style={{ height: 240, border: '1px solid #888', borderRadius: 8, overflow: 'hidden' }}>
      <StackNavigator
        initialRoute="Home"
        screens={{
          Home: { component: HomeScreen, title: 'Блог' },
          Article: { component: ArticleScreen, title: 'Стаття' },
        }}
      />
    </div>
  )
}
