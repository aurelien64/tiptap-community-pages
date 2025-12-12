/**
 * Community Tiptap Pages Extension
 * 
 * A pagination extension for Tiptap that provides WYSIWYG page layout
 * similar to word processors, supporting legal document formats.
 */

export { PageBreak } from './page-break'
export {
  Pagination,
  paginationPluginKey,
  // Page structure CSS classes (inline widget approach)
  FIRST_PAGE_HEADER_CLASS,
  PAGE_BREAK_CLASS,
  PAGE_HEADER_CLASS,
  PAGE_FOOTER_CLASS,
  PAGE_GAP_CLASS,
  PAGINATION_CONTAINER_CLASS,
  LAST_PAGE_FOOTER_CLASS,
  LAST_PAGE_FOOTER_CONTENT_CLASS,
  LAST_PAGE_FILLER_CLASS,
  BREAKER_SPACER_CLASS,
  BREAKER_CONTAINER_CLASS,
  // Types
  type PaginationOptions,
  type PaginationStorage,
  type PageNumberDisplayOptions,
} from './pagination'
export {
  // Types
  type PageFormatName,
  type PageOrientation,
  type PageDimensions,
  type PageMargins,
  type PageFormat,
  type PageConfig,
  type PageLayoutDimensions,
  // Constants
  PAGE_FORMATS,
  // Utilities
  inchesToPixels,
  cmToPixels,
  pixelsToInches,
  pixelsToCm,
  getPageDimensions,
  getDefaultMargins,
  getWritableArea,
  createPageConfig,
  getEffectiveDimensions,
  getPageLayoutDimensions,
  calculatePageCount,
  getPageBreakPositions,
} from './page-format'
