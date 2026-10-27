export type ThemePreference = 'light' | 'dark' | 'system';

const PREF_KEY = 'lumen-theme-pref';
const THEME_KEY = 'lumen-theme';
const EVENT = 'lumen-theme-change';

export function getThemePreference(): ThemePreference {
  try {
    const p = localStorage.getItem(PREF_KEY) ?? localStorage.getItem(THEME_KEY);
    return p === 'light' || p === 'dark' || p === 'system' ? p : 'system';
  } catch {
    return 'system';
  }
}

export function applyTheme(pref: ThemePreference): void {
  const dark =
    pref === 'dark' || (pref === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', dark);
  try {
    localStorage.setItem(PREF_KEY, pref);
    localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light');
  } catch {
    // Private mode: the theme still changes for this visit.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function toggleTheme(): void {
  applyTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark');
}

/** For useSyncExternalStore. Also follows the operating system while the preference is "system". */
export function subscribeTheme(onChange: () => void): () => void {
  const mql = matchMedia('(prefers-color-scheme: dark)');
  const onSystemChange = () => {
    if (getThemePreference() === 'system') applyTheme('system');
  };
  window.addEventListener(EVENT, onChange);
  window.addEventListener('storage', onChange);
  mql.addEventListener('change', onSystemChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('storage', onChange);
    mql.removeEventListener('change', onSystemChange);
  };
}
