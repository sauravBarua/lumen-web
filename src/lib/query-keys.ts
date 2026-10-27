export const roomsKey = ['rooms'] as const;
export const messagesKey = (roomId: string) => ['messages', roomId] as const;
export const membersKey = (roomId: string) => ['members', roomId] as const;
export const notificationsKey = (tab: 'all' | 'unread') => ['notifications', tab] as const;
export const notificationCountKey = ['notification-count'] as const;
export const preferencesKey = ['notification-preferences'] as const;
export const publicRoomsKey = (q: string) => ['public-rooms', q] as const;
export const peopleKey = ['people'] as const;
