import { describe, expect, it, vi } from 'vitest'
import { toggleFullscreen } from './fullscreen'

describe('toggleFullscreen', () => {
  it('enters and exits fullscreen', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined)
    const exitFullscreen = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(document.documentElement, 'requestFullscreen', { configurable: true, value: requestFullscreen })
    Object.defineProperty(document, 'exitFullscreen', { configurable: true, value: exitFullscreen })
    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: null })

    await toggleFullscreen(document)
    expect(requestFullscreen).toHaveBeenCalledOnce()

    Object.defineProperty(document, 'fullscreenElement', { configurable: true, value: document.documentElement })
    await toggleFullscreen(document)
    expect(exitFullscreen).toHaveBeenCalledOnce()
  })
})
