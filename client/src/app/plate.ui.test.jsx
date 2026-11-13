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
