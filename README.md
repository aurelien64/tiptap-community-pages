# Community Tiptap Pages

A community-built pagination extension for [Tiptap](https://tiptap.dev/) that provides WYSIWYG page layout similar to word processors, with support for legal document formats.

## Compatibility

- Requires **Tiptap v3.x** (`@tiptap/core`, `@tiptap/pm`, `@tiptap/react`)
- Tested against **Tiptap v3.13.x** in this repository
- React 19 is used in the demo, but the library is shipped as a normal package with React as a peer dependency.

## Features

- **📄 Multiple Page Formats**: Support for A4, US Letter, and US Legal paper sizes
- **🔄 Portrait & Landscape**: Switch orientation dynamically
- **✂️ Hard Page Breaks**: Manual page breaks with `Ctrl+Enter` / `Cmd+Enter`
- **🖨️ Print Support**: Proper CSS for printing to PDF with correct page breaks
- **📐 Widow/Orphan Control**: Prevents single lines at page boundaries
- **⚡ SSR Safe**: Works with Next.js and other SSR frameworks
- **🔍 Redaction Compatible**: Flat document structure preserves text flow

## Installation

```bash
npm i tiptap-community-pages
```

### CSS (required for hard page breaks)

Import once in your app (e.g. your Next.js `layout.tsx`, or app entry):

```ts
import 'tiptap-community-pages/styles.css'
```

### Local demo installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo.

### Quality Checks

```bash
npm run lint
npm run type-check
npm test
npm run build
```

## Usage

### Basic Setup

```tsx
import { useEditor } from '@tiptap/react'
import { EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { PageBreak, Pagination } from 'tiptap-community-pages'
import { PageWrapper } from 'tiptap-community-pages/react'

const editor = useEditor({
  extensions: [
    StarterKit,
    PageBreak,
    Pagination.configure({
      pageFormat: 'Letter', // 'A4', 'Letter', or 'Legal'
      orientation: 'portrait', // 'portrait' or 'landscape'
      margins: {
        top: 96,    // 1 inch in pixels
        right: 96,
        bottom: 96,
        left: 96,
      },
      onPageCountChange: (count) => console.log(`${count} pages`),
    }),
  ],
  content: '<p>Your content here...</p>',
})

// Wrap your editor
<PageWrapper format="Letter" orientation="portrait">
  <EditorContent editor={editor} />
</PageWrapper>
```

### Commands

```tsx
// Change page format dynamically
editor.commands.setPageFormat('Legal')

// Change orientation
editor.commands.setOrientation('landscape')

// Insert a hard page break
editor.commands.setPageBreak()

// Navigate to a specific page
editor.commands.goToPage(2)
```

### Page Format Dimensions

| Format | Width | Height | Common Use |
|--------|-------|--------|------------|
| US Letter | 816px | 1056px | Standard US documents |
| US Legal | 816px | 1344px | Legal contracts, court documents |
| A4 | 794px | 1123px | International standard |

*All dimensions at 96 DPI (standard screen resolution)*

## Architecture

This extension uses the **"Continuous Flow" model**:

1. **Single Document**: The content remains a single flat ProseMirror document
2. **Visual Pages**: Pagination is rendered using CSS and DOM overlays
3. **No Node Splitting**: Text can flow across page boundaries without breaking the document structure

This approach ensures:
- Easy data storage (single HTML/JSON document)
- Redaction algorithms can find text spanning pages
- Search works seamlessly across the document
- Copy/paste preserves content integrity

## Project Structure

```
src/
├── extensions/
│   ├── page-format.ts    # Page dimension utilities
│   ├── page-break.ts     # Hard page break node
│   ├── pagination.ts     # Main pagination extension
│   └── index.ts          # Extension exports
├── components/
│   ├── PageWrapper.tsx   # Page styling wrapper
│   ├── PagedEditor.tsx   # Complete editor component
│   ├── Toolbar.tsx       # Format/orientation controls
│   └── index.ts          # Component exports
└── app/
    ├── page.tsx          # Demo page
    ├── layout.tsx        # App layout
    └── globals.css       # Global styles + print CSS
```

## Print Support

The extension includes comprehensive print CSS that:
- Hides visual page break indicators
- Enforces browser page breaks
- Supports widow/orphan control
- Sets correct page sizes per format

```css
@media print {
  .page-break {
    page-break-after: always;
    break-after: page;
  }
}
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Insert page break |

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## License

MIT License - see [LICENSE](LICENSE) file for details.



