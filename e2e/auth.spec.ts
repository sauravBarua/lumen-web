import { expect, test } from '@playwright/test';
import { fillRegisterForm, PASSWORD, registerViaUi, signOutViaUi, uniqueName } from './helpers';

test.describe('authentication', () => {
  test('registers, lands in the app, survives a reload and signs out', async ({ page }) => {
    await registerViaUi(page, uniqueName('ada'));
    await expect(page.getByRole('heading', { name: 'No rooms yet' })).toBeVisible();
    await page.reload();
    await expect(page).toHaveURL(/\/rooms/);
    await signOutViaUi(page);
  });

  test('signs in again and rejects a wrong password', async ({ page }) => {
    const name = uniqueName('bea');
    await registerViaUi(page, name);
    await signOutViaUi(page);

    await page.getByLabel('Email').fill(`${name}@example.com`);
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(
      page.getByRole('alert').filter({ hasText: 'Invalid email or password.' }),
    ).toBeVisible();

    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/rooms/);
  });

  test('refuses a second account with the same email', async ({ browser }) => {
    const first = uniqueName('cleo');
    const context = await browser.newContext();
    await registerViaUi(await context.newPage(), first);

    const other = await browser.newContext();
    const page = await other.newPage();
    await fillRegisterForm(page, { email: `${first}@example.com`, username: uniqueName('dina') });
    await expect(page.getByText('This email is already registered.')).toBeVisible();
    await context.close();
    await other.close();
  });

  test('sends signed-out visitors to the login page', async ({ page }) => {
    await page.goto('/rooms');
    await expect(page).toHaveURL(/\/login\?callbackUrl=%2Frooms/);
  });
});
