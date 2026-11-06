import { StackNavigator } from '../MiniNav.jsx'
import { useNavigation, useRoute } from '../navCore.js'

function Home() {
  const navigation = useNavigation()
  return <button onClick={() => navigation.navigate('Profile')}>Відкрити профіль</button>
}

function Profile() {
  const { params } = useRoute()
  return <p>Користувач №{params.userId}</p>
}

export default function MissingParams() {
  return (
    <div style={{ height: 160, border: '1px solid #888' }}>
      <StackNavigator
        initialRoute="Home"
        screens={{
          Home: { component: Home, title: 'Головна' },
          Profile: { component: Profile, title: 'Профіль' },
        }}
      />
    </div>
  )
}
