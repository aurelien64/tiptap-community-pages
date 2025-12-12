'use client'

import React, { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  PageConfig,
  PageFormatName,
  PageOrientation,
  PageMargins,
  createPageConfig,
  getPageLayoutDimensions,
} from '../extensions/page-format'

export interface PageWrapperProps {
  /**
   * Page format preset or custom dimensions
   */
  format?: PageFormatName | { width: number; height: number }
  
  /**
   * Page orientation
   */
  orientation?: PageOrientation
  
  /**
   * Page margins
   */
  margins?: Partial<PageMargins>
  
  /**
   * Children (typically EditorContent)
   */
  children: React.ReactNode
  
  /**
   * Whether to show page shadow
   */
  showShadow?: boolean
  
  /**
   * Background color for the container
   */
  containerBackground?: string
  
  /**
   * Additional class names for the container
   */
  containerClassName?: string
  
  /**
   * Additional class names for the page
   */
  pageClassName?: string
  
  /**
   * Additional styles for the page
   */
  pageStyle?: CSSProperties
  
  /**
   * Scale factor for the page (1 = 100%)
   */
  scale?: number

  /**
   * When true, the page scales down to fit narrower containers (mobile-friendly).
   * Does not scale above the provided `scale`.
   */
  responsive?: boolean

  /**
   * Minimum auto scale when responsive (prevents extreme shrink).
   */
  minScale?: number

  /**
   * Optional test id for E2E/smoke tests
   */
  testId?: string
}

/**
 * PageWrapper Component
 * 
 * A React component that wraps the Tiptap editor content and applies
 * page-like styling (width, height, margins, shadow) based on the
 * selected page format.
 * 
 * This component handles the visual "page" appearance while the
 * Pagination extension handles the actual content flow and page breaks.
 * 
 * IMPORTANT: Uses box-sizing: border-box so that declared dimensions
 * include padding (margins). This ensures the page aspect ratio is correct.
 */
export function PageWrapper({
  format = 'Letter',
  orientation = 'portrait',
  margins,
  children,
  showShadow = true,
  containerBackground = '#f3f4f6',
  containerClassName = '',
  pageClassName = '',
  pageStyle = {},
  scale = 1,
  responsive = true,
  minScale = 0.25,
  testId,
}: PageWrapperProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const scaledOuterRef = useRef<HTMLDivElement | null>(null)
  const pageRef = useRef<HTMLDivElement | null>(null)
  const [fitScale, setFitScale] = useState(1)
  const [unscaledHeight, setUnscaledHeight] = useState(0)

  const config: PageConfig = useMemo(() => {
    return createPageConfig(format, orientation, margins)
  }, [format, orientation, margins])

  const layout = useMemo(() => {
    return getPageLayoutDimensions(config)
  }, [config])

  const effectiveScale = useMemo(() => {
    if (!responsive) return scale
    const capped = Math.min(scale, fitScale)
    return Math.max(minScale, Math.min(1, capped))
  }, [responsive, scale, fitScale, minScale])

  // Push dynamic values into CSS variables / element styles (no JSX inline styles).
  useEffect(() => {
    const containerEl = containerRef.current
    const pageEl = pageRef.current
    const scaledOuterEl = scaledOuterRef.current
    if (!containerEl || !pageEl || !scaledOuterEl) return

    containerEl.style.setProperty('--page-bg', containerBackground)
    pageEl.style.setProperty('--ctp-page-scale', String(effectiveScale))
    pageEl.style.setProperty('--ctp-page-width', `${layout.page.width}px`)
    pageEl.style.setProperty('--ctp-margin-left', `${layout.margins.left}px`)
    pageEl.style.setProperty('--ctp-margin-right', `${layout.margins.right}px`)

    const shadow = showShadow ? '0 10px 10px rgba(0, 0, 0, 0.12)' : 'none'
    pageEl.style.setProperty('--ctp-page-shadow', shadow)

    const scaledWidth = Math.ceil(layout.page.width * effectiveScale)
    const baseHeight = Math.max(unscaledHeight || layout.page.height, 1)
    const scaledHeight = Math.ceil(baseHeight * effectiveScale)
    scaledOuterEl.style.setProperty('--ctp-scaled-width', `${scaledWidth}px`)
    scaledOuterEl.style.setProperty('--ctp-scaled-height', `${scaledHeight}px`)

    // Apply optional overrides from props
    if (pageStyle && Object.keys(pageStyle).length > 0) {
      Object.assign(pageEl.style, pageStyle)
    }
  }, [
    containerBackground,
    effectiveScale,
    layout.page.width,
    layout.page.height,
    layout.margins.left,
    layout.margins.right,
    pageStyle,
    showShadow,
    unscaledHeight,
  ])

  // Compute fit-to-width scale when container is narrower than the page.
  useEffect(() => {
    if (!responsive) return
    const viewportEl = viewportRef.current
    if (!viewportEl) return

    const update = () => {
      const available = viewportEl.clientWidth
      if (!available || !Number.isFinite(available)) return
      const next = Math.min(1, available / layout.page.width)
      setFitScale(Math.max(minScale, next))
    }

    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(viewportEl)
    return () => ro.disconnect()
  }, [responsive, layout.page.width, minScale])

  // Measure unscaled height so we can size the outer wrapper to the scaled height.
  useEffect(() => {
    const pageEl = pageRef.current
    if (!pageEl) return

    const update = () => {
      // offsetHeight is unaffected by CSS transforms (we want the unscaled value)
      const h = pageEl.offsetHeight
      setUnscaledHeight(h)
    }

    update()
    const ro = new ResizeObserver(() => update())
    ro.observe(pageEl)
    return () => ro.disconnect()
  }, [layout.page.width, layout.margins.left, layout.margins.right])

  // Page visuals:
  // - Full page width with white background
  // - Horizontal padding (left/right margins) for content area
  // - Vertical margins (top/bottom) are rendered by the pagination widgets
  return (
    <div
      ref={containerRef}
      className={`page-wrapper-container ${containerClassName}`}
      data-testid={testId}
    >
      <div ref={viewportRef} className="page-wrapper-viewport">
        <div ref={scaledOuterRef} className="page-wrapper-scaled-outer">
          <div
            ref={pageRef}
            className={`page-wrapper-page ${pageClassName}`}
            data-page-format={typeof format === 'string' ? format : 'custom'}
            data-page-orientation={orientation}
            data-page-width={layout.page.width}
            data-page-height={layout.page.height}
            data-content-height={layout.content.height}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook to get current page configuration
 */
export function usePageConfig(
  format: PageFormatName | { width: number; height: number } = 'Letter',
  orientation: PageOrientation = 'portrait',
  margins?: Partial<PageMargins>
) {
  return useMemo(() => {
    const config = createPageConfig(format, orientation, margins)
    const layout = getPageLayoutDimensions(config)
    return { config, ...layout }
  }, [format, orientation, margins])
}

export default PageWrapper
