import type { Metadata } from 'next';
import { RoomsIndex } from '@/components/chat/rooms-index';

export const metadata: Metadata = { title: 'Rooms' };

export default function RoomsPage() {
  return <RoomsIndex />;
}
