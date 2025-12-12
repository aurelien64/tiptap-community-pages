'use client'

import React, { useCallback, useState, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { PageWrapper } from './PageWrapper'
import { PageBreak, Pagination, PageFormatName, PageOrientation, PageMargins } from '../extensions'

export interface PagedEditorProps {
  /**
   * Initial content (HTML string or JSON)
   */
  content?: string | Record<string, unknown>
  
  /**
   * Page format
   */
  format?: PageFormatName
  
  /**
   * Page orientation
   */
  orientation?: PageOrientation
  
  /**
   * Page margins
   */
  margins?: Partial<PageMargins>
  
  /**
   * Called when content changes
   */
  onUpdate?: (html: string, json: Record<string, unknown>) => void
  
  /**
   * Called when page count changes
   */
  onPageCountChange?: (count: number) => void
  
  /**
   * Whether the editor is editable
   */
  editable?: boolean
  
  /**
   * Placeholder text
   */
  placeholder?: string
  
  /**
   * Additional class for the editor
   */
  className?: string
}

/**
 * PagedEditor Component
 * 
 * A complete Tiptap editor with pagination support.
 * This component combines the editor, page wrapper, and all pagination extensions.
 */
export function PagedEditor({
  content = '',
  format = 'Letter',
  orientation = 'portrait',
  margins,
  onUpdate,
  onPageCountChange,
  editable = true,
  placeholder = 'Start typing...',
  className = '',
}: PagedEditorProps) {
  const [pageCount, setPageCount] = useState(1)
  const [mounted, setMounted] = useState(false)

  // SSR safety: only render editor on client
  useEffect(() => {
    setMounted(true)
  }, [])

  const handlePageCountChange = useCallback((count: number) => {
    setPageCount(count)
    onPageCountChange?.(count)
  }, [onPageCountChange])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable default history if needed
        history: {
          depth: 100,
        },
      }),
      PageBreak,
      Pagination.configure({
        pageFormat: format,
        orientation,
        margins: margins || {},
        widowOrphanControl: true,
        minLinesAtBreak: 2,
        pageGap: 40,
        onPageCountChange: handlePageCountChange,
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: `paged-editor-content prose prose-sm sm:prose lg:prose-lg focus:outline-none ${className}`,
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML(), editor.getJSON() as Record<string, unknown>)
      }
    },
  })

  // Update editor config when format/orientation changes
  useEffect(() => {
    if (editor) {
      editor.commands.setPageFormat(format)
    }
  }, [editor, format])

  useEffect(() => {
    if (editor) {
      editor.commands.setOrientation(orientation)
    }
  }, [editor, orientation])

  useEffect(() => {
    if (editor && margins) {
      editor.commands.setMargins(margins)
    }
  }, [editor, margins])

  // SSR safety
  if (!mounted) {
    return (
      <div className="page-wrapper-container" style={{ backgroundColor: '#f3f4f6', minHeight: '100vh' }}>
        <div className="animate-pulse bg-white shadow-md" style={{ width: 816, height: 1056, margin: '40px auto' }} />
      </div>
    )
  }

  return (
    <div className="paged-editor">
      <PageWrapper
        format={format}
        orientation={orientation}
        margins={margins}
      >
        <EditorContent editor={editor} />
      </PageWrapper>
      
      {/* Page count indicator */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg px-4 py-2 text-sm text-gray-600">
        {pageCount} {pageCount === 1 ? 'page' : 'pages'}
      </div>
    </div>
  )
}

/**
 * Hook to access the paged editor instance
 */
export function usePagedEditor() {
  // This could be extended with context if needed
  return null
}

export default PagedEditor
