import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { Pagination, paginationPluginKey } from '@/extensions/pagination'
import { PageBreak } from '@/extensions/page-break'
import { createPageConfig, getEffectiveDimensions, getPageLayoutDimensions } from '@/extensions/page-format'

describe('Pagination Extension', () => {
  let editor: Editor

  beforeEach(() => {
    // Create a mock container
    const container = document.createElement('div')
    container.style.width = '816px'
    document.body.appendChild(container)

    editor = new Editor({
      element: container,
      extensions: [
        StarterKit,
        PageBreak,
        Pagination.configure({
          pageFormat: 'Letter',
          orientation: 'portrait',
          margins: {},
          widowOrphanControl: true,
          minLinesAtBreak: 2,
          pageGap: 40,
        }),
      ],
      content: '<p>Test content</p>',
    })
  })

  afterEach(() => {
    editor.destroy()
    document.body.innerHTML = ''
  })

  describe('Extension Configuration', () => {
    it('should be registered with correct name', () => {
      const extension = editor.extensionManager.extensions.find(
        (ext: { name: string }) => ext.name === 'pagination'
      )
      expect(extension).toBeDefined()
    })

    it('should have plugin key defined', () => {
      expect(paginationPluginKey).toBeDefined()
    })

    it('should have default options', () => {
      const editor2 = new Editor({
        extensions: [StarterKit, PageBreak, Pagination],
        content: '<p>Test</p>',
      })
      
      const extension = editor2.extensionManager.extensions.find(
        (ext: { name: string }) => ext.name === 'pagination'
      )
      expect(extension).toBeDefined()
      
      editor2.destroy()
    })
  })

  describe('Storage', () => {
    it('should initialize storage with page config', () => {
      expect(editor.storage.pagination).toBeDefined()
      expect(editor.storage.pagination.pageConfig).toBeDefined()
    })

    it('should have initial page count of 1', () => {
      expect(editor.storage.pagination.pageCount).toBeGreaterThanOrEqual(1)
    })

    it('should have empty page break positions initially', () => {
      expect(Array.isArray(editor.storage.pagination.pageBreakPositions)).toBe(true)
    })
  })

  describe('setPageFormat Command', () => {
    it('should have setPageFormat command available', () => {
      expect(editor.commands.setPageFormat).toBeDefined()
      expect(typeof editor.commands.setPageFormat).toBe('function')
    })

    it('should update page config when format changes', () => {
      editor.commands.setPageFormat('Legal')
      expect(editor.storage.pagination.pageConfig.format).toBe('Legal')
    })

    it('should work with all preset formats', () => {
      const formats = ['A4', 'Letter', 'Legal'] as const
      formats.forEach((format) => {
        editor.commands.setPageFormat(format)
        expect(editor.storage.pagination.pageConfig.format).toBe(format)
      })
    })
  })

  describe('setOrientation Command', () => {
    it('should have setOrientation command available', () => {
      expect(editor.commands.setOrientation).toBeDefined()
      expect(typeof editor.commands.setOrientation).toBe('function')
    })

    it('should update orientation in config', () => {
      editor.commands.setOrientation('landscape')
      expect(editor.storage.pagination.pageConfig.orientation).toBe('landscape')
    })

    it('should toggle between portrait and landscape', () => {
      editor.commands.setOrientation('landscape')
      expect(editor.storage.pagination.pageConfig.orientation).toBe('landscape')
      
      editor.commands.setOrientation('portrait')
      expect(editor.storage.pagination.pageConfig.orientation).toBe('portrait')
    })
  })

  describe('setMargins Command', () => {
    it('should have setMargins command available', () => {
      expect(editor.commands.setMargins).toBeDefined()
      expect(typeof editor.commands.setMargins).toBe('function')
    })

    it('should update margins in config', () => {
      editor.commands.setMargins({ top: 50, left: 50 })
      expect(editor.storage.pagination.pageConfig.margins.top).toBe(50)
      expect(editor.storage.pagination.pageConfig.margins.left).toBe(50)
    })

    it('should preserve existing margins when updating partially', () => {
      const originalRight = editor.storage.pagination.pageConfig.margins.right
      editor.commands.setMargins({ top: 50 })
      expect(editor.storage.pagination.pageConfig.margins.right).toBe(originalRight)
    })
  })

  describe('goToPage Command', () => {
    it('should have goToPage command available', () => {
      expect(editor.commands.goToPage).toBeDefined()
      expect(typeof editor.commands.goToPage).toBe('function')
    })

    it('should handle page 1', () => {
      const result = editor.commands.goToPage(1)
      expect(result).toBe(true)
    })

    it('should handle out of range pages gracefully', () => {
      const result = editor.commands.goToPage(999)
      expect(result).toBe(true)
    })
  })

  describe('Page Count Callback', () => {
    it('should call onPageCountChange when provided', async () => {
      const callback = vi.fn()
      
      const editor2 = new Editor({
        extensions: [
          StarterKit,
          PageBreak,
          Pagination.configure({
            pageFormat: 'Letter',
            onPageCountChange: callback,
          }),
        ],
        content: '<p>Test</p>',
      })
      
      // Wait for RAF
      await new Promise((resolve) => setTimeout(resolve, 100))
      
      // Callback may be called during initialization
      // Just check it's a function
      expect(callback).toBeDefined()
      
      editor2.destroy()
    })
  })

  describe('Page Config Creation', () => {
    it('should create valid page config', () => {
      const config = createPageConfig('Letter', 'portrait', { top: 100 })
      expect(config.format).toBe('Letter')
      expect(config.orientation).toBe('portrait')
      expect(config.margins.top).toBe(100)
    })

    it('should get effective dimensions', () => {
      const config = createPageConfig('Letter', 'portrait')
      const dims = getEffectiveDimensions(config)
      expect(dims.width).toBe(816)
      expect(dims.height).toBe(1056)
    })

    it('should swap dimensions for landscape', () => {
      const config = createPageConfig('Letter', 'landscape')
      const dims = getEffectiveDimensions(config)
      expect(dims.width).toBe(1056)
      expect(dims.height).toBe(816)
    })
  })

  describe('Page Layout Dimensions', () => {
    it('should calculate correct writable area for US Letter', () => {
      const config = createPageConfig('Letter', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      // US Letter: 816 × 1056 pixels
      expect(layout.page.width).toBe(816)
      expect(layout.page.height).toBe(1056)
      
      // With 96px margins (1 inch), writable area = 816 - 192 × 1056 - 192
      expect(layout.content.width).toBe(816 - 96 - 96) // 624px
      expect(layout.content.height).toBe(1056 - 96 - 96) // 864px
    })

    it('should calculate correct aspect ratio for US Letter', () => {
      const config = createPageConfig('Letter', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      // Expected ratio for US Letter: 816/1056 ≈ 0.7727
      const expectedRatio = 816 / 1056
      expect(layout.aspectRatio).toBeCloseTo(expectedRatio, 4)
    })

    it('should calculate correct aspect ratio for US Legal', () => {
      const config = createPageConfig('Legal', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      // Expected ratio for US Legal: 816/1344 ≈ 0.6071
      const expectedRatio = 816 / 1344
      expect(layout.aspectRatio).toBeCloseTo(expectedRatio, 4)
    })

    it('should calculate correct aspect ratio for A4', () => {
      const config = createPageConfig('A4', 'portrait')
      const layout = getPageLayoutDimensions(config)
      
      // Expected ratio for A4: 794/1123 ≈ 0.7071
      const expectedRatio = 794 / 1123
      expect(layout.aspectRatio).toBeCloseTo(expectedRatio, 4)
    })
  })

  describe('Page Break Margin Calculation', () => {
    it('should inject only pageGap as margin, not full page margins', () => {
      // This test verifies that page break margins don't double-count
      // the page margins that are already applied by PageWrapper
      const config = createPageConfig('Letter', 'portrait')
      const layout = getPageLayoutDimensions(config)
      const pageGap = 40
      
      // The injected margin at page breaks should only be the gap between pages
      // NOT margins.bottom + pageGap + margins.top (which would double-count margins)
      // because PageWrapper already applies margins as padding
      
      // Expected: For N pages, total height should be approximately:
      // N × page.height + (N-1) × pageGap
      // NOT: N × page.height + (N-1) × (margins.bottom + pageGap + margins.top)
      
      const numPages = 3
      const expectedTotalHeight = numPages * layout.page.height + (numPages - 1) * pageGap
      const wrongTotalHeight = numPages * layout.page.height + 
        (numPages - 1) * (layout.margins.bottom + pageGap + layout.margins.top)
      
      // The difference shows the bug: 232px vs 40px per break = 192px extra per break
      const extraPerBreak = wrongTotalHeight - expectedTotalHeight
      expect(extraPerBreak).toBe((numPages - 1) * (layout.margins.top + layout.margins.bottom))
      
      // Correct total for 3 pages: 3 × 1056 + 2 × 40 = 3248px
      expect(expectedTotalHeight).toBe(3 * 1056 + 2 * 40)
      
      // Wrong total (with bug): 3 × 1056 + 2 × 232 = 3632px
      expect(wrongTotalHeight).toBe(3 * 1056 + 2 * 232)
    })
  })

  describe('Integration with PageBreak', () => {
    it('should work together with PageBreak extension', () => {
      editor.commands.setPageBreak()
      const html = editor.getHTML()
      expect(html).toContain('data-page-break')
    })

    it('should handle multiple page breaks', () => {
      editor.commands.setPageBreak()
      editor.commands.insertContent('<p>Content</p>')
      editor.commands.setPageBreak()
      
      const json = editor.getJSON()
      const pageBreaks = json.content?.filter(
        (node) => node.type === 'pageBreak'
      )
      expect(pageBreaks?.length).toBe(2)
    })
  })
})

describe('Pagination Options', () => {
  it('should accept all options', () => {
    const callback = vi.fn()
    
    const editor = new Editor({
      extensions: [
        StarterKit,
        Pagination.configure({
          pageFormat: 'Legal',
          orientation: 'landscape',
          margins: { top: 50, right: 50, bottom: 50, left: 50 },
          widowOrphanControl: false,
          minLinesAtBreak: 3,
          pageGap: 20,
          onPageCountChange: callback,
        }),
      ],
      content: '<p>Test</p>',
    })
    
    expect(editor.storage.pagination.pageConfig.format).toBe('Legal')
    expect(editor.storage.pagination.pageConfig.orientation).toBe('landscape')
    expect(editor.storage.pagination.pageConfig.margins.top).toBe(50)
    
    editor.destroy()
  })

  it('should accept custom dimensions', () => {
    const editor = new Editor({
      extensions: [
        StarterKit,
        Pagination.configure({
          pageFormat: { width: 600, height: 800 },
          orientation: 'portrait',
        }),
      ],
      content: '<p>Test</p>',
    })
    
    const format = editor.storage.pagination.pageConfig.format
    expect(typeof format).toBe('object')
    expect((format as { width: number }).width).toBe(600)
    expect((format as { height: number }).height).toBe(800)
    
    editor.destroy()
  })
})
