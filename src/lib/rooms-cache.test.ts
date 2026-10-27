// @vitest-environment node
import { describe, expect, it } from 'vitest';
import type { Room } from '@/lib/types';
import { addRoom, bumpUnread, clearUnread, removeRoom, splitRooms } from './rooms-cache';

const room = (id: string, over: Partial<Room> = {}): Room => ({
  id,
  type: 'PUBLIC',
  name: id,
  description: null,
  createdAt: '2026-01-01T00:00:00Z',
  myRole: 'MEMBER',
  memberCount: 1,
  unreadCount: 0,
  dmUser: null,
  ...over,
});
const dm = (id: string, username: string) =>
  room(id, { type: 'DM', name: null, dmUser: { id: `u-${username}`, username } });

describe('unread counters', () => {
  const rooms = [room('a', { unreadCount: 2 }), room('b')];

  it('bumps only the target room', () => {
    expect(bumpUnread(rooms, 'a').map((r) => r.unreadCount)).toEqual([3, 0]);
    expect(bumpUnread(rooms, 'b').map((r) => r.unreadCount)).toEqual([2, 1]);
  });

  it('clears only the target room', () => {
    expect(clearUnread(rooms, 'a').map((r) => r.unreadCount)).toEqual([0, 0]);
    expect(clearUnread(rooms, 'b').map((r) => r.unreadCount)).toEqual([2, 0]);
  });
});

describe('addRoom / removeRoom', () => {
  it('puts a new room first', () => {
    expect(addRoom([room('a')], room('b')).map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('replaces an existing room instead of duplicating it', () => {
    const next = addRoom([room('a'), room('b')], room('a', { memberCount: 9 }));
    expect(next.map((r) => r.id)).toEqual(['a', 'b']);
    expect(next[0].memberCount).toBe(9);
  });

  it('removes a room', () => {
    expect(removeRoom([room('a'), room('b')], 'a').map((r) => r.id)).toEqual(['b']);
  });
});

describe('splitRooms', () => {
  const rooms = [
    room('r1', { name: 'general' }),
    room('r2', { name: 'design', type: 'PRIVATE' }),
    dm('d1', 'bob'),
    dm('d2', 'alice'),
  ];

  it('separates channels from DMs and sorts both', () => {
    const { channels, dms } = splitRooms(rooms, '');
    expect(channels.map((r) => r.name)).toEqual(['design', 'general']);
    expect(dms.map((r) => r.dmUser?.username)).toEqual(['alice', 'bob']);
  });

  it('filters by the query, ignoring case', () => {
    expect(splitRooms(rooms, 'GEN').channels.map((r) => r.name)).toEqual(['general']);
    expect(splitRooms(rooms, 'GEN').dms).toEqual([]);
    expect(splitRooms(rooms, 'ali').dms.map((r) => r.dmUser?.username)).toEqual(['alice']);
    expect(splitRooms(rooms, 'ali').channels).toEqual([]);
  });

  it('returns nothing for a query that matches nothing', () => {
    expect(splitRooms(rooms, 'zebra')).toEqual({ channels: [], dms: [] });
  });
});
