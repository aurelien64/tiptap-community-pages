'use client'

import { useState, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { PageWrapper } from '@/components/PageWrapper'
import { Toolbar } from '@/components/Toolbar'
import { PageBreak, Pagination, PageFormatName, PageOrientation } from '@/extensions'

const SAMPLE_CONTENT = `
<h1>Community Tiptap Pages Demo</h1>

<p>This is a demonstration of the <strong>Community Tiptap Pages</strong> extension. It provides WYSIWYG pagination similar to word processors, supporting legal document formats.</p>

<h2>Features</h2>

<ul>
  <li><strong>Multiple Page Formats:</strong> Support for A4, US Letter, and US Legal paper sizes</li>
  <li><strong>Portrait & Landscape:</strong> Switch orientation dynamically</li>
  <li><strong>Hard Page Breaks:</strong> Press <code>Ctrl+Enter</code> (or <code>Cmd+Enter</code> on Mac) to insert a manual page break</li>
  <li><strong>Print Support:</strong> Proper page breaks when printing to PDF</li>
  <li><strong>Widow/Orphan Control:</strong> Prevents single lines at page boundaries</li>
</ul>

<h2>How It Works</h2>

<p>The document remains a single continuous ProseMirror document, but is visually rendered as separate pages. This "continuous flow" model means:</p>

<ol>
  <li>The document structure stays flat for easy data storage</li>
  <li>Text flows automatically from page to page</li>
  <li>Redaction and search work seamlessly across pages</li>
  <li>No manual page management is required</li>
</ol>

<h2>Legal Document Support</h2>

<p>This extension was designed with legal SaaS applications in mind. It supports:</p>

<blockquote>
  <p>"The pagination system must handle US Legal format (8.5" × 14") alongside standard Letter and international A4 formats, with 1-inch margins by default."</p>
</blockquote>

<h3>Supported Formats</h3>

<p><strong>US Letter</strong> - 8.5 × 11 inches (816 × 1056 pixels at 96 DPI)</p>
<p><strong>US Legal</strong> - 8.5 × 14 inches (816 × 1344 pixels at 96 DPI)</p>
<p><strong>A4</strong> - 210 × 297 mm (794 × 1123 pixels at 96 DPI)</p>

<h2>Try It Out</h2>

<p>Use the toolbar above to switch between page formats and orientations. Add more content to see automatic pagination in action!</p>

<h2>Section 1: Introduction to Document Management</h2>

<p>Document management systems have evolved significantly over the past decades. From paper-based filing systems to sophisticated digital platforms, the way we handle documents has undergone a complete transformation. Modern document management requires careful attention to formatting, pagination, and accessibility.</p>

<p>The importance of proper pagination cannot be overstated, especially in legal and professional contexts. Documents that flow naturally from page to page, with appropriate margins and formatting, enhance readability and maintain professional standards.</p>

<h3>1.1 Historical Context</h3>

<p>The history of document formatting dates back to the invention of the printing press. Johannes Gutenberg's revolutionary invention in the 15th century established many conventions we still use today, including consistent margins, paragraph spacing, and page breaks.</p>

<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p>

<h3>1.2 Digital Transformation</h3>

<p>The advent of digital documents brought new challenges and opportunities. Word processors introduced WYSIWYG editing, allowing users to see exactly how their documents would appear when printed. This paradigm shift made document creation more accessible to non-technical users.</p>

<p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.</p>

<h2>Section 2: Understanding Page Formats</h2>

<p>Different regions and industries have adopted various page format standards. Understanding these standards is crucial for creating documents that meet professional requirements.</p>

<h3>2.1 North American Standards</h3>

<p>In North America, the US Letter format (8.5 × 11 inches) is the standard for general business correspondence. The US Legal format (8.5 × 14 inches) is commonly used for legal documents, contracts, and official government forms.</p>

<p>The longer legal format provides additional space for lengthy legal text, footnotes, and signatures. Many law firms and government agencies require specific formatting guidelines that take advantage of this extra space.</p>

<h3>2.2 International Standards</h3>

<p>The ISO 216 standard, which includes A4 paper, is used throughout most of the world. A4 paper (210 × 297 mm) offers a slightly different aspect ratio compared to US Letter, which can affect document layout and design considerations.</p>

<p>Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.</p>

<h2>Section 3: Technical Implementation</h2>

<p>Implementing a robust pagination system requires careful consideration of various technical factors. The continuous flow model used in this extension maintains document integrity while providing visual page separation.</p>

<h3>3.1 Content Measurement</h3>

<p>Accurate content measurement is essential for determining page break positions. The system uses requestAnimationFrame for efficient DOM measurements, ensuring smooth performance even with large documents.</p>

<p>At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi.</p>

<h3>3.2 Break Calculation</h3>

<p>The algorithm for calculating page breaks considers multiple factors including element heights, widow/orphan control, and hard page break nodes. This ensures that content is distributed across pages in a visually pleasing manner.</p>

<p>Id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.</p>

<h2>Section 4: Best Practices</h2>

<p>When creating documents with this pagination system, following best practices ensures optimal results.</p>

<h3>4.1 Content Structure</h3>

<p>Organize your content with clear headings and logical paragraph breaks. This not only improves readability but also helps the pagination system make better decisions about where to place page breaks.</p>

<ul>
  <li>Use semantic heading levels (H1, H2, H3) consistently</li>
  <li>Keep paragraphs focused on single topics</li>
  <li>Avoid overly long paragraphs that might awkwardly span pages</li>
  <li>Use lists and blockquotes to break up dense text</li>
</ul>

<h3>4.2 Formatting Guidelines</h3>

<p>Consistent formatting throughout your document maintains professionalism and ensures predictable pagination behavior.</p>

<ol>
  <li>Maintain consistent margins throughout the document</li>
  <li>Use hard page breaks sparingly and intentionally</li>
  <li>Consider how content will flow when switching between formats</li>
  <li>Test your document in multiple formats before final production</li>
</ol>

<h2>Section 5: Advanced Features</h2>

<p>Beyond basic pagination, this extension provides several advanced features for power users.</p>

<h3>5.1 Dynamic Format Switching</h3>

<p>The ability to switch between page formats dynamically allows for flexible document design. Content automatically reflows to accommodate the new dimensions, maintaining visual coherence.</p>

<p>Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus.</p>

<h3>5.2 Print Optimization</h3>

<p>When printing documents, the system applies special CSS rules to ensure proper page breaks. Visual overlays are hidden, and hard page breaks trigger actual printer page advances.</p>

<p>Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat. Omnis voluptas assumenda est, omnis dolor repellendus.</p>

<h2>Conclusion</h2>

<p>The Community Tiptap Pages extension brings professional-grade pagination to web-based document editing. By maintaining a flat document structure while providing visual page separation, it offers the best of both worlds: easy data management and WYSIWYG editing.</p>

<p>Whether you're building a legal document system, a content management platform, or any application requiring paginated output, this extension provides the foundation for a polished, professional experience.</p>

<p>Thank you for exploring this demonstration. We hope you find the extension useful for your projects!</p>

<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>

<p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
`

export default function HomePage() {
  const [format, setFormat] = useState<PageFormatName>('Letter')
  const [orientation, setOrientation] = useState<PageOrientation>('portrait')
  const [pageCount, setPageCount] = useState(1)
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: {
          depth: 100,
        },
      }),
      PageBreak,
      Pagination.configure({
        pageFormat: format,
        orientation,
        onPageCountChange: setPageCount,
      }),
    ],
    content: SAMPLE_CONTENT,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'paged-editor-content prose focus:outline-none',
      },
    },
  })

  // Store editor reference
  if (editor && !editorRef.current) {
    editorRef.current = editor
  }

  const handleFormatChange = useCallback((newFormat: PageFormatName) => {
    setFormat(newFormat)
    editor?.commands.setPageFormat(newFormat)
  }, [editor])

  const handleOrientationChange = useCallback((newOrientation: PageOrientation) => {
    setOrientation(newOrientation)
    editor?.commands.setOrientation(newOrientation)
  }, [editor])

  const handleInsertPageBreak = useCallback(() => {
    editor?.commands.setPageBreak()
  }, [editor])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <Toolbar
        format={format}
        orientation={orientation}
        pageCount={pageCount}
        onFormatChange={handleFormatChange}
        onOrientationChange={handleOrientationChange}
        onInsertPageBreak={handleInsertPageBreak}
        onPrint={handlePrint}
      />
      
      <PageWrapper
        format={format}
        orientation={orientation}
        containerClassName="flex-1"
      >
        <EditorContent editor={editor} />
      </PageWrapper>
    </div>
  )
}
