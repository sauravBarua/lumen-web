import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safe-redirect';

describe('safeRedirect', () => {
  it('keeps same-site paths, with query and hash', () => {
    expect(safeRedirect('/rooms')).toBe('/rooms');
    expect(safeRedirect('/rooms/abc?tab=members#top')).toBe('/rooms/abc?tab=members#top');
  });

  it('falls back for missing values', () => {
    expect(safeRedirect(undefined)).toBe('/rooms');
    expect(safeRedirect('')).toBe('/rooms');
    expect(safeRedirect(null, '/home')).toBe('/home');
  });

  it('rejects absolute and protocol-relative urls', () => {
    expect(safeRedirect('https://evil.example')).toBe('/rooms');
    expect(safeRedirect('//evil.example')).toBe('/rooms');
    expect(safeRedirect('/\\evil.example')).toBe('/rooms');
    expect(safeRedirect('javascript:alert(1)')).toBe('/rooms');
  });
});
