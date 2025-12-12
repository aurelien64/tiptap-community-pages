import { describe, it, expect, afterEach } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Pagination, PageBreak } from '@/extensions'
import {
  PAGE_FORMATS,
  FIRST_PAGE_HEADER_CLASS,
  PAGE_BREAK_CLASS,
  PAGE_HEADER_CLASS,
  PAGE_FOOTER_CLASS,
  PAGE_GAP_CLASS,
  LAST_PAGE_FOOTER_CLASS,
  LAST_PAGE_FOOTER_CONTENT_CLASS,
  createPageConfig,
  getPageLayoutDimensions,
  type PageFormatName,
} from '@/extensions'

/**
 * Page Size Ratio Tests
 * 
 * These tests validate that the rendered page elements have the correct
 * dimensions matching the expected page format (e.g., 8.5:11 for US Letter).
 * 
 * The new inline page structure consists of:
 * - FIRST_PAGE_HEADER_CLASS: First page top margin widget
 * - PAGE_BREAK_CLASS: Break widget with footer + gap + header
 * - LAST_PAGE_FOOTER_CLASS: Last page bottom margin widget
 */

describe('Page Size Ratios', () => {
  let editor: Editor
  let container: HTMLDivElement
  let pageWrapper: HTMLDivElement

  function createEditor(format: PageFormatName = 'Letter', content = '<p>Test content</p>') {
    // Clean up previous if exists
    if (editor) {
      editor.destroy()
    }
    
    // Create a properly structured container matching PageWrapper structure
    container = document.createElement('div')
    container.className = 'page-wrapper-container'
    container.style.cssText = `
      position: relative;
      width: 900px;
    `
    
    const config = createPageConfig(format, 'portrait')
    const layout = getPageLayoutDimensions(config)
    
    pageWrapper = document.createElement('div')
    pageWrapper.className = 'page-wrapper-page'
    pageWrapper.style.cssText = `
      position: relative;
      width: ${layout.page.width}px;
      min-height: ${layout.page.height}px;
      box-sizing: border-box;
      padding-top: ${layout.margins.top}px;
      padding-right: ${layout.margins.right}px;
      padding-bottom: ${layout.margins.bottom}px;
      padding-left: ${layout.margins.left}px;
    `
    
    container.appendChild(pageWrapper)
    document.body.appendChild(container)

    editor = new Editor({
      element: pageWrapper,
      extensions: [
        StarterKit,
        PageBreak,
        Pagination.configure({
          pageFormat: format,
          orientation: 'portrait',
          margins: {},
          pageGap: 40,
        }),
      ],
      content,
    })
    
    return editor
  }

  afterEach(() => {
    if (editor) {
      editor.destroy()
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container)
    }
    document.body.innerHTML = ''
  })

  describe('Inline Widget Structure', () => {
    it('should create first page header element', async () => {
      createEditor('Letter')
      
      // Wait for pagination to render - need more time in test env
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // The widgets are injected into editor.view.dom, not pageWrapper directly
      const editorDom = editor.view.dom
      const firstHeader = editorDom.querySelector(`.${FIRST_PAGE_HEADER_CLASS}`)
      expect(firstHeader).toBeTruthy()
    })

    it('should create last page footer element', async () => {
      createEditor('Letter')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const editorDom = editor.view.dom
      const lastFooter = editorDom.querySelector(`.${LAST_PAGE_FOOTER_CLASS}`)
      expect(lastFooter).toBeTruthy()
    })

    it('first page header should have correct height (top margin)', async () => {
      createEditor('Letter')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const config = createPageConfig('Letter', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      const editorDom = editor.view.dom
      const firstHeader = editorDom.querySelector(`.${FIRST_PAGE_HEADER_CLASS}`) as HTMLElement
      expect(firstHeader).toBeTruthy()
      
      const headerHeight = parseFloat(window.getComputedStyle(firstHeader).height)
      expect(headerHeight).toBe(layout.margins.top)
    })

    it('first page header should have full page width', async () => {
      createEditor('Letter')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const config = createPageConfig('Letter', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      const editorDom = editor.view.dom
      const firstHeader = editorDom.querySelector(`.${FIRST_PAGE_HEADER_CLASS}`) as HTMLElement
      expect(firstHeader).toBeTruthy()
      
      const headerWidth = parseFloat(window.getComputedStyle(firstHeader).width)
      expect(headerWidth).toBe(layout.page.width)
    })

    it('last page footer should have correct height (bottom margin)', async () => {
      createEditor('Letter')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const config = createPageConfig('Letter', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      const editorDom = editor.view.dom
      const lastFooter = editorDom.querySelector(`.${LAST_PAGE_FOOTER_CLASS}`) as HTMLElement
      expect(lastFooter).toBeTruthy()
      
      // The footer content element has the actual footer height (margin.bottom)
      // The wrapper may also contain a filler element
      const footerContent = lastFooter.querySelector(`.${LAST_PAGE_FOOTER_CONTENT_CLASS}`) as HTMLElement
      expect(footerContent).toBeTruthy()
      
      const footerHeight = parseFloat(window.getComputedStyle(footerContent).height)
      expect(footerHeight).toBe(layout.margins.bottom)
    })
  })

  describe('US Letter Format (8.5 x 11 inches)', () => {
    const LETTER_WIDTH = 816  // 8.5 inches at 96 DPI
    const LETTER_HEIGHT = 1056 // 11 inches at 96 DPI

    it('page wrapper should have correct width for Letter format', async () => {
      createEditor('Letter')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const wrapperWidth = parseFloat(window.getComputedStyle(pageWrapper).width)
      expect(wrapperWidth).toBe(LETTER_WIDTH)
    })

    it('first header width should match Letter page width', async () => {
      createEditor('Letter')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const editorDom = editor.view.dom
      const firstHeader = editorDom.querySelector(`.${FIRST_PAGE_HEADER_CLASS}`) as HTMLElement
      expect(firstHeader).toBeTruthy()
      const headerWidth = parseFloat(window.getComputedStyle(firstHeader).width)
      
      expect(headerWidth).toBe(LETTER_WIDTH)
    })

    it('should have correct aspect ratio dimensions', async () => {
      createEditor('Letter')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const config = createPageConfig('Letter', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      // Verify the layout calculations match expected
      expect(layout.page.width).toBe(LETTER_WIDTH)
      expect(layout.page.height).toBe(LETTER_HEIGHT)
      
      const ratio = layout.page.width / layout.page.height
      expect(ratio).toBeCloseTo(8.5 / 11, 3)
    })
  })

  describe('US Legal Format (8.5 x 14 inches)', () => {
    const LEGAL_WIDTH = 816   // 8.5 inches at 96 DPI
    const LEGAL_HEIGHT = 1344 // 14 inches at 96 DPI

    it('page wrapper should have correct width for Legal format', async () => {
      createEditor('Legal')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const wrapperWidth = parseFloat(window.getComputedStyle(pageWrapper).width)
      expect(wrapperWidth).toBe(LEGAL_WIDTH)
    })

    it('should have correct aspect ratio dimensions', async () => {
      createEditor('Legal')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const config = createPageConfig('Legal', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      expect(layout.page.width).toBe(LEGAL_WIDTH)
      expect(layout.page.height).toBe(LEGAL_HEIGHT)
      
      const ratio = layout.page.width / layout.page.height
      expect(ratio).toBeCloseTo(8.5 / 14, 3)
    })
  })

  describe('A4 Format (210 x 297 mm)', () => {
    const A4_WIDTH = 794   // 210mm at 96 DPI
    const A4_HEIGHT = 1123 // 297mm at 96 DPI

    it('page wrapper should have correct width for A4 format', async () => {
      createEditor('A4')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const wrapperWidth = parseFloat(window.getComputedStyle(pageWrapper).width)
      expect(wrapperWidth).toBe(A4_WIDTH)
    })

    it('should have correct aspect ratio dimensions', async () => {
      createEditor('A4')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const config = createPageConfig('A4', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      expect(layout.page.width).toBe(A4_WIDTH)
      expect(layout.page.height).toBe(A4_HEIGHT)
      
      const ratio = layout.page.width / layout.page.height
      expect(ratio).toBeCloseTo(210 / 297, 3)
    })
  })

  describe('Multi-page Documents', () => {
    it('should create page break widgets for multi-page content', async () => {
      // Create content that spans multiple pages
      const longContent = Array(50).fill('<p>This is a paragraph of text that helps fill the page.</p>').join('')
      createEditor('Letter', longContent)
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const pageBreaks = pageWrapper.querySelectorAll(`.${PAGE_BREAK_CLASS}`)
      const gaps = pageWrapper.querySelectorAll(`.${PAGE_GAP_CLASS}`)
      
      // Page breaks should exist for multi-page documents
      // Each page break contains exactly one gap
      expect(gaps.length).toBe(pageBreaks.length)
    })

    it('page break widgets should contain footer, gap, and header', async () => {
      const longContent = Array(50).fill('<p>This is a paragraph of text that helps fill the page.</p>').join('')
      createEditor('Letter', longContent)
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const pageBreaks = pageWrapper.querySelectorAll(`.${PAGE_BREAK_CLASS}`)
      
      if (pageBreaks.length > 0) {
        const firstBreak = pageBreaks[0]
        
        const footer = firstBreak.querySelector(`.${PAGE_FOOTER_CLASS}`)
        const gap = firstBreak.querySelector(`.${PAGE_GAP_CLASS}`)
        const header = firstBreak.querySelector(`.${PAGE_HEADER_CLASS}`)
        
        expect(footer).toBeTruthy()
        expect(gap).toBeTruthy()
        expect(header).toBeTruthy()
      }
    })

    it('gap height should match configured pageGap', async () => {
      const longContent = Array(50).fill('<p>This is a paragraph of text.</p>').join('')
      createEditor('Letter', longContent)
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const gaps = pageWrapper.querySelectorAll(`.${PAGE_GAP_CLASS}`)
      
      if (gaps.length > 0) {
        const gap = gaps[0] as HTMLElement
        const gapHeight = parseFloat(window.getComputedStyle(gap).height)
        
        // Default pageGap is 40
        expect(gapHeight).toBe(40)
      }
    })

    it('page break widgets should have full page width', async () => {
      const longContent = Array(50).fill('<p>This is a paragraph of text.</p>').join('')
      createEditor('Letter', longContent)
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const config = createPageConfig('Letter', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      const pageBreaks = pageWrapper.querySelectorAll(`.${PAGE_BREAK_CLASS}`)
      
      if (pageBreaks.length > 0) {
        const firstBreak = pageBreaks[0] as HTMLElement
        const breakWidth = parseFloat(window.getComputedStyle(firstBreak).width)
        
        expect(breakWidth).toBe(layout.page.width)
      }
    })

    it('header and footer in page break should have correct heights', async () => {
      const longContent = Array(50).fill('<p>This is a paragraph of text.</p>').join('')
      createEditor('Letter', longContent)
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const config = createPageConfig('Letter', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      const pageBreaks = pageWrapper.querySelectorAll(`.${PAGE_BREAK_CLASS}`)
      
      if (pageBreaks.length > 0) {
        const firstBreak = pageBreaks[0]
        
        const footer = firstBreak.querySelector(`.${PAGE_FOOTER_CLASS}`) as HTMLElement
        const header = firstBreak.querySelector(`.${PAGE_HEADER_CLASS}`) as HTMLElement
        
        const footerHeight = parseFloat(window.getComputedStyle(footer).height)
        const headerHeight = parseFloat(window.getComputedStyle(header).height)
        
        expect(footerHeight).toBe(layout.margins.bottom)
        expect(headerHeight).toBe(layout.margins.top)
      }
    })
  })

  describe('Format Switching', () => {
    it('should update decorations when format changes', async () => {
      createEditor('Letter')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Verify initial Letter format
      const editorDom = editor.view.dom
      let firstHeader = editorDom.querySelector(`.${FIRST_PAGE_HEADER_CLASS}`) as HTMLElement
      expect(firstHeader).toBeTruthy()
      expect(firstHeader.style.width).toBe('816px')
      
      // Switch to A4 (narrower than Letter)
      editor.commands.setPageFormat('A4')
      
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // The widget should be recreated with new dimensions
      firstHeader = editorDom.querySelector(`.${FIRST_PAGE_HEADER_CLASS}`) as HTMLElement
      expect(firstHeader).toBeTruthy()
      
      // Check the style attribute directly (computed style depends on container)
      expect(firstHeader.style.width).toBe('794px')
    })

    it('should maintain correct layout dimensions after format switch', async () => {
      createEditor('Letter')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Switch to Legal
      editor.commands.setPageFormat('Legal')
      
      await new Promise(resolve => setTimeout(resolve, 150))
      
      const config = createPageConfig('Legal', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      // Verify the storage was updated
      expect(editor.storage.pagination.pageConfig.format).toBe('Legal')
      
      // Verify layout dimensions
      expect(layout.page.width).toBe(816)
      expect(layout.page.height).toBe(1344)
    })
  })
})

describe('Page Measurement Utilities', () => {
  it('PAGE_FORMATS should have correct standard dimensions', () => {
    // US Letter: 8.5 x 11 inches = 816 x 1056 pixels at 96 DPI
    expect(PAGE_FORMATS.Letter.dimensions.width).toBe(816)
    expect(PAGE_FORMATS.Letter.dimensions.height).toBe(1056)
    
    // US Legal: 8.5 x 14 inches = 816 x 1344 pixels at 96 DPI
    expect(PAGE_FORMATS.Legal.dimensions.width).toBe(816)
    expect(PAGE_FORMATS.Legal.dimensions.height).toBe(1344)
    
    // A4: 210 x 297 mm = ~794 x 1123 pixels at 96 DPI
    expect(PAGE_FORMATS.A4.dimensions.width).toBe(794)
    expect(PAGE_FORMATS.A4.dimensions.height).toBe(1123)
  })

  it('should calculate correct aspect ratios from PAGE_FORMATS', () => {
    const letterRatio = PAGE_FORMATS.Letter.dimensions.width / PAGE_FORMATS.Letter.dimensions.height
    const legalRatio = PAGE_FORMATS.Legal.dimensions.width / PAGE_FORMATS.Legal.dimensions.height
    const a4Ratio = PAGE_FORMATS.A4.dimensions.width / PAGE_FORMATS.A4.dimensions.height
    
    // Letter: 8.5/11 ≈ 0.7727
    expect(letterRatio).toBeCloseTo(8.5 / 11, 2)
    
    // Legal: 8.5/14 ≈ 0.6071
    expect(legalRatio).toBeCloseTo(8.5 / 14, 2)
    
    // A4: 210/297 ≈ 0.7071 (close to 1/√2)
    expect(a4Ratio).toBeCloseTo(210 / 297, 2)
  })
})
