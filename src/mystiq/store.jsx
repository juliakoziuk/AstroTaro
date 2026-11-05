import { useCallback, useEffect, useReducer, useState } from 'react'
import { MystiqContext } from './storeCore.js'
import { api, msgFromApi, msgToApi } from './api.js'
import { useAuth } from './authCore.js'

const GREETING = {
  id: 'greeting',
  role: 'ai',
  text: 'Я тут, щоб допомогти тобі придивитись до власних образів і думок. Я не передбачаю майбутнє, лише ставлю запитання й помічаю повторення. З чого почнемо?',
}

// Стан — це копія даних сервера. Додавання йде через API, і в стан потрапляє
// те, що повернув сервер (зі справжнім id), тому reducer лишається простим.
function reducer(state, action) {
  switch (action.type) {
    case 'loaded':
      return action.state
    case 'dream_added':
      return { ...state, dreams: [action.dream, ...state.dreams] }
    case 'journal_added':
      return { ...state, journal: [action.entry, ...state.journal] }
    case 'spread_added':
      return { ...state, spreads: [action.spread, ...state.spreads] }
    case 'message_added':
      return { ...state, messages: [...state.messages, action.message] }
    case 'consent_changed':
      return { ...state, consent: { ...state.consent, [action.key]: action.value } }
    default:
      throw new Error('Невідома дія: ' + action.type)
  }
}

const EMPTY = { dreams: [], journal: [], spreads: [], messages: [GREETING], consent: { dreams: false, journal: false, spreads: false } }

// Прибираємо поля, які клієнт генерує сам (id) — їх призначає сервер
const strip = (obj) => Object.fromEntries(Object.entries(obj).filter(([k]) => k !== 'id'))

export function MystiqProvider({ children }) {
  const { user, setConsent } = useAuth()
  const [state, rawDispatch] = useReducer(reducer, EMPTY)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let alive = true
    Promise.all([api.get('/dreams'), api.get('/journal'), api.get('/spreads'), api.get('/messages')])
      .then(([dreams, journal, spreads, messages]) => {
        if (!alive) return
        rawDispatch({
          type: 'loaded',
          state: {
            dreams,
            journal,
            spreads,
            messages: [GREETING, ...messages.map(msgFromApi)],
            consent: user.consent,
          },
        })
        setReady(true)
      })
      .catch((e) => alive && setError(e.message))
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- дані перезавантажуємо лише при зміні користувача
  }, [user.id])

  const dispatch = useCallback(
    async (action) => {
      try {
        switch (action.type) {
          case 'dream_added':
            rawDispatch({ type: action.type, dream: await api.post('/dreams', strip(action.dream)) })
            break
          case 'journal_added':
            rawDispatch({ type: action.type, entry: await api.post('/journal', strip(action.entry)) })
            break
          case 'spread_added':
            rawDispatch({ type: action.type, spread: await api.post('/spreads', strip(action.spread)) })
            break
          case 'message_added':
            rawDispatch({ type: action.type, message: msgFromApi(await api.post('/messages', msgToApi(action.message))) })
            break
          case 'consent_changed':
            // Перемикач оновлюємо одразу, а при помилці повертаємо назад
            rawDispatch(action)
            try {
              await setConsent({ [action.key]: action.value })
            } catch (e) {
              rawDispatch({ ...action, value: !action.value })
              throw e
            }
            break
          default:
            rawDispatch(action)
        }
        setError(null)
      } catch (e) {
        setError(e.message)
      }
    },
    [setConsent],
  )

  if (!ready && !error) return <p className="mq-loading">Завантаження…</p>

  return <MystiqContext value={{ ...state, dispatch, error, clearError: () => setError(null) }}>{children}</MystiqContext>
}
