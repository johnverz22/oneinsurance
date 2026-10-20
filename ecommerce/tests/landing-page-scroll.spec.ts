import { test, expect } from '@playwright/test'

const TEST_VIEWPORTS = [
  { name: 'SM-320 (Mobile min)', width: 320, height: 640 },
  { name: 'SM-360 (Android small)', width: 360, height: 740 },
  { name: 'SM-390 (iPhone standard)', width: 390, height: 844 },
  { name: 'SM-414 (iPhone Plus/Max)', width: 414, height: 896 },
  { name: 'MD-768 (Tablet portrait)', width: 768, height: 1024 },
  { name: 'LG-1024 (iPad Pro / Desktop min)', width: 1024, height: 768 },
  { name: 'LG-1440 (Desktop standard)', width: 1440, height: 900 },
]

for (const vp of TEST_VIEWPORTS) {
  test(`Verify document.documentElement.scrollWidth <= window.innerWidth at ${vp.name} (${vp.width}px)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto('/ckO6uNx2O6/travel-insurance')
    await page.waitForLoadState('domcontentloaded')

    // Assertion required by audit: document.documentElement.scrollWidth <= window.innerWidth
    const isScrollCompliant = await page.evaluate(() => {
      return document.documentElement.scrollWidth <= window.innerWidth
    })
    expect(isScrollCompliant).toBe(true)

    // Check for any element breaching client width
    const offenders = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth
      return Array.from(document.querySelectorAll('*'))
        .filter((el) => {
          const rect = el.getBoundingClientRect()
          return rect.right > docWidth + 0.5
        })
        .map((el) => {
          const rect = el.getBoundingClientRect()
          const tag = el.tagName.toLowerCase()
          const id = el.id ? `#${el.id}` : ''
          const cls =
            el.className && typeof el.className === 'string'
              ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}`
              : ''
          return `${tag}${id}${cls}: right=${Math.round(rect.right)}px > clientWidth=${docWidth}px`
        })
    })

    expect(offenders).toHaveLength(0)
  })
}
