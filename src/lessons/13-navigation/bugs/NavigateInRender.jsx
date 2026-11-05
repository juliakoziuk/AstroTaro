import { StackNavigator } from '../MiniNav.jsx'
import { useNavigation } from '../navCore.js'

function Splash() {
  const navigation = useNavigation()
  // «автоматичний перехід» прямо під час рендера
  navigation.navigate('Home')
  return <p>Завантаження…</p>
}

function Home() {
  return <p>Головний екран</p>
}

export default function NavigateInRender() {
  return (
    <div style={{ height: 130, border: '1px solid #888' }}>
      <StackNavigator
        initialRoute="Splash"
        screens={{
          Splash: { component: Splash, title: 'Splash' },
          Home: { component: Home, title: 'Головна' },
        }}
      />
    </div>
  )
}
