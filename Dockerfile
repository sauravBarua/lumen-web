# syntax=docker/dockerfile:1.7
ARG NODE_VERSION=24
ARG PNPM_VERSION=12.15.0

FROM node:${NODE_VERSION}-slim AS base
ARG PNPM_VERSION
RUN npm install -g pnpm@${PNPM_VERSION}
WORKDIR /app
RUN chown node:node /app
USER node

FROM base AS deps
ENV CI=true
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml* .npmrc* ./
COPY --chown=node:node .husky/install.mjs .husky/install.mjs
RUN pnpm install --frozen-lockfile

FROM deps AS build
# NEXT_PUBLIC_* values are inlined into the browser bundle at build time:
# set it to the public URL of the API. Secrets are never needed to build.
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL} \
    NEXT_OUTPUT=standalone \
    SKIP_ENV_VALIDATION=1 \
    NEXT_TELEMETRY_DISABLED=1
COPY --chown=node:node . .
RUN pnpm build

FROM base AS runtime
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/login').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
CMD ["node", "server.js"]