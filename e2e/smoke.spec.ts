import { test, expect } from '@playwright/test'

test('home renders paged editor (not blank)', async ({ page }) => {
  const errors: string[] = []

  page.on('pageerror', (err) => {
    errors.push(String(err))
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await expect(page.locator('#format-select')).toBeVisible()
  await expect(page.getByTestId('paged-editor')).toBeVisible()

  const proseMirror = page.locator('.ProseMirror')
  await expect(proseMirror).toBeVisible()
  await expect(proseMirror).toContainText('Community Tiptap Pages Demo')

  const box = await proseMirror.boundingBox()
  expect(box?.width ?? 0).toBeGreaterThan(200)
  expect(box?.height ?? 0).toBeGreaterThan(200)

  expect(
    errors,
    `Console/page errors detected:\n${errors.join('\n')}`
  ).toEqual([])
})
