import path from 'node:path';

const quote = (files) => files.map((f) => `"${path.relative(process.cwd(), f)}"`).join(' ');
// Generated or copied files are never linted or reformatted.
const hand = (files) =>
  files.filter((f) => !f.endsWith('schema.d.ts') && !f.endsWith('socket-events.ts'));

const config = {
  '*.{ts,tsx}': (files) => {
    const own = hand(files);
    return own.length ? [`eslint --fix ${quote(own)}`, `prettier --write ${quote(own)}`] : [];
  },
  '*.{json,md,yml,yaml,css,mjs}': (files) => [`prettier --write ${quote(files)}`],
};

export default config;
