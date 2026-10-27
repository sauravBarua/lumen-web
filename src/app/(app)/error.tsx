'use client';

import { ErrorState } from '@/components/common/states';

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <ErrorState
        title="Something went wrong"
        description="An unexpected error occurred. Try again, or reload the page."
        onRetry={reset}
      />
    </main>
  );
}
