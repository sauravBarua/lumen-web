import { expect, test } from '@playwright/test';
import { registerViaUi, uniqueName } from './helpers';

test.describe('settings', () => {
  test('switches the theme and keeps it after a reload', async ({ page }) => {
    await registerViaUi(page, uniqueName('thea'));
    await page.goto('/settings');

    await page.getByRole('radio', { name: 'Dark' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);

    await page.getByRole('radio', { name: 'Light' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('saves notification preferences', async ({ page }) => {
    await registerViaUi(page, uniqueName('nora'));
    await page.goto('/settings');

    const mentionEmail = page.getByRole('switch', { name: 'Mentions, email' });
    await expect(mentionEmail).toHaveAttribute('aria-checked', 'true');
    await mentionEmail.click();
    await page.getByRole('button', { name: 'Save preferences' }).click();
    await expect(page.getByText('Preferences saved')).toBeVisible();

    await page.reload();
    await expect(page.getByRole('switch', { name: 'Mentions, email' })).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });
});
