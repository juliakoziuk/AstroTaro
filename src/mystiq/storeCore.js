import { createContext, useContext } from 'react'

export const MystiqContext = createContext(null)

export function useMystiq() {
  const ctx = useContext(MystiqContext)
  if (!ctx) throw new Error('useMystiq потрібно викликати всередині <MystiqProvider>')
  return ctx
}
