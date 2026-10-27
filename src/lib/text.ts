const MENTION = /(?<![a-z0-9_])@([a-z0-9_]{3,20})(?![a-z0-9_])/gi;

export type TextPart =
  { type: 'text'; value: string } | { type: 'mention'; value: string; username: string };

/** Splits a message into plain text and @mentions (same rule as the API's mention detection). */
export function splitMentions(content: string): TextPart[] {
  const parts: TextPart[] = [];
  let last = 0;
  for (const match of content.matchAll(MENTION)) {
    const index = match.index ?? 0;
    if (index > last) parts.push({ type: 'text', value: content.slice(last, index) });
    parts.push({ type: 'mention', value: match[0], username: match[1].toLowerCase() });
    last = index + match[0].length;
  }
  if (last < content.length) parts.push({ type: 'text', value: content.slice(last) });
  return parts;
}
