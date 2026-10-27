// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  avatarColor,
  formatDayLabel,
  formatFileSize,
  formatLastSeen,
  formatRelative,
  initials,
  typingText,
} from './format';

const now = new Date('2026-10-27T12:00:00Z').getTime();

describe('formatRelative', () => {
  it('describes recent times', () => {
    expect(formatRelative('2026-10-27T11:59:40Z', now)).toBe('just now');
    expect(formatRelative('2026-10-27T11:58:00Z', now)).toBe('2 min ago');
    expect(formatRelative('2026-10-27T11:00:00Z', now)).toBe('1 hour ago');
    expect(formatRelative('2026-10-27T09:00:00Z', now)).toBe('3 hours ago');
  });

  it('describes days', () => {
    expect(formatRelative('2026-10-26T11:00:00Z', now)).toBe('Yesterday');
    expect(formatRelative('2026-10-24T11:00:00Z', now)).toBe('3 days ago');
  });

  it('falls back to a date after a week', () => {
    expect(formatRelative('2026-10-10T12:00:00Z', now)).not.toMatch(/ago|Yesterday/);
  });

  it('never shows the future', () => {
    expect(formatRelative('2026-10-27T12:05:00Z', now)).toBe('just now');
  });
});

describe('formatLastSeen', () => {
  it('handles never seen, recent and yesterday', () => {
    expect(formatLastSeen(null, now)).toBe('Offline');
    expect(formatLastSeen('2026-10-27T11:55:00Z', now)).toBe('Last seen 5 min ago');
    expect(formatLastSeen('2026-10-26T11:00:00Z', now)).toBe('Last seen yesterday');
  });
});

describe('formatDayLabel', () => {
  // Built from local-time dates, so the test does not depend on the machine's time zone.
  const local = (day: number, hour: number) => new Date(2026, 9, day, hour, 0).toISOString();
  const today = new Date(2026, 9, 27, 12, 0);

  it('says Today and Yesterday, then a full date', () => {
    expect(formatDayLabel(local(27, 8), today)).toBe('Today');
    expect(formatDayLabel(local(26, 23), today)).toBe('Yesterday');
    const older = formatDayLabel(local(20, 10), today);
    expect(older).not.toBe('Today');
    expect(older).not.toBe('Yesterday');
    expect(older.length).toBeGreaterThan(0);
  });
});

describe('formatFileSize', () => {
  it('uses B, KB and MB', () => {
    expect(formatFileSize(500)).toBe('500 B');
    expect(formatFileSize(2048)).toBe('2 KB');
    expect(formatFileSize(1_258_291)).toBe('1.2 MB');
    expect(formatFileSize(10 * 1024 * 1024)).toBe('10.0 MB');
  });
});

describe('typingText', () => {
  it('names up to two people and summarizes more', () => {
    expect(typingText([])).toBe('');
    expect(typingText(['alice'])).toBe('alice is typing…');
    expect(typingText(['alice', 'bob'])).toBe('alice and bob are typing…');
    expect(typingText(['a', 'b', 'c'])).toBe('Several people are typing…');
  });
});

describe('avatars', () => {
  it('builds upper-case initials', () => {
    expect(initials('alice')).toBe('AL');
    expect(initials('x')).toBe('X');
  });

  it('always gives the same colour to the same name', () => {
    expect(avatarColor('alice')).toBe(avatarColor('alice'));
    expect(avatarColor('alice')).toContain('bg-');
  });
});
