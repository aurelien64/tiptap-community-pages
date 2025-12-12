'use client'

import React, { useMemo, CSSProperties } from 'react'
import {
  PageConfig,
  PageFormatName,
  PageOrientation,
  PageMargins,
  createPageConfig,
  getPageLayoutDimensions,
} from '@/extensions/page-format'

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
}: PageWrapperProps) {
  const config: PageConfig = useMemo(() => {
    return createPageConfig(format, orientation, margins)
  }, [format, orientation, margins])

  const layout = useMemo(() => {
    return getPageLayoutDimensions(config)
  }, [config])

  const containerStyles: CSSProperties = {
    backgroundColor: containerBackground,
    padding: '40px 20px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    overflow: 'auto',
    // CSS variable for page background (used by overlays)
    ['--page-bg' as string]: containerBackground,
  }

  // Page visuals:
  // - Full page width with white background
  // - Horizontal padding (left/right margins) for content area
  // - Vertical margins (top/bottom) are rendered by the pagination widgets
  const pageStyles: CSSProperties = {
    width: layout.page.width * scale,
    boxSizing: 'border-box',
    backgroundColor: 'white',
    boxShadow: showShadow ? '0 10px 10px rgba(0, 0, 0, 0.12)' : 'none',
    // border: '1px solid #e5e5e5',
    // Only horizontal padding (left/right margins)
    // Top/bottom margins are handled by pagination header/footer decorations
    paddingRight: layout.margins.right * scale,
    paddingLeft: layout.margins.left * scale,
    position: 'relative',
    transformOrigin: 'top center',
    overflow: 'visible',
    ...pageStyle,
  }

  return (
    <div
      className={`page-wrapper-container ${containerClassName}`}
      style={containerStyles}
    >
      <div
        className={`page-wrapper-page ${pageClassName}`}
        style={pageStyles}
        data-page-format={typeof format === 'string' ? format : 'custom'}
        data-page-orientation={orientation}
        data-page-width={layout.page.width}
        data-page-height={layout.page.height}
        data-content-height={layout.content.height}
      >
        {children}
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
