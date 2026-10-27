import { expect, test } from '@playwright/test';
import {
  composer,
  createRoomViaUi,
  joinRoomViaUi,
  mine,
  newUser,
  registerViaUi,
  send,
  theirs,
  uniqueName,
} from './helpers';

// 1x1 transparent PNG: small, valid, and it passes the API's file signature check.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test.describe('chat', () => {
  test('two people chat in realtime: presence, typing, reactions, edit and delete', async ({
    browser,
  }) => {
    const alice = uniqueName('alice');
    const bob = uniqueName('bob');
    const room = uniqueName('room');
    const a = await newUser(browser, alice);
    const b = await newUser(browser, bob);

    await createRoomViaUi(a.page, room);
    await joinRoomViaUi(b.page, room);

    // Presence: bob sees alice online in the members panel.
    await expect(b.page.locator(`li[data-user="${alice}"]`)).toHaveAttribute(
      'data-presence',
      'online',
    );

    // Messages travel both ways, in realtime, on opposite sides of the screen.
    await send(a.page, 'hello from alice');
    await expect(mine(a.page, 'hello from alice')).toBeVisible();
    await expect(theirs(b.page, 'hello from alice')).toBeVisible();
    await send(b.page, 'hi alice');
    await expect(theirs(a.page, 'hi alice')).toBeVisible();

    // Typing indicator, cleared when the message is sent.
    await composer(a.page).pressSequentially('typing now', { delay: 30 });
    await expect(b.page.getByText(`${alice} is typing…`)).toBeVisible();
    await composer(a.page).press('Enter');
    await expect(theirs(b.page, 'typing now')).toBeVisible();
    await expect(b.page.getByText(`${alice} is typing…`)).toBeHidden();

    // Reaction from bob shows up for both.
    const target = theirs(b.page, 'hello from alice');
    await target.hover();
    await target.getByRole('button', { name: 'Add reaction' }).click();
    await b.page.getByRole('menuitem', { name: 'Thumbs up' }).click();
    await expect(b.page.getByRole('button', { name: /👍 1 reaction/ })).toBeVisible();
    await expect(a.page.getByRole('button', { name: /👍 1 reaction/ })).toBeVisible();

    // Edit.
    const original = mine(a.page, 'hello from alice');
    await original.hover();
    await original.getByRole('button', { name: 'Edit message' }).click();
    await expect(a.page.getByText('Edit message', { exact: true })).toBeVisible();
    await send(a.page, 'hello from alice (updated)');
    await expect(theirs(b.page, 'hello from alice (updated)')).toBeVisible();
    await expect(b.page.getByText('(edited)')).toBeVisible();

    // Delete leaves a tombstone for everyone.
    const updated = mine(a.page, 'hello from alice (updated)');
    await updated.hover();
    await updated.getByRole('button', { name: 'Delete message' }).click();
    await a.page
      .getByRole('alertdialog', { name: 'Delete this message?' })
      .getByRole('button', { name: 'Delete' })
      .click();
    await expect(a.page.getByText('This message was deleted')).toBeVisible();
    await expect(b.page.getByText('This message was deleted')).toBeVisible();

    await a.context.close();
    await b.context.close();
  });

  test('a mention shows a toast, a badge and an unread count, which clear once read', async ({
    browser,
  }) => {
    const alice = uniqueName('alice');
    const bob = uniqueName('bob');
    const shared = uniqueName('shared');
    const other = uniqueName('other');
    const a = await newUser(browser, alice);
    const b = await newUser(browser, bob);

    await createRoomViaUi(a.page, shared);
    await joinRoomViaUi(b.page, shared);
    // Bob moves to a room of his own, so the mention arrives while he is looking elsewhere.
    await createRoomViaUi(b.page, other);

    await send(a.page, `hey @${bob}, have a look`);

    await expect(
      b.page.getByRole('status').filter({ hasText: `${alice} mentioned you in #${shared}` }),
    ).toBeVisible();
    await expect(b.page.getByTestId('bell-badge')).toHaveText('1');
    await expect(
      b.page.getByRole('link', { name: new RegExp(shared) }).getByLabel('1 unread messages'),
    ).toBeVisible();

    // Open it from the bell: the room opens and everything becomes read.
    await b.page.getByRole('button', { name: /^Notifications/ }).click();
    await b.page
      .getByRole('dialog', { name: 'Notifications' })
      .getByText(`${alice} mentioned you in #${shared}`)
      .click();
    await expect(b.page).toHaveURL(/\/rooms\/[0-9a-f-]{36}/);
    await expect(theirs(b.page, 'have a look')).toBeVisible();
    await expect(b.page.getByTestId('bell-badge')).toHaveCount(0);

    await a.context.close();
    await b.context.close();
  });

  test('direct messages: start one from a shared room and get notified', async ({ browser }) => {
    const alice = uniqueName('alice');
    const bob = uniqueName('bob');
    const shared = uniqueName('room');
    const a = await newUser(browser, alice);
    const b = await newUser(browser, bob);

    await createRoomViaUi(a.page, shared);
    await joinRoomViaUi(b.page, shared);

    await a.page.getByRole('button', { name: 'New direct message' }).click();
    const dialog = a.page.getByRole('dialog', { name: 'New direct message' });
    await dialog.getByRole('button', { name: new RegExp(bob) }).click();
    // The URL pattern also matches the room alice is already in: wait for the DM header instead.
    await expect(a.page.getByRole('heading', { level: 1, name: bob })).toBeVisible();
    await send(a.page, 'psst, just you');
    await expect(mine(a.page, 'psst, just you')).toBeVisible();

    await expect(
      b.page.getByRole('status').filter({ hasText: `New message from ${alice}` }),
    ).toBeVisible();
    await b.page.getByRole('link', { name: new RegExp(alice) }).click();
    await expect(theirs(b.page, 'psst, just you')).toBeVisible();

    await a.context.close();
    await b.context.close();
  });

  test('rejects files the API would refuse, before uploading them', async ({ page }) => {
    await registerViaUi(page, uniqueName('fay'));
    await createRoomViaUi(page, uniqueName('room'));

    await page.getByTestId('file-input').setInputFiles([
      { name: 'malware.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('MZ') },
      { name: 'huge.png', mimeType: 'image/png', buffer: Buffer.alloc(10 * 1024 * 1024 + 1) },
    ]);
    await expect(page.getByText('File type not allowed')).toBeVisible();
    await expect(page.getByText('Max 10 MB')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send message' })).toBeDisabled();

    await page.getByRole('button', { name: 'Dismiss malware.exe error' }).click();
    await expect(page.getByText('File type not allowed')).toBeHidden();
  });

  test('uploads an image, shows it in the room and opens it in the viewer', async ({ page }) => {
    test.skip(
      !process.env.E2E_UPLOADS,
      'Needs real Cloudinary credentials on the API (set E2E_UPLOADS=1)',
    );
    await registerViaUi(page, uniqueName('gus'));
    await createRoomViaUi(page, uniqueName('room'));

    await page
      .getByTestId('file-input')
      .setInputFiles({ name: 'pixel.png', mimeType: 'image/png', buffer: PNG });
    await expect(page.getByText('pixel.png')).toBeVisible();
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.locator('figure img')).toBeVisible();
    await page.getByRole('button', { name: 'Open image in viewer' }).click();
    await expect(page.getByRole('button', { name: 'Close preview' })).toBeVisible();
    await page.getByRole('button', { name: 'Close preview' }).click();
    await expect(page.getByRole('button', { name: 'Close preview' })).toBeHidden();
  });
});
