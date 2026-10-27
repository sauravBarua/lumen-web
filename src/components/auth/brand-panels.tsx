import { Check, Hash } from 'lucide-react';

export function LoginBrandPanel() {
  return (
    <>
      <h2 className="text-3xl font-semibold leading-tight tracking-tight">
        A calm place for your community to talk.
      </h2>
      <p className="text-base text-primary-foreground/80">
        Rooms, direct messages and files, all in realtime. Quiet by default, lively when you need
        it.
      </p>
      <ul className="space-y-2.5 text-sm">
        <li className="flex items-center gap-3 rounded-lg bg-primary-foreground/10 px-4 py-3">
          <span className="size-2 rounded-full bg-emerald-300 shadow-[0_0_8px_2px_rgba(110,231,183,0.6)]" />
          alice, bob and 14 others are online
        </li>
        <li className="flex items-center gap-3 rounded-lg bg-primary-foreground/10 px-4 py-3">
          <Hash className="size-4" /> #general has 3 new messages
        </li>
      </ul>
    </>
  );
}

export function RegisterBrandPanel() {
  return (
    <>
      <h2 className="text-3xl font-semibold leading-tight tracking-tight">
        Pick a name, join a room, say hello.
      </h2>
      <ul className="space-y-3 text-sm text-primary-foreground/90">
        {[
          'Public and private rooms',
          'Direct messages with presence',
          'Share images and files up to 10 MB',
        ].map((item) => (
          <li key={item} className="flex items-center gap-3">
            <Check className="size-4" /> {item}
          </li>
        ))}
      </ul>
    </>
  );
}
