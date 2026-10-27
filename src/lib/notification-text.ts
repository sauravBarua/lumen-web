import type { NotificationDto } from '@/lib/types';

export function notificationTitle(n: NotificationDto): string {
  const who = n.actor?.username ?? 'Someone';
  const room = n.roomName ? `#${n.roomName}` : 'a room';
  switch (n.type) {
    case 'MENTION':
      return `${who} mentioned you in ${room}`;
    case 'DM':
      return `New message from ${who}`;
    case 'INVITE':
      return `${who} added you to ${room}`;
  }
}

export const notificationHref = (n: NotificationDto) =>
  n.roomId ? `/rooms/${n.roomId}` : '/rooms';
