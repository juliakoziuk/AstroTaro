import { Section, P, Bullets, Rules, CodeBlock, Demo, Bug, Quiz } from '../ui.jsx'
import { pickBugs } from '../kit.js'
import { causes } from '../causes.js'
import quiz from './quiz.js'
import ShopApp from './ShopApp.jsx'
import shopSource from './ShopApp.jsx?raw'
import miniNavSource from './MiniNav.jsx?raw'
import Task from './Task.jsx'

const comps = import.meta.glob('./bugs/*.jsx', { eager: true, import: 'default' })
const raws = import.meta.glob('./bugs/*.{jsx,txt}', { eager: true, query: '?raw', import: 'default' })

const bugs = pickBugs(
  [
    {
      file: 'MutateStack',
      title: 'змінюємо стек напряму',
      tryIt: 'Натисни «Перейти на Details».',
      answer:
        '`stack.push(...)` мутує масив, а `setStack(stack)` передає те саме посилання — React не бачить змін, екран не перемикається. Навігатор — це звичайний state: оновлюй його імутабельно: `setStack([...stack, name])`.',
      fixedCode: `
function go(name) {
  setStack([...stack, name])
}`,
    },
    {
      file: 'MissingParams',
      title: 'перейшли без params, а екран їх очікує',
      tryIt: 'Натисни «Відкрити профіль».',
      answer:
        '`navigate(\'Profile\')` без другого аргументу → `route.params` дорівнює `undefined` → `params.userId` падає. Передай params (`navigate(\'Profile\', { userId: 5 })`) і/або захищайся на екрані: `route.params?.userId ?? \'—\'`.',
      fixedCode: `
navigation.navigate('Profile', { userId: 5 })

// екран:
const { params } = useRoute()
const userId = params?.userId`,
    },
    {
      file: 'NavigateInRender',
      title: 'навігація під час рендера',
      tryIt: 'Відкрий консоль (F12): подивись на попередження React.',
      answer:
        '`navigation.navigate(...)` змінює state навігатора, а викликається під час рендера іншого компонента — React попереджає: «Cannot update a component while rendering a different component». Автоматичні переходи роби в `useEffect` (або в обробнику події).',
      fixedCode: `
useEffect(() => {
  navigation.navigate('Home')
}, [navigation])`,
    },
    {
      file: 'BackAtRoot',
      title: '«Назад» на кореневому екрані',
      tryIt: 'Натисни «Назад» на головному екрані.',
      answer:
        '`s.slice(0, -1)` прибрав єдиний екран, стек став порожнім, а `stack[stack.length - 1]` — `undefined`, тому `screens[undefined]` падає. Перед видаленням перевіряй, що в стеку більше одного екрана (так і зробив наш `StackNavigator`).',
      fixedCode: `
const goBack = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))`,
    },
  ],
  comps,
  raws,
  causes.navigation,
)

export default function NavigationLesson() {
  return (
    <>
      <h1>13. Навігація між екранами</h1>

      <Section title="Що це таке">
        <P>
          {'Мобільний застосунок складається з **екранів** (screens). Переходи між ними організовує **навігатор**. Найпоширеніша модель — **стек**: `navigate` кладе новий екран зверху, `goBack` знімає верхній (і ти бачиш попередній). Також є **вкладки** (tabs) та бічне меню (drawer).'}
        </P>
        <P>
          {'У React Native для цього використовують **React Navigation** (або **Expo Router**). Ми не встановлюємо її тут, а **створимо мініатюрну копію** з тими самими поняттями на `useState` + Context — щоб ти розумів, що відбувається «під капотом».'}
        </P>
        <Rules
          head={['Поняття', 'React Navigation', 'У нашому міні-навігаторі']}
          rows={[
            ['Контейнер/навігатор', '`NavigationContainer`, `createNativeStackNavigator()`', '`<StackNavigator />`'],
            ['Опис екрана', '`<Stack.Screen name="Details" component={Details} />`', 'об’єкт `screens`'],
            ['Перейти', '`navigation.navigate(\'Details\', { id })`', 'те саме'],
            ['Назад', '`navigation.goBack()`', 'те саме'],
            ['Параметри екрана', '`route.params` / `useRoute()`', 'те саме'],
            ['Доступ до навігації', '`useNavigation()`', 'те саме (на Context)'],
            ['Вкладки', '`createBottomTabNavigator()`', '`<TabNavigator />`'],
          ]}
        />
        <Bullets
          items={[
            'Екран — це **звичайний компонент**, який навігатор показує, коли той активний.',
            'Параметри — це «props екрана»: передавай мінімум (id), а дані бери зі спільного state / з API.',
            'Не викликай `navigate` під час рендера — лише в обробнику події або `useEffect`.',
            'Вкладки й стеки вкладають одне в одне: `Tab` → у кожній вкладці свій `Stack`.',
            'Після розмонтування екрана його `useState` втрачається — важливі дані тримай у Context чи сховищі.',
          ]}
        />
      </Section>

      <Section title="Приклад з реального життя: міні-магазин із вкладками та стеком">
        <P>
          {'Натисни товар → відкриється «Details» з параметром `id`. Кнопка «Далі» додає ще екран (дивись рядок «стек» внизу). Перемкнись на «Профіль» і повернись: стек каталогу збережеться.'}
        </P>
        <Demo>
          <ShopApp />
        </Demo>
        <CodeBlock code={shopSource} />
        <P>{'А ось сам міні-навігатор — менше 100 рядків:'}</P>
        <CodeBlock code={miniNavSource} />
      </Section>

      <Section title="Знайди помилку">
        <P>{'Чотири типові помилки з навігацією.'}</P>
        {bugs.map((b) => (
          <Bug key={b.file} {...b} />
        ))}
      </Section>

      <Section title="Твоє завдання">
        <Bullets
          items={[
            'Відкрий `src/lessons/13-navigation/Task.jsx`: міні-блог зі списком і сторінкою статті з параметрами.',
            'Бонус: екран налаштувань і спільна тема через Context.',
          ]}
        />
        <Demo title="Твоє завдання — результат">
          <Task />
        </Demo>
      </Section>

      <Section title="Закріплення: тест">
        <P>{'10 питань про навігацію.'}</P>
        <Quiz questions={quiz} />
      </Section>
    </>
  )
}
