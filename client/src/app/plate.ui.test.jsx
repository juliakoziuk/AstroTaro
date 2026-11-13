import { afterEach, describe, expect, test, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

// Підміна Image: decode() повертає проміс, який ми завершуємо вручну
function mockImage() {
  const made = []
  class FakeImage {
    constructor() {
      made.push(this)
      this.decode = () => new Promise((resolve, reject) => ((this.finish = resolve), (this.fail = reject)))
    }
  }
  vi.stubGlobal('Image', FakeImage)
  return made
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('plate decoding', () => {
  test('the plate is not ready until it is decoded, then it is, and the next visit is instant', async () => {
    const made = mockImage()
    const { usePlateReady } = await import('./plate.js')
    const { result, unmount } = renderHook(() => usePlateReady('/assets/dreams-2x.webp'))
    expect(result.current).toBe(false)
    expect(made).toHaveLength(1)
    expect(made[0].src).toBe('/assets/dreams-2x.webp')
    await act(async () => made[0].finish())
    await waitFor(() => expect(result.current).toBe(true))
    unmount()
    // повернення на екран: вже декодована плита показується одразу, без нової картинки
    const again = renderHook(() => usePlateReady('/assets/dreams-2x.webp'))
    expect(again.result.current).toBe(true)
    expect(made).toHaveLength(1)
  })

  test('a failed decode does not block the screen', async () => {
    const made = mockImage()
    const { usePlateReady } = await import('./plate.js')
    const { result } = renderHook(() => usePlateReady('/assets/broken.webp'))
    await act(async () => made[0].fail(new Error('decode failed')))
    await waitFor(() => expect(result.current).toBe(true))
  })

  test('if decoding takes too long, the art is shown anyway after the wait limit', async () => {
    mockImage()
    const { usePlateReady } = await import('./plate.js')
    const { result } = renderHook(() => usePlateReady('/assets/slow.webp', 40))
    expect(result.current).toBe(false)
    await waitFor(() => expect(result.current).toBe(true), { timeout: 1000 })
  })

  test('without a decode() in the browser the plate counts as ready right away', async () => {
    vi.stubGlobal('Image', class { })
    const { usePlateReady } = await import('./plate.js')
    const { result } = renderHook(() => usePlateReady('/assets/old-browser.webp'))
    await waitFor(() => expect(result.current).toBe(true))
  })
})

describe('which plate is chosen for the window', () => {
  const d = { plate: '/p1.webp', plateMid: '/pm.webp', plate2: '/p2.webp' }
  const at = (width, dpr) => {
    vi.stubGlobal('innerWidth', width)
    vi.stubGlobal('devicePixelRatio', dpr)
  }

  test('light plate up to 1536 physical pixels, middle up to 1920, the big one beyond', async () => {
    const { plateUrl } = await import('./plate.js')
    at(1366, 1)
    expect(plateUrl(d)).toBe('/p1.webp')
    at(1920, 1)
    expect(plateUrl(d)).toBe('/pm.webp')
    at(2560, 1)
    expect(plateUrl(d)).toBe('/p2.webp')
  })

  test('page zoom and pixel density count: a 1280 window at 2x needs 2560 pixels', async () => {
    const { plateUrl } = await import('./plate.js')
    at(1280, 2)
    expect(plateUrl(d)).toBe('/p2.webp')
    at(2560, 0.67) // браузер на 67%: ширина в CSS-пікселях більша, фізична — ні
    expect(plateUrl(d)).toBe('/pm.webp')
  })

  test('a screen with art to the window edges (guest) always gets the full plate; missing variants fall back', async () => {
    const { plateUrl } = await import('./plate.js')
    at(1366, 1)
    expect(plateUrl(d, true)).toBe('/p2.webp')
    expect(plateUrl({ plate2: '/only2x.webp' })).toBe('/only2x.webp')
    expect(plateUrl(undefined)).toBeUndefined()
  })
})
