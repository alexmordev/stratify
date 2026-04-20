import { test, expect } from '@playwright/test';

test.describe('Review semanal modal', () => {
  test('open modal → shows week data → save closes modal', async ({ page }) => {
    await page.goto('/metas');

    // Click "Review semanal" button in sidebar
    const reviewBtn = page.getByTestId('review-btn');
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    // Modal should appear
    const modal = page.getByTestId('modal-review');
    await expect(modal).toBeVisible();

    // Completed count is shown
    const completedCount = page.getByTestId('completed-count');
    await expect(completedCount).toBeVisible();

    // Reflection textarea is present
    const textarea = page.getByTestId('review-reflection');
    await expect(textarea).toBeVisible();
    await textarea.fill('This week I learned something new');

    // Save and close
    const saveBtn = page.getByTestId('save-review-btn');
    await saveBtn.click();

    // Modal should be gone
    await expect(modal).not.toBeVisible();
  });

  test('clicking overlay closes modal', async ({ page }) => {
    await page.goto('/metas');

    await page.getByTestId('review-btn').click();
    await expect(page.getByTestId('modal-review')).toBeVisible();

    // Click overlay
    await page.getByTestId('modal-review-overlay').click({ position: { x: 10, y: 10 } });
    await expect(page.getByTestId('modal-review')).not.toBeVisible();
  });

  test('Escape key closes modal', async ({ page }) => {
    await page.goto('/metas');

    await page.getByTestId('review-btn').click();
    await expect(page.getByTestId('modal-review')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.getByTestId('modal-review')).not.toBeVisible();
  });
});
