import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { EditorView } from '@tiptap/pm/view'
import {
  PageFormatName,
  PageOrientation,
  PageMargins,
  PageDimensions,
  createPageConfig,
  getPageLayoutDimensions,
  PageLayoutDimensions,
} from './page-format'

/**
 * Page Structure Classes
 *
 * The pagination UI is rendered via a small set of widgets inserted into the
 * editor DOM. We intentionally keep these class names project-specific to
 * avoid collisions with other extensions.
 */

export const FIRST_PAGE_HEADER_CLASS = 'ctp-pages-first-header'
export const PAGE_BREAK_CLASS = 'ctp-pages-break'
export const PAGE_HEADER_CLASS = 'ctp-pages-header'
export const PAGE_FOOTER_CLASS = 'ctp-pages-footer'
export const PAGE_GAP_CLASS = 'ctp-pages-gap'
export const PAGINATION_CONTAINER_CLASS = 'ctp-pages-breaks'
export const LAST_PAGE_FOOTER_CLASS = 'ctp-pages-last-footer'
export const LAST_PAGE_FOOTER_CONTENT_CLASS = 'ctp-pages-last-footer-content'
export const LAST_PAGE_FILLER_CLASS = 'ctp-pages-last-filler'
export const BREAKER_SPACER_CLASS = 'ctp-pages-spacer'
export const BREAKER_CONTAINER_CLASS = 'ctp-pages-breaker'

const PAGINATION_DATA_ATTR = 'data-ctp-pagination'
const PAGINATION_CONTAINER_ID = 'ctp-pages'

export interface PageNumberDisplayOptions {
  showPageNumbers: boolean
  separator: string
  formatPageNumber?: (currentPage: number, totalPages: number, separator: string) => string
}

export interface PaginationOptions {
  pageFormat: PageFormatName | { width: number; height: number }
  orientation: PageOrientation
  margins: Partial<PageMargins>
  widowOrphanControl: boolean
  minLinesAtBreak: number
  pageGap: number
  showPageNumbers: boolean
  pageNumberSeparator: string
  formatPageNumber?: (currentPage: number, totalPages: number, separator: string) => string
  onPageCountChange?: (count: number) => void
}

export interface PaginationStorage {
  pageConfig: ReturnType<typeof createPageConfig>
  pageCount: number
  pageBreakPositions: number[]
  measuredContentHeight: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pagination: {
      setPageFormat: (format: PageFormatName) => ReturnType
      setOrientation: (orientation: PageOrientation) => ReturnType
      setMargins: (margins: Partial<PageMargins>) => ReturnType
      goToPage: (pageNumber: number) => ReturnType
    }
  }

  interface Storage {
    pagination: PaginationStorage
  }
}

export const paginationPluginKey = new PluginKey('pagination')

export const Pagination = Extension.create<PaginationOptions, PaginationStorage>({
  name: 'pagination',

  addOptions() {
    return {
      pageFormat: 'Letter',
      orientation: 'portrait',
      margins: {},
      widowOrphanControl: true,
      minLinesAtBreak: 2,
      pageGap: 40,
      showPageNumbers: true,
      pageNumberSeparator: 'of',
      formatPageNumber: undefined,
      onPageCountChange: undefined,
    }
  },

  addStorage() {
    const config = createPageConfig(
      this.options.pageFormat,
      this.options.orientation,
      this.options.margins
    )
    return {
      pageConfig: config,
      pageCount: 1,
      pageBreakPositions: [],
      measuredContentHeight: 0,
    }
  },

  addCommands() {
    return {
      setPageFormat:
        (format: PageFormatName) =>
        ({ editor }) => {
          this.storage.pageConfig = createPageConfig(
            format,
            this.storage.pageConfig.orientation,
            this.storage.pageConfig.margins
          )
          editor.view.dispatch(editor.state.tr.setMeta(paginationPluginKey, { format }))
          return true
        },

      setOrientation:
        (orientation: PageOrientation) =>
        ({ editor }) => {
          this.storage.pageConfig = createPageConfig(
            this.storage.pageConfig.format,
            orientation,
            this.storage.pageConfig.margins
          )
          editor.view.dispatch(editor.state.tr.setMeta(paginationPluginKey, { orientation }))
          return true
        },

      setMargins:
        (margins: Partial<PageMargins>) =>
        ({ editor }) => {
          this.storage.pageConfig = {
            ...this.storage.pageConfig,
            margins: {
              ...this.storage.pageConfig.margins,
              ...margins,
            },
          }
          editor.view.dispatch(editor.state.tr.setMeta(paginationPluginKey, { margins }))
          return true
        },

      goToPage:
        (pageNumber: number) =>
        ({ editor }) => {
          if (pageNumber <= 1) {
            editor.commands.focus('start')
            return true
          }
          const element = editor.view.dom.querySelector(
            '.' + PAGE_BREAK_CLASS + '[data-page="' + pageNumber + '"]'
          )
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
          return true
        },
    }
  },

  addProseMirrorPlugins() {
    const options = this.options
    const storage = this.storage
    let scheduledUpdate: number | null = null
    let stylesInjected = false
    let isUpdating = false
    let lastFormat: PageFormatName | PageDimensions | null = null
    let lastOrientation: PageOrientation | null = null

    /**
      * Measure content and update page breaks.
      *
      * The UI uses float + margin-top to position page breaks inside the normal
      * document flow (no absolute positioning). This keeps the text stream flat
      * while still rendering page-like boundaries.
     */
    function updatePagination(view: EditorView) {
      // Prevent re-entry
      if (isUpdating) return
      isUpdating = true
      
      const config = storage.pageConfig
      const layout = getPageLayoutDimensions(config)
      const pageGap = options.pageGap

      // If the page wrapper is visually scaled (mobile fit), ProseMirror DOM
      // measurements via getBoundingClientRect() will be scaled too.
      // Convert those visual measurements back into unscaled layout units.
      const scale = getPageScale(view.dom as HTMLElement)

      // Content area height (page height minus top/bottom margins)
      const contentHeight = layout.content.height
      const editorDom = view.dom

      // Hard page breaks should push subsequent content to the next page.
      // We do this by adding a computed filler `margin-bottom` on the hard break node.
      // The page count calculation below uses a fixed-point iteration so the overlay
      // contribution stays consistent and does not explode.
      const minPageCountFromHardBreaks = applyHardPageBreakSpacing(editorDom, layout, pageGap, scale)
      
      // Calculate content height by measuring visual span from first to last content element
      // This properly accounts for CSS margins between elements
      const contentChildren = Array.from(editorDom.children).filter(child => {
        const el = child as HTMLElement
        return !el.classList.contains(PAGINATION_CONTAINER_CLASS) &&
               !el.classList.contains(FIRST_PAGE_HEADER_CLASS) &&
               !el.classList.contains(LAST_PAGE_FOOTER_CLASS) &&
               !el.hasAttribute(PAGINATION_DATA_ATTR) &&
               el.id !== PAGINATION_CONTAINER_ID &&
               el.getAttribute('contenteditable') !== 'false'
      }) as HTMLElement[]
      
      let totalContentHeight = 0
      
      if (contentChildren.length > 0) {
        const editorRect = editorDom.getBoundingClientRect()
        const firstContent = contentChildren[0]
        const lastContent = contentChildren[contentChildren.length - 1]
        
        const firstTop = (firstContent.getBoundingClientRect().top - editorRect.top) / scale
        const lastBottom = (lastContent.getBoundingClientRect().bottom - editorRect.top) / scale
        
        // Visual span from first content to last content
        const visualSpan = Math.max(0, Math.round(lastBottom - firstTop))
        
        // Get current page count to calculate page break contributions
        // Page breaks are floated and push content down.
        // Solve pageCount in: pageCount = ceil((visualSpan - (pageCount-1)*breakerHeight)/contentHeight)
        // via a short fixed-point iteration (stable for hard-break-induced jumps).
        const breakerHeight = layout.margins.top + pageGap + layout.margins.bottom
        let estimate = Math.max(1, storage.pageCount)
        for (let i = 0; i < 5; i++) {
          const contribution = Math.max(0, estimate - 1) * breakerHeight
          const inferred = Math.max(0, visualSpan - contribution)
          const next = Math.max(1, Math.ceil(inferred / contentHeight))
          if (next === estimate) break
          estimate = next
        }

        const finalContribution = Math.max(0, estimate - 1) * breakerHeight
        totalContentHeight = Math.max(0, Math.round(visualSpan - finalContribution))
      }
      
      // Safety: ensure we have at least some content
      if (totalContentHeight === 0) {
        totalContentHeight = 100 // minimum for empty doc
      }
      
      // Calculate number of pages based on content
      // NOTE: Hard page breaks can require additional pages even if the current
      // float-based overlays haven't rendered the last break yet.
      let pageCount = Math.max(1, Math.ceil(totalContentHeight / contentHeight))
      pageCount = Math.max(pageCount, minPageCountFromHardBreaks)
      
      // Check if page count or config actually changed - if not, skip updates
      const configKey = `${config.format}-${config.orientation}`
      const oldConfigKey = `${lastFormat}-${lastOrientation}`
      const pageCountChanged = pageCount !== storage.pageCount
      const contentHeightChanged = totalContentHeight !== storage.measuredContentHeight
      const configChanged = configKey !== oldConfigKey
      
      lastFormat = config.format
      lastOrientation = config.orientation
      
      if (!pageCountChanged && !configChanged && !contentHeightChanged) {
        isUpdating = false
        return
      }
      
      // Store new page count and measured content height
      storage.pageCount = pageCount
      storage.measuredContentHeight = totalContentHeight
      options.onPageCountChange?.(pageCount)
      
      // IMPORTANT: Dispatch a transaction to trigger decoration rebuild
      // This ensures the pagination container widget gets updated with new page breaks
      view.dispatch(view.state.tr.setMeta(paginationPluginKey, { pageCount }))
      
      // Set min-height on editor to ensure proper page dimensions
      // Formula: pageCount * contentHeight + (pageCount - 1) * pageGap + margins.top + margins.bottom
      // But since we use float-based positioning, we need enough height for all page breaks
      const minHeight = pageCount * contentHeight +
               (pageCount - 1) * pageGap +
               layout.margins.top + layout.margins.bottom
      editorDom.style.minHeight = Math.ceil(minHeight) + 'px'
      
      // Done updating
      isUpdating = false
    }

    /**
     * Schedule a pagination update on next animation frame
     */
    function schedulePaginationUpdate(view: EditorView) {
      if (scheduledUpdate !== null) {
        cancelAnimationFrame(scheduledUpdate)
      }
      scheduledUpdate = requestAnimationFrame(() => {
        scheduledUpdate = null
        updatePagination(view)
      })
    }

    return [
      new Plugin({
        key: paginationPluginKey,
        
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr, oldDecorations, _oldState, newState) {
            // Rebuild decorations if config changed or if doc changed
            const meta = tr.getMeta(paginationPluginKey)
            if (meta || tr.docChanged) {
              return DecorationSet.empty // Force rebuild in view
            }
            return oldDecorations.map(tr.mapping, newState.doc)
          },
        },
        
        props: {
          decorations(state) {
            const config = storage.pageConfig
            const layout = getPageLayoutDimensions(config)
            const pageGap = options.pageGap
            const pageCount = storage.pageCount
            const measuredContentHeight = storage.measuredContentHeight
            const displayOptions: PageNumberDisplayOptions = {
              showPageNumbers: options.showPageNumbers,
              separator: options.pageNumberSeparator,
              formatPageNumber: options.formatPageNumber,
            }
            
            const decorations: Decoration[] = []
            
            // Single widget at position 0 containing ALL page breaks.
            // Uses float + margin-top to position breaks at exact pixel locations.
            // IMPORTANT: Key includes pageCount to force widget recreation when page count changes
            decorations.push(
              Decoration.widget(0, () => createPaginationContainer(
                layout, pageGap, pageCount, displayOptions
              ), {
                side: -1,
                key: `pagination-container-${pageCount}-${config.format}-${config.orientation}`,
              })
            )
            
            // First page header
            decorations.push(
              Decoration.widget(0, () => createFirstPageHeader(layout), {
                side: -1,
                key: `first-page-header-${config.format}-${config.orientation}`,
              })
            )
            
            // Last page footer - key includes pageCount and content height for proper filler sizing
            decorations.push(
              Decoration.widget(state.doc.content.size, () => 
                createLastPageFooter(layout, pageCount, displayOptions, measuredContentHeight), {
                side: 1,
                key: `last-page-footer-${pageCount}-${measuredContentHeight}-${config.format}-${config.orientation}`,
              })
            )
            
            return DecorationSet.create(state.doc, decorations)
          },
        },
        
        view(editorView) {
          if (!stylesInjected) {
            injectPaginationStyles()
            stylesInjected = true
          }
          
          schedulePaginationUpdate(editorView)
          
          return {
            update(view) {
              schedulePaginationUpdate(view)
            },
            destroy() {
              if (scheduledUpdate !== null) {
                cancelAnimationFrame(scheduledUpdate)
              }
              const styleEl = document.getElementById('ctp-pagination-styles')
              if (styleEl) styleEl.remove()
            },
          }
        },
      }),
    ]
  },
})

function getPageScale(editorDom: HTMLElement): number {
  const wrapper = editorDom.closest<HTMLElement>('.page-wrapper-page')
  if (!wrapper) return 1

  const raw = getComputedStyle(wrapper).getPropertyValue('--ctp-page-scale').trim()
  const value = parseFloat(raw)
  if (!Number.isFinite(value) || value <= 0) return 1
  return value
}

/**
 * Hard/manual page breaks (screen)
 *
 * The document is a continuous flow, but a hard page break should force the
 * next content to begin at the top of the next page.
 *
 * We do this by adding a `margin-bottom` on the page break DOM node equal to
 * the remaining writable height in the current page's content area.
 *
 * IMPORTANT: This must be stable under the float-based overlay system.
 * We compute positions in a "content-only" coordinate system by subtracting
 * the inter-page overlay height for each full stride above the node.
 */
function applyHardPageBreakSpacing(
  editorDom: HTMLElement,
  layout: PageLayoutDimensions,
  pageGap: number,
  scale: number
) {
  const breaks = Array.from(
    editorDom.querySelectorAll<HTMLElement>(
      '[data-page-break], [data-page-break="true"], .page-break'
    )
  )

  if (breaks.length === 0) return 1

  const editorRect = editorDom.getBoundingClientRect()
  const interPage = layout.margins.bottom + pageGap + layout.margins.top
  const stride = layout.content.height + interPage
  const contentHeight = layout.content.height

  // Two-pass, stable computation:
  // - Measure using current layout
  // - Compute desired margins in DOM order while compensating for how earlier
  //   margin changes will shift later nodes.
  // - Apply after computing, with rounding to avoid sub-pixel oscillation.
  const currentMargins = breaks.map(el => {
    const v = parseFloat(el.style.marginBottom || '0')
    return Number.isFinite(v) ? v : 0
  })

  const desiredMargins: number[] = new Array(breaks.length).fill(0)

  // Hard breaks can force additional pages even if the last visual break overlay
  // is not currently present. Track a minimum required page count.
  let minRequiredPageCount = 1
  let cumulativeDeltaShift = 0

  for (let i = 0; i < breaks.length; i++) {
    const el = breaks[i]

    const visualY = ((el.getBoundingClientRect().top - editorRect.top) / scale) + cumulativeDeltaShift
    const yFromFirstContentTop = Math.max(0, visualY - layout.margins.top)

    const visualPageIndex = stride > 0 ? Math.floor(yFromFirstContentTop / stride) : 0
    const withinStride = yFromFirstContentTop - visualPageIndex * stride
    // Convert from visual coordinates (content + overlay per page) into a
    // content-only coordinate system by clamping the within-stride position.
    // This prevents overlay height (footer/gap/header) from polluting the
    // modulo math and causing incorrect remaining-space calculations.
    const contentOnlyY = (visualPageIndex * contentHeight) + Math.min(withinStride, contentHeight)

    const adjustedContentY = contentOnlyY
    const withinPage = contentHeight > 0 ? (adjustedContentY % contentHeight) : 0

    // If we're exactly at a page boundary (withinPage === 0), a hard page break
    // should still advance one full page (creating a blank page if needed).
    const remaining = withinPage === 0
      ? contentHeight
      : Math.max(0, contentHeight - withinPage)

    // Ceil to a whole pixel so we don't keep chasing fractional layout shifts.
    const desired = remaining > 0 ? Math.ceil(remaining) : 0
    desiredMargins[i] = desired

    if (contentHeight > 0) {
      // Page number (1-indexed) of the position after the hard break spacing.
      const afterBreakY = adjustedContentY + desired
      const requiredPages = Math.floor(afterBreakY / contentHeight) + 1
      if (requiredPages > minRequiredPageCount) minRequiredPageCount = requiredPages
    }

    // Account for how changing THIS element's margin will shift everything after it.
    const delta = desired - currentMargins[i]
    cumulativeDeltaShift += delta
  }

  for (let i = 0; i < breaks.length; i++) {
    const el = breaks[i]
    const desired = desiredMargins[i]
    const current = currentMargins[i]

    // Only write styles if we actually change the value.
    if (Math.abs(desired - current) >= 1) {
      el.style.marginBottom = desired > 0 ? `${desired}px` : '0px'
    }
  }

  return minRequiredPageCount
}

/**
 * Create the main pagination container with all page breaks.
 * 
 * Uses float + margin-top to position page breaks.
 * The spacer element floats and uses margin-top to push itself down to the
 * correct vertical position. The breaker element then floats below it
 * and contains the footer, gap, and header elements.
 * 
 * This approach makes the breaks part of the document flow, allowing
 * headers/footers to properly cover content with their white backgrounds.
 */
function createPaginationContainer(
  layout: PageLayoutDimensions,
  pageGap: number,
  pageCount: number,
  displayOptions: PageNumberDisplayOptions
): HTMLElement {
  const { margins, page, content } = layout
  
  const container = document.createElement('div')
  container.className = PAGINATION_CONTAINER_CLASS
  container.setAttribute(PAGINATION_DATA_ATTR, 'true')
  container.setAttribute('contenteditable', 'false')
  container.id = PAGINATION_CONTAINER_ID
  
  // Build page breaks HTML using float + margin-top approach
  let breaksHtml = ''
  
  for (let i = 1; i < pageCount; i++) {
    const pageNum = i + 1
    
    // margin-top calculation:
    // First page break: margins.top + content.height (full first page)
    // Subsequent breaks: content.height only (content area per page)
    const marginTop = i === 1 
      ? margins.top + content.height 
      : content.height
    
    const pageNumberText = displayOptions.formatPageNumber
      ? displayOptions.formatPageNumber(i, pageCount, displayOptions.separator)
      : i + ' ' + displayOptions.separator + ' ' + pageCount
    
    breaksHtml += '<div class="' + PAGE_BREAK_CLASS + '" data-page="' + pageNum + '">'
    
    // The .page div - floats and uses margin-top to position vertically
    breaksHtml += '<div class="' + BREAKER_SPACER_CLASS + '" style="position:relative;float:left;clear:both;margin-top:calc(' + marginTop + 'px);"></div>'
    
    // The .breaker div - contains footer, gap, header
    // Uses negative margin-left to extend to full page width (counteract padding)
    breaksHtml += '<div class="' + BREAKER_CONTAINER_CLASS + '" style="width:calc(' + page.width + 'px);margin-left:-' + margins.left + 'px;position:relative;float:left;clear:both;left:0;right:0;z-index:2;">'
    
    // Footer
    // Draw the bottom separator line here so it stays within page width,
    // even if the gap extends wider to mask side shadows.
    breaksHtml += '<div class="' + PAGE_FOOTER_CLASS + '" style="height:' + margins.bottom + 'px;padding:0 ' + margins.left + 'px;background:white;box-shadow:inset 0 -1px 0 #e5e7eb;">'
    breaksHtml += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;width:100%;height:100%;">'
    breaksHtml += '<div style="text-align:left;"></div>'
    breaksHtml += '<div style="text-align:center;"></div>'
    breaksHtml += '<div style="text-align:right;color:#6b7280;font-size:12px;">' + (displayOptions.showPageNumbers ? pageNumberText : '') + '</div>'
    breaksHtml += '</div></div>'
    
    // Gap mask between pages:
    // - stays wider than the page to hide the continuous side shadow
    // - has NO borders (borders would visibly extend past page edges)
    // - uses a subtle vertical gradient to blend with page shadows
    breaksHtml += '<div class="' + PAGE_GAP_CLASS + '" style="height:' + pageGap + 'px;position:relative;width:calc(100% + 14px)!important;left:-7px;background-color:var(--page-bg,#f3f4f6);background-image:linear-gradient(to bottom, rgba(0,0,0,0.035), rgba(0,0,0,0.00) 45%, rgba(0,0,0,0.00) 55%, rgba(0,0,0,0.035));"></div>'
    
    // Header
    // Draw the top separator line here so it stays within page width.
    breaksHtml += '<div class="' + PAGE_HEADER_CLASS + '" style="height:' + margins.top + 'px;padding:0 ' + margins.left + 'px;background:white;box-shadow:inset 0 1px 0 #e5e7eb;">'
    breaksHtml += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;width:100%;height:100%;">'
    breaksHtml += '<div style="text-align:left;"></div>'
    breaksHtml += '<div style="text-align:center;"></div>'
    breaksHtml += '<div style="text-align:right;"></div>'
    breaksHtml += '</div></div>'
    
    breaksHtml += '</div>' // close .breaker
    breaksHtml += '</div>' // close page break
  }
  
  container.innerHTML = breaksHtml
  
  return container
}

function createFirstPageHeader(layout: PageLayoutDimensions): HTMLElement {
  const { margins, page } = layout
  
  const wrapper = document.createElement('div')
  wrapper.className = FIRST_PAGE_HEADER_CLASS
  wrapper.setAttribute('contenteditable', 'false')
  wrapper.style.cssText = 'position:relative;height:' + margins.top + 'px;margin-left:-' + margins.left + 'px;margin-right:-' + margins.right + 'px;width:' + page.width + 'px;display:flex;align-items:center;pointer-events:none;user-select:none;background:white;box-sizing:border-box;padding:0 ' + margins.left + 'px;'
  
  wrapper.innerHTML = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;width:100%;"><div style="text-align:left;"></div><div style="text-align:center;"></div><div style="text-align:right;"></div></div>'
  
  return wrapper
}

function createLastPageFooter(
  layout: PageLayoutDimensions,
  totalPages: number,
  displayOptions: PageNumberDisplayOptions,
  contentHeight: number
): HTMLElement {
  const { margins, page, content } = layout
  
  // Calculate filler height needed to push footer to bottom of page
  // contentHeight is the total measured content height across all pages
  // We need to determine how much content is on the last page
  
  // Total space used by pages before the last one
  const previousPagesContentHeight = (totalPages - 1) * content.height
  
  // Content on the last page is the remainder
  const lastPageContentHeight = Math.max(0, contentHeight - previousPagesContentHeight)
  
  // If content exactly fills the page (or overflows), no filler needed
  // Otherwise, calculate remaining space to fill to push footer to bottom
  const fillerHeight = lastPageContentHeight >= content.height
    ? 0 
    : Math.max(0, content.height - lastPageContentHeight)
  
  const wrapper = document.createElement('div')
  wrapper.className = LAST_PAGE_FOOTER_CLASS
  wrapper.setAttribute('contenteditable', 'false')
  wrapper.style.cssText = 'position:relative;margin-left:-' + margins.left + 'px;margin-right:-' + margins.right + 'px;width:' + page.width + 'px;pointer-events:none;user-select:none;background:white;box-sizing:border-box;'
  
  const pageNumberText = displayOptions.formatPageNumber
    ? displayOptions.formatPageNumber(totalPages, totalPages, displayOptions.separator)
    : totalPages + ' ' + displayOptions.separator + ' ' + totalPages
  
  // Build HTML with filler and footer
  let html = ''
  
  // Filler to extend to bottom of content area
  if (fillerHeight > 0) {
    html += '<div class="' + LAST_PAGE_FILLER_CLASS + '" style="height:' + fillerHeight + 'px;background:white;"></div>'
  }
  
  // Footer with page number
  html += '<div class="' + LAST_PAGE_FOOTER_CONTENT_CLASS + '" style="height:' + margins.bottom + 'px;padding:0 ' + margins.left + 'px;display:flex;align-items:center;">'
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;align-items:center;width:100%;">'
  html += '<div style="text-align:left;"></div>'
  html += '<div style="text-align:center;"></div>'
  html += '<div style="text-align:right;color:#6b7280;font-size:12px;">' + (displayOptions.showPageNumbers ? pageNumberText : '') + '</div>'
  html += '</div></div>'
  
  wrapper.innerHTML = html
  
  return wrapper
}

function injectPaginationStyles() {
  const existingStyle = document.getElementById('ctp-pagination-styles')
  if (existingStyle) return
  
  const style = document.createElement('style')
  style.id = 'ctp-pagination-styles'
  style.textContent = `
    .${PAGINATION_CONTAINER_CLASS} {
      pointer-events: none;
    }
    .${PAGINATION_CONTAINER_CLASS} * {
      pointer-events: none;
      user-select: none;
    }
    /* Keep gap sizing stable if it ever gains borders again. */
    .${PAGE_GAP_CLASS} {
      box-sizing: border-box;
    }
    .${FIRST_PAGE_HEADER_CLASS},
    .${LAST_PAGE_FOOTER_CLASS} {
      box-sizing: border-box;
    }
    .${FIRST_PAGE_HEADER_CLASS} *,
    .${LAST_PAGE_FOOTER_CLASS} * {
      pointer-events: none;
      user-select: none;
    }
    @media print {
      .${PAGINATION_CONTAINER_CLASS} {
        display: none !important;
      }
      .${PAGE_GAP_CLASS} {
        display: none !important;
      }
      .${PAGE_BREAK_CLASS} {
        break-before: page;
      }
      .${FIRST_PAGE_HEADER_CLASS},
      .${LAST_PAGE_FOOTER_CLASS} {
        display: none !important;
      }
    }
  `
  document.head.appendChild(style)
}

export default Pagination
