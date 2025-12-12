import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Community Tiptap Pages',
  description: 'A pagination extension for Tiptap supporting legal document formats',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
