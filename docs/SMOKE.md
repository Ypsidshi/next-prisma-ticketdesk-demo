# Smoke-проверка (локально)

| Проверка | Результат |
|----------|-----------|
| `docker compose up -d` (Postgres **5434**) | OK |
| `npm run db:migrate` | OK |
| `npm run db:seed` | OK |
| `npm run lint` | OK |
| `npm run typecheck` | OK |
| `npm run test` | OK (Vitest) |
| `npm run build` | OK |
| UI `http://localhost:3000` | OK |

Скриншоты для Kwork: `docs/screenshots/` (переснять: `npm run dev` + `node scripts/capture-screenshots.mjs`).
