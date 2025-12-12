import { mkdir, copyFile } from 'node:fs/promises'
import { dirname } from 'node:path'

const src = new URL('../src/styles.css', import.meta.url)
const dest = new URL('../dist/styles.css', import.meta.url)

await mkdir(dirname(dest.pathname), { recursive: true })
await copyFile(src, dest)
