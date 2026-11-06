import { createContext, useContext } from 'react'

// Контексти та хуки міні-навігатора. Назви повторюють React Navigation (useNavigation, useRoute).
export const NavigationContext = createContext(null)
export const RouteContext = createContext(null)

export function useNavigation() {
  const navigation = useContext(NavigationContext)
  if (!navigation) throw new Error('useNavigation потрібно викликати всередині екрана навігатора')
  return navigation
}

export function useRoute() {
  const route = useContext(RouteContext)
  if (!route) throw new Error('useRoute потрібно викликати всередині екрана навігатора')
  return route
}
