# lumen-web

Next.js (App Router) frontend for Lumen. Standalone repo; the API lives in `lumen-api`.

## Run (dev)

```bash
cp .env.example .env      # then set AUTH_SECRET (openssl rand -base64 32)
pnpm install
pnpm gen:api              # types from ../lumen-api/openapi.json (or: pnpm gen:api:url with the API running)
pnpm dev                  # http://localhost:3000
```

The API must be running (`docker compose --profile app up -d` in `lumen-api`) and its `WEB_ORIGIN` must be `http://localhost:3000`.

## Scripts

`dev` · `build` · `start` · `lint` · `typecheck` · `test` · `gen:api` · `gen:api:url`

## Notes

- `src/lib/socket-events.ts` is an identical copy of the API's `src/modules/realtime/socket-events.ts`. Copy it again when the API changes it; never edit it here.
- `src/lib/api/schema.d.ts` is generated: re-run `pnpm gen:api` when the API's OpenAPI changes.
- Conventional Commits (enforced by commitlint).
