# Community Tiptap Pages - AI Agent Instructions

## Project Overview

This is a **Tiptap pagination extension** for WYSIWYG document editing with page layout support for legal documents. It uses the "Continuous Flow" model: the document remains a flat ProseMirror structure while visual pagination is achieved via DOM overlays.

**Tech Stack:** Next.js 15, React 19, Tiptap/ProseMirror, TypeScript, TailwindCSS

## Behavior
**ALWAYS Test** code, errors, and do a visual review (using Playwright) at the end of a session.

## Architecture

### Core Pattern: Visual Pagination via Overlays

The key architectural decision is **NOT** to split the document into page nodes. Instead:

1. Document stays flat: `doc > paragraph | heading | list | pageBreak`
2. The `Pagination` extension measures content height via `requestAnimationFrame`
3. Visual page breaks are injected as DOM overlays (not ProseMirror decorations)
4. This preserves text continuity for search, copy/paste, and redaction tools

### Extension Structure (`src/extensions/`)

| File | Purpose |
|------|---------|
| [page-format.ts](src/extensions/page-format.ts) | Page dimensions (A4/Letter/Legal), unit conversions, margins |
| [page-break.ts](src/extensions/page-break.ts) | Hard page break node (atomic, `Mod-Enter` shortcut) |
| [pagination.ts](src/extensions/pagination.ts) | Main plugin: height measurement, break calculation, overlay rendering |

### Component Structure (`src/components/`)

- `PageWrapper` - CSS styling wrapper (shadow, margins, page dimensions)
- `PagedEditor` - Complete editor with SSR safety pattern
- `Toolbar` - Format/orientation controls

## Key Patterns

### SSR Safety (Critical for Next.js)

All DOM measurements must occur client-side. Use this pattern:

```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => { setMounted(true) }, [])
if (!mounted) return <LoadingSkeleton />
```

See [PagedEditor.tsx](src/components/PagedEditor.tsx) for the complete pattern.

### Tiptap Extension Commands

Commands are declared in the extension and available via `editor.commands.*`:

```typescript
editor.commands.setPageFormat('Legal')     // Switch paper size
editor.commands.setOrientation('landscape') // Rotate page
editor.commands.setPageBreak()              // Insert hard break
editor.commands.goToPage(2)                 // Scroll to page
```

### Page Dimensions at 96 DPI

```typescript
const PAGE_FORMATS = {
  Letter: { width: 816, height: 1056 },  // 8.5×11 in
  Legal:  { width: 816, height: 1344 },  // 8.5×14 in
  A4:     { width: 794, height: 1123 },  // 210×297 mm
}
```

## Development Commands

```bash
npm run dev        # Start dev server (localhost:3000)
npm run build      # Production build
npm run type-check # TypeScript validation only
npm run lint       # ESLint
```

## Code Conventions

- **Imports:** Use `@/extensions` and `@/components` path aliases
- **'use client':** Required on all components using hooks or browser APIs
- **Types:** Export interfaces alongside implementations; use `declare module '@tiptap/core'` for command types
- **CSS:** Tailwind for components, custom CSS in `globals.css` for editor/print styles

## Print Support

Print CSS is in [globals.css](src/app/globals.css) under `@media print`. Key behaviors:
- Visual overlays are hidden
- Hard page breaks (`[data-page-break]`) trigger `break-after: page`
- Widow/orphan CSS controls prevent single lines at boundaries

## Testing Patterns

### Visual Testing with Playwright

Use Playwright MCP for visual review of pagination behavior:

```typescript
// Verify page break positioning
await page.goto('http://localhost:3000')
await page.waitForSelector('.pagination-break-overlay')
await page.screenshot({ path: 'pagination-test.png', fullPage: true })

// Test format switching
await page.selectOption('#format-select', 'Legal')
await page.waitForTimeout(300) // Wait for reflow
await page.screenshot({ path: 'legal-format.png' })
```

Key visual checkpoints:
- Page break overlays appear at correct heights
- Format changes reflow content properly
- Hard page breaks (`Mod-Enter`) render with label
- Print preview hides overlays and shows proper breaks

### Unit Testing Extensions

Test Tiptap extensions using `@tiptap/core` test utilities:

```typescript
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { PageBreak, Pagination } from '@/extensions'

const editor = new Editor({
  extensions: [StarterKit, PageBreak, Pagination],
  content: '<p>Test content</p>',
})

// Test commands
editor.commands.setPageBreak()
expect(editor.getHTML()).toContain('data-page-break')

// Test format changes
editor.commands.setPageFormat('Legal')
expect(editor.storage.pagination.pageConfig.format).toBe('Legal')
```

### Integration Test Scenarios

Priority test cases for pagination:
1. Content exceeding one page triggers automatic break
2. `setPageFormat()` recalculates all break positions
3. `goToPage(n)` scrolls to correct position
4. Hard page breaks persist through serialize/deserialize
5. Orientation toggle swaps width/height correctly

## Known Limitations

When implementing features, be aware:
- Tables may break mid-row (no special handling yet)
- Large images can overflow page boundaries
- Widow/orphan control is basic (element-level, not line-level)
- Performance degrades on 100+ page documents
