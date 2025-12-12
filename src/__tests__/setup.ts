import '@testing-library/jest-dom'
import { vi, beforeAll, afterAll } from 'vitest'

// Mock requestAnimationFrame for tests
global.requestAnimationFrame = (callback) => {
  setTimeout(callback, 0)
  return 0
}

global.cancelAnimationFrame = () => {}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

// Mock getComputedStyle
const originalGetComputedStyle = global.getComputedStyle
global.getComputedStyle = (element: Element, pseudoElt?: string | null) => {
  try {
    return originalGetComputedStyle(element, pseudoElt)
  } catch {
    return {
      lineHeight: '20px',
      getPropertyValue: () => '',
    } as unknown as CSSStyleDeclaration
  }
}

// Suppress console errors in tests if needed
const originalError = console.error
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Not implemented: HTMLCanvasElement')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})
