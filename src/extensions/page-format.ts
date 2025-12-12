/**
 * Page Format Utility
 * 
 * Defines standard page dimensions for legal and international document formats.
 * All dimensions are in pixels at 96 DPI (standard screen resolution).
 * 
 * Conversion: 1 inch = 96px, 1 cm = 37.795px
 */

export type PageFormatName = 'A4' | 'Letter' | 'Legal'
export type PageOrientation = 'portrait' | 'landscape'

export interface PageDimensions {
  /** Width in pixels */
  width: number
  /** Height in pixels */
  height: number
}

export interface PageMargins {
  top: number
  right: number
  bottom: number
  left: number
}

export interface PageFormat {
  name: PageFormatName
  dimensions: PageDimensions
  /** Default margins in pixels */
  defaultMargins: PageMargins
  /** Human-readable description */
  description: string
}

export interface PageConfig {
  format: PageFormatName | PageDimensions
  orientation: PageOrientation
  margins: PageMargins
}

// Constants for conversions
const PIXELS_PER_INCH = 96
const PIXELS_PER_CM = 37.795275591

/**
 * Convert inches to pixels
 */
export function inchesToPixels(inches: number): number {
  return Math.round(inches * PIXELS_PER_INCH)
}

/**
 * Convert centimeters to pixels
 */
export function cmToPixels(cm: number): number {
  return Math.round(cm * PIXELS_PER_CM)
}

/**
 * Convert pixels to inches
 */
export function pixelsToInches(pixels: number): number {
  return pixels / PIXELS_PER_INCH
}

/**
 * Convert pixels to centimeters
 */
export function pixelsToCm(pixels: number): number {
  return pixels / PIXELS_PER_CM
}

/**
 * Standard page formats with dimensions at 96 DPI
 */
export const PAGE_FORMATS: Record<PageFormatName, PageFormat> = {
  A4: {
    name: 'A4',
    dimensions: {
      width: 794,  // 210mm = 8.27 inches
      height: 1123, // 297mm = 11.69 inches
    },
    defaultMargins: {
      top: cmToPixels(2.54),    // 1 inch = 2.54cm
      right: cmToPixels(2.54),
      bottom: cmToPixels(2.54),
      left: cmToPixels(2.54),
    },
    description: 'ISO A4 (210 × 297 mm)',
  },
  Letter: {
    name: 'Letter',
    dimensions: {
      width: 816,   // 8.5 inches
      height: 1056, // 11 inches
    },
    defaultMargins: {
      top: inchesToPixels(1),
      right: inchesToPixels(1),
      bottom: inchesToPixels(1),
      left: inchesToPixels(1),
    },
    description: 'US Letter (8.5 × 11 inches)',
  },
  Legal: {
    name: 'Legal',
    dimensions: {
      width: 816,   // 8.5 inches
      height: 1344, // 14 inches
    },
    defaultMargins: {
      top: inchesToPixels(1),
      right: inchesToPixels(1),
      bottom: inchesToPixels(1),
      left: inchesToPixels(1),
    },
    description: 'US Legal (8.5 × 14 inches)',
  },
}

/**
 * Get page dimensions for a format, applying orientation
 */
export function getPageDimensions(
  format: PageFormatName | PageDimensions,
  orientation: PageOrientation = 'portrait'
): PageDimensions {
  let dimensions: PageDimensions

  if (typeof format === 'string') {
    dimensions = { ...PAGE_FORMATS[format].dimensions }
  } else {
    dimensions = { ...format }
  }

  // Swap width and height for landscape
  if (orientation === 'landscape') {
    return {
      width: dimensions.height,
      height: dimensions.width,
    }
  }

  return dimensions
}

/**
 * Get default margins for a format
 */
export function getDefaultMargins(format: PageFormatName): PageMargins {
  return { ...PAGE_FORMATS[format].defaultMargins }
}

/**
 * Calculate the writable area (content area) of a page
 */
export function getWritableArea(
  dimensions: PageDimensions,
  margins: PageMargins
): PageDimensions {
  return {
    width: dimensions.width - margins.left - margins.right,
    height: dimensions.height - margins.top - margins.bottom,
  }
}

/**
 * Create a complete page configuration
 */
export function createPageConfig(
  format: PageFormatName | PageDimensions = 'Letter',
  orientation: PageOrientation = 'portrait',
  margins?: Partial<PageMargins>
): PageConfig {
  const defaultMargins = typeof format === 'string'
    ? getDefaultMargins(format)
    : { top: 96, right: 96, bottom: 96, left: 96 }

  return {
    format,
    orientation,
    margins: {
      ...defaultMargins,
      ...margins,
    },
  }
}

/**
 * Get the effective page dimensions from a config
 */
export function getEffectiveDimensions(config: PageConfig): PageDimensions {
  return getPageDimensions(config.format, config.orientation)
}

/**
 * Calculate how many pages are needed for a given content height
 */
export function calculatePageCount(
  contentHeight: number,
  config: PageConfig
): number {
  const dimensions = getEffectiveDimensions(config)
  const writableHeight = dimensions.height - config.margins.top - config.margins.bottom
  
  if (writableHeight <= 0) return 1
  return Math.max(1, Math.ceil(contentHeight / writableHeight))
}

/**
 * Get the Y position where a page break should occur (in content coordinates)
 */
export function getPageBreakPositions(
  pageCount: number,
  config: PageConfig
): number[] {
  const dimensions = getEffectiveDimensions(config)
  const writableHeight = dimensions.height - config.margins.top - config.margins.bottom
  
  const positions: number[] = []
  for (let i = 1; i < pageCount; i++) {
    positions.push(i * writableHeight)
  }
  return positions
}

/**
 * Complete layout dimensions for rendering
 * Contains both visual (total page) and content (writable area) dimensions
 */
export interface PageLayoutDimensions {
  /** Total page dimensions including margins */
  page: PageDimensions
  /** Writable content area (page minus margins) */
  content: PageDimensions
  /** Margins */
  margins: PageMargins
  /** Aspect ratio of the page (width / height) */
  aspectRatio: number
}

/**
 * Get complete layout dimensions for a page configuration
 * This is the single source of truth for both visual rendering and pagination
 */
export function getPageLayoutDimensions(config: PageConfig): PageLayoutDimensions {
  const page = getEffectiveDimensions(config)
  const content = getWritableArea(page, config.margins)
  
  return {
    page,
    content,
    margins: config.margins,
    aspectRatio: page.width / page.height,
  }
}
