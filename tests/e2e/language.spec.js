import { test, expect } from '@playwright/test';

test.describe('Language toggle', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/metas');
    await page.evaluate(() => localStorage.removeItem('lang'));
  });

  test('switch to EN → nav items show in English', async ({ page }) => {
    await page.goto('/metas');

    // Default is ES
    await expect(page.getByTestId('nav-metas')).toContainText('Metas');

    // Click EN button
    await page.getByRole('button', { name: /switch to en/i }).click();

    // Nav should show English text
    await expect(page.getByTestId('nav-metas')).toContainText('Goals');
    await expect(page.getByTestId('nav-objetivos')).toContainText('Objectives');
    await expect(page.getByTestId('nav-tareas')).toContainText('Tasks');
  });

  test('language persists after page refresh', async ({ page }) => {
    await page.goto('/metas');

    // Switch to EN
    await page.getByRole('button', { name: /switch to en/i }).click();
    await expect(page.getByTestId('nav-metas')).toContainText('Goals');

    // Reload
    await page.reload();

    // Should still be EN
    await expect(page.getByTestId('nav-metas')).toContainText('Goals');
  });

  test('switch back to ES after EN', async ({ page }) => {
    await page.goto('/metas');

    await page.getByRole('button', { name: /switch to en/i }).click();
    await expect(page.getByTestId('nav-metas')).toContainText('Goals');

    await page.getByRole('button', { name: /switch to es/i }).click();
    await expect(page.getByTestId('nav-metas')).toContainText('Metas');
  });
});
