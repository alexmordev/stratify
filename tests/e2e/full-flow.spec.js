import { test, expect } from '@playwright/test';

test.describe('Full flow: meta → objectives → task → complete', () => {
  test('sidebar renders with navigation items', async ({ page }) => {
    await page.goto('/metas');
    await expect(page.getByTestId('sidebar')).toBeVisible();
    await expect(page.getByTestId('nav-metas')).toBeVisible();
    await expect(page.getByTestId('nav-objetivos')).toBeVisible();
    await expect(page.getByTestId('nav-tareas')).toBeVisible();
  });

  test('navigating to Metas shows metas page', async ({ page }) => {
    await page.goto('/metas');
    await expect(page).toHaveURL('/metas');
    // Page loads without error
    await expect(page.getByTestId('sidebar')).toBeVisible();
  });

  test('navigating to Objetivos shows objetivos page', async ({ page }) => {
    await page.goto('/objetivos');
    await expect(page).toHaveURL('/objetivos');
    await expect(page.getByTestId('sidebar')).toBeVisible();
  });

  test('navigating to Tareas shows tareas page', async ({ page }) => {
    await page.goto('/tareas');
    await expect(page).toHaveURL('/tareas');
    await expect(page.getByTestId('sidebar')).toBeVisible();
  });

  test('Review semanal button is present in sidebar footer', async ({ page }) => {
    await page.goto('/metas');
    await expect(page.getByTestId('review-btn')).toBeVisible();
  });
});
