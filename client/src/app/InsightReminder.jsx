import { useEffect } from 'react'
import { get, getToken } from '../lib/api.js'
import { say } from './toast.js'

// День, за який нагадування вже вирішено (показане тут або раніше): далі в цій вкладці запитів до API більше немає.
let settledDay = null
const dayOf = (now) => `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`

export default function InsightReminder({ route }) {
  useEffect(() => {
    if (!getToken() || route === '/login' || route === '/' || route === '/settings') return
    const day = dayOf(new Date())
    if (settledDay === day) return
    let live = true
    const remind = async () => {
      const settings = await get('/settings')
      if (!live || !settings.notifications || !settings.insights) return
      const user = await get('/auth/me')
      const key = `astrotarot.reminder.${user.id}`
      try { if (localStorage.getItem(key) === day) return void (settledDay = day) } catch { return }
      const dashboard = await get('/dashboard')
      if (!live) return
      settledDay = day
      if (!dashboard.insight) return
      try { localStorage.setItem(key, day) } catch { return }
      say(dashboard.insight)
    }
    remind().catch(() => {})
    return () => { live = false }
  }, [route])
  return null
}
