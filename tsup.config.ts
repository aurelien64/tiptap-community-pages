import { defineConfig, type Format } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    react: 'src/react.ts',
  },
  outDir: 'dist',
  tsconfig: 'tsconfig.lib.json',
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  splitting: false,
  target: 'es2020',
  external: [
    'react',
    'react-dom',
    '@tiptap/core',
    '@tiptap/pm',
    '@tiptap/react',
    '@tiptap/starter-kit',
  ],
  outExtension({ format }: { format: Format }) {
    if (format === 'esm') return { js: '.mjs' }
    if (format === 'cjs') return { js: '.cjs' }
    return { js: '.js' }
  },
})
