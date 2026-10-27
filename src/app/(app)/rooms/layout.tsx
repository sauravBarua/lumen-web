import { ChatShell } from '@/components/chat/chat-shell';

export default function RoomsLayout({ children }: { children: React.ReactNode }) {
  return <ChatShell>{children}</ChatShell>;
}
