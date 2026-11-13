import { useCallback, useEffect, useRef, useState } from 'react'
import { useLang } from '../i18n/index.js'
import { go } from './router.js'
import { say } from './toast.js'

/**
 * Дані екрана й те, що потрібне його вікнам. `load` — стабільна функція (оголошена поза компонентом), що повертає дані;
 * дані перезавантажуються при зміні мови (сервер віддає їх мовою інтерфейсу). `ctx` має ту саму форму, що й раніше мали
 * екрани-плити: data, modal, go, reload, say, fail, openModal, closeModal, run, patchData, тож вікна (профіль, сон, звіти) спільні.
 */
export function usePage(load) {
  const lang = useLang()
  const [state, setState] = useState({ status: 'loading', data: null, error: '' })
  const [modal, setModal] = useState(null)
  const alive = useRef(true)
  const busy = useRef(false)

  const reload = useCallback(
    () =>
      load({ go }).then(
        (data) => alive.current && setState({ status: 'ok', data, error: '' }),
        (e) => alive.current && setState((s) => ({ ...s, status: 'error', error: e.message })),
      ),
    [load],
  )

  useEffect(() => {
    alive.current = true
    reload()
    return () => {
      alive.current = false
    }
  }, [reload, lang])

  const ctx = {
    data: state.data,
    modal,
    go,
    reload,
    say,
    fail: (e) => say(e.message),
    openModal: setModal,
    closeModal: () => setModal(null),
    patchData: (fn) => setState((s) => ({ ...s, data: fn(s.data) })),
    run: async (fn) => {
      if (busy.current) return
      busy.current = true
      try {
        await fn()
      } catch (e) {
        say(e.message)
      } finally {
        busy.current = false
      }
    },
  }
  return { ...state, ctx }
}

/** Рядок помилки завантаження з кнопкою «Спробувати ще раз» (спільний для екранів). */
export const loadFailed = (state, ctx) =>
  state.status === 'error' && !state.data ? { message: state.error, retry: ctx.reload } : null
