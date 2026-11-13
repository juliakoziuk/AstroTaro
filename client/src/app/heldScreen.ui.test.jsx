import { beforeEach, describe, expect, test, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

// plate.js підмінено: самі вирішуємо, що вже декодоване, і коли закінчується декодування
const state = vi.hoisted(() => ({ decoded: new Set(), waits: new Map() }))
vi.mock('./plate.js', () => ({
  plateUrl: (d) => d.plate,
  isDecoded: (url) => !url || state.decoded.has(url),
  decodePlate: (url) => {
    if (state.decoded.has(url)) return Promise.resolve()
    return new Promise((resolve) => state.waits.set(url, () => (state.decoded.add(url), resolve())))
  },
}))

const { useHeldScreen, plateOf, HOLD_MS } = await import('./heldScreen.js')

const painted = (id) => ({ path: `/${id}`, id, kind: 'app', data: { plate: `/${id}.webp` } })
const login = { path: '/login', id: 'login', kind: 'login' }

beforeEach(() => {
  state.decoded = new Set()
  state.waits = new Map()
})

describe('which plate a screen has', () => {
  test('only painted screens have one; settings, login and screens without data do not', () => {
    expect(plateOf(painted('dreams'))).toBe('/dreams.webp')
    expect(plateOf({ path: '/settings', id: 'settings', kind: 'app', data: { plate: '/s.webp' } })).toBeUndefined()
    expect(plateOf(login)).toBeUndefined()
    expect(plateOf({ path: '/x', id: 'x', kind: 'app' })).toBeUndefined()
  })
})

describe('holding the previous screen', () => {
  test('between two painted screens the old one stays until the new plate is decoded, then the new one shows', async () => {
    state.decoded.add('/dreams.webp')
    const { result, rerender } = renderHook(({ t }) => useHeldScreen(t), { initialProps: { t: painted('dreams') } })
    expect(result.current.id).toBe('dreams')
    rerender({ t: painted('analysis') })
    expect(result.current.id).toBe('dreams') // новий ще не готовий: старий лишається
    await act(async () => state.waits.get('/analysis.webp')())
    await waitFor(() => expect(result.current.id).toBe('analysis'))
  })

  test('an already decoded plate switches at once', () => {
    state.decoded.add('/dreams.webp').add('/analysis.webp')
    const { result, rerender } = renderHook(({ t }) => useHeldScreen(t), { initialProps: { t: painted('dreams') } })
    rerender({ t: painted('analysis') })
    expect(result.current.id).toBe('analysis')
  })

  test('going to or from a screen without a plate (sign-in, landing) is immediate', () => {
    state.decoded.add('/dreams.webp')
    const { result, rerender } = renderHook(({ t }) => useHeldScreen(t), { initialProps: { t: painted('dreams') } })
    rerender({ t: login })
    expect(result.current.id).toBe('login')
    rerender({ t: painted('tarot') }) // з екрана без плити: тримати нічого
    expect(result.current.id).toBe('tarot')
  })

  test('if the plate takes too long the new screen is shown anyway', async () => {
    vi.useFakeTimers()
    try {
      state.decoded.add('/dreams.webp')
      const { result, rerender } = renderHook(({ t }) => useHeldScreen(t), { initialProps: { t: painted('dreams') } })
      rerender({ t: painted('astrology') })
      expect(result.current.id).toBe('dreams')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(HOLD_MS + 50)
      })
      expect(result.current.id).toBe('astrology')
    } finally {
      vi.useRealTimers()
    }
  })

  test('quick clicks: only the last screen is shown, the one passed over is dropped', async () => {
    state.decoded.add('/dreams.webp')
    const { result, rerender } = renderHook(({ t }) => useHeldScreen(t), { initialProps: { t: painted('dreams') } })
    rerender({ t: painted('analysis') })
    rerender({ t: painted('tarot') })
    await act(async () => state.waits.get('/analysis.webp')?.())
    expect(result.current.id).toBe('dreams') // analysis уже не потрібен
    await act(async () => state.waits.get('/tarot.webp')())
    await waitFor(() => expect(result.current.id).toBe('tarot'))
  })
})
