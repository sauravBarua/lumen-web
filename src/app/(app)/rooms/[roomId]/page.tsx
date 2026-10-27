import type { Metadata } from 'next';
import { RoomScreen } from '@/components/chat/room-screen';

export const metadata: Metadata = { title: 'Rooms' };

export default async function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params;
  return <RoomScreen roomId={roomId} />;
}
