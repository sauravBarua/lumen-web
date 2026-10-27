// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { MessageReactionEvent } from '@/lib/socket-events';
import type { Message, MessagesData } from '@/lib/types';
import {
  addPending,
  applyDelete,
  applyEdit,
  applyReaction,
  failPending,
  flattenMessages,
  newestRealMessageId,
  patchMessage,
  removeMessage,
  removePendingMatching,
  replacePending,
  retryPending,
  upsertMessage,
} from './messages-cache';

const msg = (id: string, over: Partial<Message> = {}): Message => ({
  id,
  roomId: 'r1',
  sender: { id: 'u1', username: 'alice' },
  content: id,
  createdAt: '2026-10-27T09:00:00Z',
  editedAt: null,
  deletedAt: null,
  reactions: [],
  attachments: [],
  ...over,
});

/** Pages are newest first; messages inside a page are oldest first. */
const data = (...pages: Message[][]): MessagesData => ({
  pages: pages.map((items, i) => ({ items, nextCursor: i < pages.length - 1 ? 'cursor' : null })),
  pageParams: pages.map(() => undefined),
});
const ids = (d: MessagesData) => flattenMessages(d).map((m) => m.id);

describe('flattenMessages / newestRealMessageId', () => {
  it('returns every message oldest to newest', () => {
    expect(ids(data([msg('m3'), msg('m4')], [msg('m1'), msg('m2')]))).toEqual([
      'm1',
      'm2',
      'm3',
      'm4',
    ]);
  });

  it('finds the newest message that is not pending', () => {
    expect(newestRealMessageId(data([msg('m3'), msg('pending-1', { pending: true })]))).toBe('m3');
    expect(newestRealMessageId(data([msg('pending-1', { pending: true })]))).toBeNull();
    expect(newestRealMessageId(undefined)).toBeNull();
  });
});

describe('upsertMessage', () => {
  it('inserts a new message in time order into the newest page', () => {
    expect(ids(upsertMessage(data([msg('m1'), msg('m3')]), msg('m2')))).toEqual(['m1', 'm2', 'm3']);
    expect(ids(upsertMessage(data([msg('m1')]), msg('m2')))).toEqual(['m1', 'm2']);
  });

  it('replaces a known message wherever it is, without duplicating it', () => {
    const next = upsertMessage(
      data([msg('m3')], [msg('m1'), msg('m2')]),
      msg('m1', { content: 'changed' }),
    );
    expect(ids(next)).toEqual(['m1', 'm2', 'm3']);
    expect(flattenMessages(next)[0].content).toBe('changed');
  });
});

describe('pending messages', () => {
  it('appends a pending message at the end', () => {
    expect(ids(addPending(data([msg('m1')]), msg('pending-1', { pending: true })))).toEqual([
      'm1',
      'pending-1',
    ]);
  });

  it('replaces the placeholder with the real message', () => {
    const next = replacePending(
      data([msg('m1'), msg('pending-1', { pending: true, content: 'hi' })]),
      'pending-1',
      msg('m5', { content: 'hi' }),
    );
    expect(ids(next)).toEqual(['m1', 'm5']);
  });

  it('does not duplicate when the broadcast arrived before the ack', () => {
    const next = replacePending(
      data([msg('m1'), msg('m5'), msg('pending-1', { pending: true })]),
      'pending-1',
      msg('m5'),
    );
    expect(ids(next)).toEqual(['m1', 'm5']);
  });

  it('marks a failure and clears it on retry', () => {
    const failed = failPending(
      data([msg('pending-1', { pending: true })]),
      'pending-1',
      'No answer',
    );
    expect(flattenMessages(failed)[0]).toMatchObject({ pending: false, error: 'No answer' });
    const retried = retryPending(failed, 'pending-1');
    expect(flattenMessages(retried)[0]).toMatchObject({ pending: true, error: undefined });
  });

  it('drops the placeholder matching a broadcast of my own message, and nothing else', () => {
    const d = data([
      msg('m1', { content: 'other' }),
      msg('pending-1', { pending: true, content: 'hello' }),
      msg('pending-2', { pending: false, error: 'failed', content: 'hello' }),
    ]);
    expect(ids(removePendingMatching(d, 'hello'))).toEqual(['m1', 'pending-2']);
    expect(ids(removePendingMatching(d, 'nope'))).toEqual(['m1', 'pending-1', 'pending-2']);
  });
});

describe('edits and deletes', () => {
  it('patches and removes by id', () => {
    const d = data([msg('m1'), msg('m2')]);
    expect(flattenMessages(patchMessage(d, 'm2', (m) => ({ ...m, content: 'x' })))[1].content).toBe(
      'x',
    );
    expect(ids(removeMessage(d, 'm1'))).toEqual(['m2']);
  });

  it('applies an edit', () => {
    const next = applyEdit(data([msg('m1')]), 'm1', 'new text', '2026-10-27T10:00:00Z');
    expect(flattenMessages(next)[0]).toMatchObject({
      content: 'new text',
      editedAt: '2026-10-27T10:00:00Z',
    });
  });

  it('turns a deleted message into a tombstone', () => {
    const d = data([
      msg('m1', {
        reactions: [{ emoji: '👍', count: 1, reactedByMe: false }],
        attachments: [
          { id: 'a1', url: 'https://x/y.png', resourceType: 'image', mime: 'image/png', size: 5 },
        ],
      }),
    ]);
    expect(flattenMessages(applyDelete(d, 'm1', '2026-10-27T10:00:00Z'))[0]).toMatchObject({
      content: null,
      deletedAt: '2026-10-27T10:00:00Z',
      reactions: [],
      attachments: [],
    });
  });
});

describe('applyReaction', () => {
  const event = (over: Partial<MessageReactionEvent>): MessageReactionEvent => ({
    roomId: 'r1',
    messageId: 'm1',
    userId: 'me',
    emoji: '👍',
    action: 'added',
    count: 1,
    ...over,
  });
  const reactionsOf = (d: MessagesData) => flattenMessages(d)[0].reactions;

  it('adds my reaction to a message without reactions', () => {
    expect(reactionsOf(applyReaction(data([msg('m1')]), event({}), 'me'))).toEqual([
      { emoji: '👍', count: 1, reactedByMe: true },
    ]);
  });

  it("records someone else's reaction without marking it as mine", () => {
    expect(reactionsOf(applyReaction(data([msg('m1')]), event({ userId: 'bob' }), 'me'))).toEqual([
      { emoji: '👍', count: 1, reactedByMe: false },
    ]);
  });

  it('keeps my own reaction when someone else adds or removes theirs', () => {
    const d = data([msg('m1', { reactions: [{ emoji: '👍', count: 1, reactedByMe: true }] })]);
    expect(reactionsOf(applyReaction(d, event({ userId: 'bob', count: 2 }), 'me'))).toEqual([
      { emoji: '👍', count: 2, reactedByMe: true },
    ]);
    const two = data([msg('m1', { reactions: [{ emoji: '👍', count: 2, reactedByMe: true }] })]);
    expect(
      reactionsOf(applyReaction(two, event({ userId: 'bob', action: 'removed', count: 1 }), 'me')),
    ).toEqual([{ emoji: '👍', count: 1, reactedByMe: true }]);
  });

  it('un-marks my reaction when I remove it, and drops the chip at zero', () => {
    const d = data([msg('m1', { reactions: [{ emoji: '👍', count: 2, reactedByMe: true }] })]);
    expect(reactionsOf(applyReaction(d, event({ action: 'removed', count: 1 }), 'me'))).toEqual([
      { emoji: '👍', count: 1, reactedByMe: false },
    ]);
    const one = data([msg('m1', { reactions: [{ emoji: '👍', count: 1, reactedByMe: true }] })]);
    expect(reactionsOf(applyReaction(one, event({ action: 'removed', count: 0 }), 'me'))).toEqual(
      [],
    );
  });

  it('is idempotent: replaying the same event changes nothing', () => {
    const once = applyReaction(data([msg('m1')]), event({ userId: 'bob', count: 3 }), 'me');
    expect(applyReaction(once, event({ userId: 'bob', count: 3 }), 'me')).toEqual(once);
  });
});
