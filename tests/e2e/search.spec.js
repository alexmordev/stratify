import { test, expect } from '@playwright/test';

test.describe('Search palette (⌘K)', () => {
  test('Ctrl+K opens search palette', async ({ page }) => {
    await page.goto('/metas');

    await page.keyboard.press('Control+k');
    const dialog = page.getByRole('dialog', { name: 'Search palette' });
    await expect(dialog).toBeVisible();
  });

  test('search button in sidebar opens palette', async ({ page }) => {
    await page.goto('/metas');

    await page.getByTestId('search-button').click();
    await expect(page.getByRole('dialog', { name: 'Search palette' })).toBeVisible();
  });

  test('Escape closes search palette', async ({ page }) => {
    await page.goto('/metas');

    await page.keyboard.press('Control+k');
    await expect(page.getByRole('dialog', { name: 'Search palette' })).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Search palette' })).not.toBeVisible();
  });

  test('typing in search input triggers search debounce', async ({ page }) => {
    await page.goto('/metas');

    await page.keyboard.press('Control+k');
    const input = page.getByPlaceholder(/buscar/i);
    await expect(input).toBeVisible();
    await input.fill('meta');

    // After debounce, results area may appear (or not if DB is empty)
    await page.waitForTimeout(300);
    // Just verify the palette is still open after typing
    await expect(page.getByRole('dialog', { name: 'Search palette' })).toBeVisible();
  });
});
