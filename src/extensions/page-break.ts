import { Node, mergeAttributes } from '@tiptap/core'

export interface PageBreakOptions {
  /**
   * HTML attributes to add to the page break element
   */
  HTMLAttributes: Record<string, unknown>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      /**
       * Insert a hard page break at the current cursor position
       */
      setPageBreak: () => ReturnType
    }
  }
}

/**
 * PageBreak Extension
 * 
 * A custom Tiptap node that represents a hard/manual page break.
 * This is an "atom" node - it cannot contain other content and is treated
 * as a single unit for selection purposes.
 * 
 * Usage:
 * - Cmd+Enter (Mac) / Ctrl+Enter (Windows) to insert
 * - editor.commands.setPageBreak() programmatically
 */
export const PageBreak = Node.create<PageBreakOptions>({
  name: 'pageBreak',

  // Appears at block level, between paragraphs
  group: 'block',

  // Cannot contain any content
  atom: true,

  // Cannot be selected as part of a text selection
  selectable: true,

  // Can be dragged
  draggable: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'page-break',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-page-break]',
      },
      {
        tag: 'hr.page-break',
      },
      // Support for common word processor page break markers
      {
        tag: 'div.page-break',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        'data-page-break': 'true',
        'contenteditable': 'false',
      }),
      [
        'div',
        { class: 'page-break-content' },
        [
          'span',
          { class: 'page-break-label' },
          'Page Break',
        ],
      ],
    ]
  },

  addCommands() {
    return {
      setPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          })
        },
    }
  },

  addKeyboardShortcuts() {
    return {
      // Cmd+Enter on Mac, Ctrl+Enter on Windows/Linux
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
    }
  },
})

export default PageBreak
