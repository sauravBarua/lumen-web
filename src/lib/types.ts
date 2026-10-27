import type { InfiniteData } from '@tanstack/react-query';
import type {
  MessageDto,
  NotificationDto,
  NotificationType,
  PresenceStatus,
} from '@/lib/socket-events';

export type { MessageDto, NotificationDto, NotificationType, PresenceStatus };

export type RoomType = 'PUBLIC' | 'PRIVATE' | 'DM';
export type RoomRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Room {
  id: string;
  type: RoomType;
  name: string | null;
  description: string | null;
  createdAt: string;
  myRole: RoomRole;
  memberCount: number;
  unreadCount: number;
  dmUser: { id: string; username: string } | null;
}

export interface PublicRoom {
  id: string;
  name: string | null;
  description: string | null;
  memberCount: number;
  joined: boolean;
}
export interface PublicRoomsPage {
  items: PublicRoom[];
  nextCursor: string | null;
}

export interface Member {
  userId: string;
  username: string;
  role: RoomRole;
  joinedAt: string;
}

export interface PresenceItem {
  userId: string;
  status: PresenceStatus;
  lastSeenAt: string | null;
}

/** A message as shown in the UI: `pending` while it is being sent, `error` when sending failed. */
export interface Message extends MessageDto {
  pending?: boolean;
  error?: string;
}
export interface MessagesPage {
  items: Message[];
  nextCursor: string | null;
}
export type MessagesData = InfiniteData<MessagesPage, unknown>;

export interface NotificationsPage {
  items: NotificationDto[];
  nextCursor: string | null;
  unreadCount: number;
}

export interface Preference {
  type: NotificationType;
  inApp: boolean;
  email: boolean;
}
