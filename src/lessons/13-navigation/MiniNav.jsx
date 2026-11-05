import { useMemo, useState } from 'react'
import { NavigationContext, RouteContext } from './navCore.js'

// Міні-навігатор: «стек екранів» на useState + Context.
// У справжньому React Navigation ті самі ідеї: navigate / goBack / route.params.
//
// screens: { Home: { component: HomeScreen, title: 'Каталог' }, Details: { component, title: (params) => '…' } }

export function StackNavigator({ screens, initialRoute }) {
  const [stack, setStack] = useState([{ key: 1, name: initialRoute, params: undefined }])

  const navigation = useMemo(
    () => ({
      navigate: (name, params) =>
        setStack((s) => [...s, { key: s[s.length - 1].key + 1, name, params }]),
      goBack: () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s)),
      popToTop: () => setStack((s) => s.slice(0, 1)),
      canGoBack: stack.length > 1,
      stack: stack.map((r) => r.name),
    }),
    [stack],
  )

  const route = stack[stack.length - 1]
  const config = screens[route.name]
  const Screen = config.component
  const title = typeof config.title === 'function' ? config.title(route.params) : config.title

  return (
    <NavigationContext value={navigation}>
      <RouteContext value={route}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 12px',
              background: '#6d4aff',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            {navigation.canGoBack && (
              <button onClick={navigation.goBack} style={{ background: 'transparent', color: '#fff', border: 0, cursor: 'pointer', fontSize: 16 }}>
                ‹ Назад
              </button>
            )}
            <span>{title}</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 12, color: '#222', background: '#fff' }}>
            <Screen />
          </div>
          <div style={{ fontSize: 11, padding: '4px 10px', background: '#f1efff', color: '#555' }}>
            стек: {navigation.stack.join(' › ')}
          </div>
        </div>
      </RouteContext>
    </NavigationContext>
  )
}

// Нижні вкладки. Усі вкладки лишаються змонтованими (як у React Navigation) — ховаємо неактивні,
// тому стан кожної вкладки (наприклад, її стек) зберігається при перемиканні.
export function TabNavigator({ tabs }) {
  const [active, setActive] = useState(tabs[0].name)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        {tabs.map((tab) => (
          <div key={tab.name} style={{ display: tab.name === active ? 'block' : 'none', height: '100%' }}>
            <tab.component />
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', borderTop: '1px solid #ddd', background: '#fff' }}>
        {tabs.map((tab) => (
          <button
            key={tab.name}
            onClick={() => setActive(tab.name)}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 0,
              background: 'transparent',
              cursor: 'pointer',
              color: tab.name === active ? '#6d4aff' : '#888',
              fontWeight: tab.name === active ? 700 : 400,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}
