export function RoomListSkeleton() {
  return (
    <ul className="animate-pulse space-y-2.5 px-3 py-3" role="status" aria-label="Loading rooms">
      {[24, 32, 20].map((w, i) => (
        <li key={i} className="flex items-center gap-2.5">
          <span className="size-4 rounded bg-muted" />
          <span className="h-3.5 rounded bg-muted" style={{ width: `${w * 4}px` }} />
        </li>
      ))}
      {[16, 28].map((w, i) => (
        <li key={`d${i}`} className="flex items-center gap-2.5">
          <span className="size-6 rounded-full bg-muted" />
          <span className="h-3.5 rounded bg-muted" style={{ width: `${w * 4}px` }} />
        </li>
      ))}
    </ul>
  );
}

export function MessageListSkeleton() {
  return (
    <ul className="animate-pulse space-y-4 px-4 py-4" role="status" aria-label="Loading messages">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex gap-3">
          <span className="size-9 shrink-0 rounded-full bg-muted" />
          <span className="flex-1 space-y-2">
            <span className="block h-3 w-28 rounded bg-muted" />
            <span className="block h-3.5 w-full rounded bg-muted" />
            <span className="block h-3.5 w-2/3 rounded bg-muted" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MemberListSkeleton() {
  return (
    <ul className="animate-pulse space-y-3 px-3" role="status" aria-label="Loading members">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex items-center gap-2.5">
          <span className="size-8 rounded-full bg-muted" />
          <span className="h-3.5 w-20 rounded bg-muted" />
        </li>
      ))}
    </ul>
  );
}

export function NotificationSkeleton() {
  return (
    <ul className="divide-y divide-border" role="status" aria-label="Loading notifications">
      {[0, 1, 2].map((i) => (
        <li key={i} className="flex animate-pulse gap-3 px-4 py-3">
          <span className="size-9 shrink-0 rounded-full bg-muted" />
          <span className="flex-1 space-y-2">
            <span className="block h-3.5 w-3/4 rounded bg-muted" />
            <span className="block h-3 w-full rounded bg-muted" />
            <span className="block h-2.5 w-12 rounded bg-muted" />
          </span>
        </li>
      ))}
    </ul>
  );
}
