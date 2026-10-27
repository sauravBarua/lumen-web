// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Message } from '@/lib/types';
import { buildTimeline, firstUnreadIndex, type TimelineItem } from './timeline';

const msg = (
  id: string,
  sender: string,
  createdAt: string,
  over: Partial<Message> = {},
): Message => ({
  id,
  roomId: 'r1',
  sender: { id: sender, username: sender },
  content: id,
  createdAt,
  editedAt: null,
  deletedAt: null,
  reactions: [],
  attachments: [],
  ...over,
});

// Local-time dates keep the day boundaries independent of the machine's time zone.
const at = (day: number, hour: number, minute: number) =>
  new Date(2026, 9, day, hour, minute).toISOString();
const now = new Date(2026, 9, 27, 12, 0);
const build = (messages: Message[], unreadAtOpen = 0) =>
  buildTimeline(messages, { meId: 'me', unreadAtOpen, now });
const onlyMessages = (items: TimelineItem[]) =>
  items.filter((i): i is Extract<TimelineItem, { kind: 'message' }> => i.kind === 'message');

describe('firstUnreadIndex', () => {
  const list = [
    msg('1', 'alice', at(27, 9, 0)),
    msg('2', 'me', at(27, 9, 1)),
    msg('3', 'alice', at(27, 9, 2)),
    msg('4', 'alice', at(27, 9, 3)),
  ];

  it('is -1 when nothing is unread', () => {
    expect(firstUnreadIndex(list, 'me', 0)).toBe(-1);
  });

  it("counts only other people's messages, from the end", () => {
    expect(firstUnreadIndex(list, 'me', 1)).toBe(3);
    expect(firstUnreadIndex(list, 'me', 2)).toBe(2);
    expect(firstUnreadIndex(list, 'me', 3)).toBe(0); // my own message at index 1 is skipped
  });

  it('skips deleted and pending messages', () => {
    const messages = [
      msg('1', 'alice', at(27, 9, 0)),
      msg('2', 'alice', at(27, 9, 1), { deletedAt: at(27, 9, 5) }),
      msg('3', 'alice', at(27, 9, 2)),
      msg('p', 'bob', at(27, 9, 3), { pending: true }),
    ];
    expect(firstUnreadIndex(messages, 'me', 2)).toBe(0);
  });
});

describe('buildTimeline', () => {
  it('adds a day divider whenever the day changes', () => {
    const items = build([
      msg('1', 'alice', at(26, 9, 0)),
      msg('2', 'alice', at(26, 9, 1)),
      msg('3', 'alice', at(27, 9, 0)),
    ]);
    expect(items.map((i) => i.kind)).toEqual(['day', 'message', 'message', 'day', 'message']);
    expect(items[0]).toMatchObject({ label: 'Yesterday' });
    expect(items[3]).toMatchObject({ label: 'Today' });
  });

  it('groups consecutive messages from the same sender within five minutes', () => {
    const items = build([
      msg('1', 'alice', at(27, 9, 0)),
      msg('2', 'alice', at(27, 9, 3)),
      msg('3', 'alice', at(27, 9, 10)), // seven minutes after the previous one
      msg('4', 'bob', at(27, 9, 11)), // different sender
    ]);
    expect(onlyMessages(items).map((i) => i.grouped)).toEqual([false, true, false, false]);
  });

  it('places the "new messages" divider before the first unread message and restarts the group there', () => {
    const items = build(
      [
        msg('1', 'alice', at(27, 9, 0)),
        msg('2', 'alice', at(27, 9, 1)),
        msg('3', 'alice', at(27, 9, 2)),
      ],
      2,
    );
    expect(items.map((i) => i.kind)).toEqual(['day', 'message', 'new', 'message', 'message']);
    expect(onlyMessages(items).map((i) => i.grouped)).toEqual([false, false, true]);
  });

  it('has no "new messages" divider when everything is read', () => {
    expect(build([msg('1', 'alice', at(27, 9, 0))], 0).some((i) => i.kind === 'new')).toBe(false);
  });

  it('gives every item a unique key', () => {
    const items = build([msg('1', 'alice', at(26, 9, 0)), msg('2', 'bob', at(27, 9, 0))], 1);
    const keys = items.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
