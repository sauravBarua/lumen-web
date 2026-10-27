import type { Room } from '@/lib/types';

export const bumpUnread = (rooms: Room[], roomId: string) =>
  rooms.map((r) => (r.id === roomId ? { ...r, unreadCount: r.unreadCount + 1 } : r));

export const clearUnread = (rooms: Room[], roomId: string) =>
  rooms.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r));

export const addRoom = (rooms: Room[], room: Room) =>
  rooms.some((r) => r.id === room.id)
    ? rooms.map((r) => (r.id === room.id ? room : r))
    : [room, ...rooms];

export const removeRoom = (rooms: Room[], roomId: string) => rooms.filter((r) => r.id !== roomId);

/** Channels (public + private) sorted by name, DMs sorted by the other person; both filtered by the query. */
export function splitRooms(rooms: Room[], query: string): { channels: Room[]; dms: Room[] } {
  const q = query.trim().toLowerCase();
  const match = (label: string) => !q || label.toLowerCase().includes(q);
  const channels = rooms
    .filter((r) => r.type !== 'DM' && match(r.name ?? ''))
    .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
  const dms = rooms
    .filter((r) => r.type === 'DM' && match(r.dmUser?.username ?? ''))
    .sort((a, b) => (a.dmUser?.username ?? '').localeCompare(b.dmUser?.username ?? ''));
  return { channels, dms };
}
