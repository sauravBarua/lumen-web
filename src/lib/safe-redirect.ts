/** Only same-site paths are accepted, which blocks open redirects through ?callbackUrl=. */
export function safeRedirect(target: string | null | undefined, fallback = '/rooms'): string {
  if (!target || !target.startsWith('/') || target.startsWith('//') || target.startsWith('/\\')) {
    return fallback;
  }
  return target;
}
