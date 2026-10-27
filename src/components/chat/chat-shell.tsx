'use client';

import { RoomSidebar } from '@/components/chat/room-sidebar';
import { useUiStore } from '@/stores/ui-store';

export function ChatShell({ children }: { children: React.ReactNode }) {
  const drawerOpen = useUiStore((s) => s.roomsDrawerOpen || s.membersMobileOpen);
  const closeDrawers = useUiStore((s) => s.closeDrawers);

  return (
    <div className="flex h-dvh overflow-hidden">
      {drawerOpen && (
        <div
          className="fixed inset-0 z-30 bg-foreground/40 lg:hidden"
          aria-hidden="true"
          onClick={closeDrawers}
        />
      )}
      <RoomSidebar />
      <div className="flex min-w-0 flex-1">{children}</div>
    </div>
  );
}
