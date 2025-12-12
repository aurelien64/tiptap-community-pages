import { describe, it, expect } from 'vitest'
import {
  PAGE_FORMATS,
  PageFormatName,
  inchesToPixels,
  cmToPixels,
  pixelsToInches,
  pixelsToCm,
  getPageDimensions,
  getDefaultMargins,
  getWritableArea,
  createPageConfig,
  getEffectiveDimensions,
  calculatePageCount,
  getPageBreakPositions,
} from '@/extensions/page-format'

describe('page-format', () => {
  describe('Unit Conversions', () => {
    it('should convert inches to pixels at 96 DPI', () => {
      expect(inchesToPixels(1)).toBe(96)
      expect(inchesToPixels(8.5)).toBe(816)
      expect(inchesToPixels(11)).toBe(1056)
      expect(inchesToPixels(14)).toBe(1344)
    })

    it('should convert centimeters to pixels', () => {
      expect(cmToPixels(2.54)).toBe(96) // 1 inch = 2.54cm
      expect(cmToPixels(21)).toBeCloseTo(794, 0) // A4 width
      expect(cmToPixels(29.7)).toBeCloseTo(1123, 0) // A4 height
    })

    it('should convert pixels to inches', () => {
      expect(pixelsToInches(96)).toBe(1)
      expect(pixelsToInches(816)).toBeCloseTo(8.5, 1)
      expect(pixelsToInches(1056)).toBeCloseTo(11, 0)
    })

    it('should convert pixels to centimeters', () => {
      expect(pixelsToCm(96)).toBeCloseTo(2.54, 1)
      expect(pixelsToCm(794)).toBeCloseTo(21, 0)
    })
  })

  describe('PAGE_FORMATS', () => {
    it('should define A4 format correctly', () => {
      const a4 = PAGE_FORMATS.A4
      expect(a4.name).toBe('A4')
      expect(a4.dimensions.width).toBe(794)
      expect(a4.dimensions.height).toBe(1123)
      expect(a4.description).toContain('210 × 297 mm')
    })

    it('should define Letter format correctly', () => {
      const letter = PAGE_FORMATS.Letter
      expect(letter.name).toBe('Letter')
      expect(letter.dimensions.width).toBe(816)
      expect(letter.dimensions.height).toBe(1056)
      expect(letter.description).toContain('8.5 × 11')
    })

    it('should define Legal format correctly', () => {
      const legal = PAGE_FORMATS.Legal
      expect(legal.name).toBe('Legal')
      expect(legal.dimensions.width).toBe(816)
      expect(legal.dimensions.height).toBe(1344)
      expect(legal.description).toContain('8.5 × 14')
    })

    it('should have 1-inch default margins for US formats', () => {
      expect(PAGE_FORMATS.Letter.defaultMargins.top).toBe(96)
      expect(PAGE_FORMATS.Legal.defaultMargins.right).toBe(96)
      expect(PAGE_FORMATS.Legal.defaultMargins.bottom).toBe(96)
      expect(PAGE_FORMATS.Letter.defaultMargins.left).toBe(96)
    })

    it('should have 2.54cm default margins for A4', () => {
      // 2.54cm ≈ 96px at 96 DPI
      expect(PAGE_FORMATS.A4.defaultMargins.top).toBe(96)
    })
  })

  describe('getPageDimensions', () => {
    it('should return portrait dimensions by default', () => {
      const dims = getPageDimensions('Letter')
      expect(dims.width).toBe(816)
      expect(dims.height).toBe(1056)
    })

    it('should return landscape dimensions when specified', () => {
      const dims = getPageDimensions('Letter', 'landscape')
      expect(dims.width).toBe(1056)
      expect(dims.height).toBe(816)
    })

    it('should work with custom dimensions object', () => {
      const custom = { width: 500, height: 700 }
      const dims = getPageDimensions(custom)
      expect(dims.width).toBe(500)
      expect(dims.height).toBe(700)
    })

    it('should swap custom dimensions for landscape', () => {
      const custom = { width: 500, height: 700 }
      const dims = getPageDimensions(custom, 'landscape')
      expect(dims.width).toBe(700)
      expect(dims.height).toBe(500)
    })

    it('should return a copy, not mutate original', () => {
      const dims1 = getPageDimensions('Letter')
      dims1.width = 100
      const dims2 = getPageDimensions('Letter')
      expect(dims2.width).toBe(816)
    })
  })

  describe('getDefaultMargins', () => {
    it('should return margins for each format', () => {
      const formats: PageFormatName[] = ['A4', 'Letter', 'Legal']
      formats.forEach((format) => {
        const margins = getDefaultMargins(format)
        expect(margins).toHaveProperty('top')
        expect(margins).toHaveProperty('right')
        expect(margins).toHaveProperty('bottom')
        expect(margins).toHaveProperty('left')
      })
    })

    it('should return a copy, not mutate original', () => {
      const margins1 = getDefaultMargins('Letter')
      margins1.top = 0
      const margins2 = getDefaultMargins('Letter')
      expect(margins2.top).toBe(96)
    })
  })

  describe('getWritableArea', () => {
    it('should calculate writable area correctly', () => {
      const dimensions = { width: 816, height: 1056 }
      const margins = { top: 96, right: 96, bottom: 96, left: 96 }
      const writable = getWritableArea(dimensions, margins)
      
      expect(writable.width).toBe(816 - 96 - 96) // 624
      expect(writable.height).toBe(1056 - 96 - 96) // 864
    })

    it('should work with asymmetric margins', () => {
      const dimensions = { width: 800, height: 1000 }
      const margins = { top: 100, right: 50, bottom: 100, left: 50 }
      const writable = getWritableArea(dimensions, margins)
      
      expect(writable.width).toBe(700)
      expect(writable.height).toBe(800)
    })
  })

  describe('createPageConfig', () => {
    it('should create default Letter portrait config', () => {
      const config = createPageConfig()
      expect(config.format).toBe('Letter')
      expect(config.orientation).toBe('portrait')
      expect(config.margins.top).toBe(96)
    })

    it('should accept format parameter', () => {
      const config = createPageConfig('Legal')
      expect(config.format).toBe('Legal')
    })

    it('should accept orientation parameter', () => {
      const config = createPageConfig('A4', 'landscape')
      expect(config.orientation).toBe('landscape')
    })

    it('should merge partial margins with defaults', () => {
      const config = createPageConfig('Letter', 'portrait', { top: 50 })
      expect(config.margins.top).toBe(50)
      expect(config.margins.right).toBe(96) // default
      expect(config.margins.bottom).toBe(96) // default
      expect(config.margins.left).toBe(96) // default
    })

    it('should use 96px default margins for custom dimensions', () => {
      const config = createPageConfig({ width: 600, height: 800 })
      expect(config.margins.top).toBe(96)
      expect(config.margins.right).toBe(96)
    })
  })

  describe('getEffectiveDimensions', () => {
    it('should get dimensions from config', () => {
      const config = createPageConfig('Legal', 'portrait')
      const dims = getEffectiveDimensions(config)
      expect(dims.width).toBe(816)
      expect(dims.height).toBe(1344)
    })

    it('should apply landscape orientation from config', () => {
      const config = createPageConfig('Letter', 'landscape')
      const dims = getEffectiveDimensions(config)
      expect(dims.width).toBe(1056)
      expect(dims.height).toBe(816)
    })
  })

  describe('calculatePageCount', () => {
    it('should return 1 for empty content', () => {
      const config = createPageConfig('Letter')
      expect(calculatePageCount(0, config)).toBe(1)
    })

    it('should return 1 for content that fits one page', () => {
      const config = createPageConfig('Letter')
      // Writable height = 1056 - 96 - 96 = 864
      expect(calculatePageCount(500, config)).toBe(1)
      expect(calculatePageCount(864, config)).toBe(1)
    })

    it('should return 2 for content slightly over one page', () => {
      const config = createPageConfig('Letter')
      expect(calculatePageCount(865, config)).toBe(2)
    })

    it('should calculate multiple pages correctly', () => {
      const config = createPageConfig('Letter')
      // Writable height = 864
      expect(calculatePageCount(864 * 2, config)).toBe(2)
      expect(calculatePageCount(864 * 2 + 1, config)).toBe(3)
      expect(calculatePageCount(864 * 3, config)).toBe(3)
      expect(calculatePageCount(864 * 3 + 1, config)).toBe(4)
    })

    it('should handle different formats', () => {
      const letterConfig = createPageConfig('Letter')
      const legalConfig = createPageConfig('Legal')
      
      // Legal has more writable height (1344 - 192 = 1152)
      // Letter writable height = 864
      const contentHeight = 900
      
      expect(calculatePageCount(contentHeight, letterConfig)).toBe(2) // 900 > 864
      expect(calculatePageCount(contentHeight, legalConfig)).toBe(1) // 900 < 1152
    })
  })

  describe('getPageBreakPositions', () => {
    it('should return empty array for single page', () => {
      const config = createPageConfig('Letter')
      expect(getPageBreakPositions(1, config)).toEqual([])
    })

    it('should return one position for two pages', () => {
      const config = createPageConfig('Letter')
      const positions = getPageBreakPositions(2, config)
      expect(positions).toHaveLength(1)
      expect(positions[0]).toBe(864) // writable height
    })

    it('should return multiple positions for many pages', () => {
      const config = createPageConfig('Letter')
      const positions = getPageBreakPositions(4, config)
      expect(positions).toHaveLength(3)
      expect(positions[0]).toBe(864)
      expect(positions[1]).toBe(864 * 2)
      expect(positions[2]).toBe(864 * 3)
    })
  })
})
