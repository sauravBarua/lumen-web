import { type Browser, expect, type Page } from '@playwright/test';

export const PASSWORD = 'Passw0rd!123';

/** Usernames must match the API rule: lowercase letters, digits and underscore, 3-20 characters. */
export function uniqueName(prefix: string): string {
  const suffix = `${Date.now().toString(36).slice(-5)}${Math.random().toString(36).slice(2, 6)}`;
  return `${prefix}_${suffix}`.slice(0, 20);
}

export async function fillRegisterForm(
  page: Page,
  values: { email: string; username: string; password?: string },
) {
  await page.goto('/register');
  await page.getByLabel('Email').fill(values.email);
  await page.getByLabel('Username').fill(values.username);
  await page.getByLabel('Password').fill(values.password ?? PASSWORD);
  await page.getByRole('button', { name: 'Create account' }).click();
}

export async function registerViaUi(page: Page, username: string) {
  await fillRegisterForm(page, { email: `${username}@example.com`, username });

  // Next.js injects an empty role="alert" route announcer on every page: only alerts with text count.
  const formMessage = page.getByRole('alert').filter({ hasText: /\S/ }).first();

  const outcome = await Promise.race([
    page.waitForURL(/\/rooms/, { timeout: 30_000 }).then(
      () => 'ok' as const,
      () => 'timeout' as const,
    ),
    formMessage.waitFor({ timeout: 30_000 }).then(
      () => 'message' as const,
      () => 'timeout' as const,
    ),
  ]);

  if (outcome === 'message') {
    const messages = await page.getByRole('alert').filter({ hasText: /\S/ }).allTextContents();
    throw new Error(`Registration was refused: ${messages.join(' | ')}`);
  }
  if (outcome === 'timeout') {
    const visible = (
      await page
        .locator('main')
        .innerText()
        .catch(() => '')
    ).replace(/\s+/g, ' ');
    throw new Error(`Registration did not finish. URL: ${page.url()}. Page says: ${visible}`);
  }
  await expect(page).toHaveURL(/\/rooms/);
}

export async function signOutViaUi(page: Page) {
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login/);
  // The session must really be gone, not only the page changed.
  await expect
    .poll(async () => (await page.request.get('/api/auth/session')).json(), {
      message: 'the session cookie was cleared',
    })
    .toBeNull();
}

/** A fresh browser context (its own cookies and socket) with a newly registered user. */
export async function newUser(browser: Browser, username: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  await registerViaUi(page, username);
  return { context, page, username };
}

export async function createRoomViaUi(page: Page, name: string) {
  await page.getByRole('button', { name: 'New room', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Create a room' });
  await dialog.getByLabel('Name').fill(name);
  await dialog.getByRole('button', { name: 'Create room' }).click();
  await expect(page).toHaveURL(/\/rooms\/[0-9a-f-]{36}/);
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

export async function joinRoomViaUi(page: Page, name: string) {
  await page.getByRole('button', { name: 'Browse public rooms' }).click();
  const dialog = page.getByRole('dialog', { name: 'Browse public rooms' });
  await dialog.getByRole('searchbox', { name: 'Search public rooms' }).fill(name);
  await dialog.getByRole('button', { name: `Join ${name}` }).click();
  await expect(dialog.getByText('Joined')).toBeVisible();
  await dialog.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('link', { name: new RegExp(name) }).click();
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
}

export const composer = (page: Page) => page.getByRole('textbox', { name: /^Message / });

export async function send(page: Page, text: string) {
  const box = composer(page);
  await box.fill(text);
  await box.press('Enter');
}

/** Messages by who wrote them: mine sit on the right (data-own="true"), others' on the left. */
export const mine = (page: Page, text: string) =>
  page.locator('article[data-own="true"]', { hasText: text });
export const theirs = (page: Page, text: string) =>
  page.locator('article[data-own="false"]', { hasText: text });
