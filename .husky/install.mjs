// Husky is a dev dependency: skip it for production, CI and Docker installs.
if (process.env.NODE_ENV === 'production' || process.env.CI === 'true') process.exit(0);
const husky = (await import('husky')).default;
console.log(husky());
