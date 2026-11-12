# My Finances Backend

This system corresponds to the backend of my financial tracking application. It is a personal project aimed at enhancing my studies by allowing me to develop the entire ecosystem of the application.

## Technologies

- Express.js
- Prisma
- PostgreSQL

## Running locally

The Compose file starts **only the database**. The API runs on the host.

### Required tools

- Node.js, version in `.nvmrc` (`nvm use`)
- pnpm, version in the `packageManager` field of `package.json` (`corepack enable`)
- Docker with Docker Compose

### Setup

```bash
cp .env.example .env          # fill in JWT_SECRET with your own value
pnpm install
docker compose up -d          # creates the `myfinances` and `myfinances_test` databases
pnpm prisma migrate deploy    # applies the migrations to the development database
pnpm dev                      # API on http://localhost:3000
```

The test database is created by `docker/init-test-db.sql`, which Postgres only runs
when the volume is empty. If you already have a volume, recreate it
(`docker compose down -v`) or run:

```bash
docker compose exec db psql -U myfinances_user -d myfinances -c "CREATE DATABASE myfinances_test;"
```

### Checking the API

```bash
curl http://localhost:3000/health
```

## Tests

With `NODE_ENV=test` the API uses `DATABASE_URL_TEST`, and the database cleanup
refuses any database whose name does not end with `_test`.

```bash
pnpm test:db:migrate   # applies the migrations to the test database
pnpm test              # unit tests and e2e (supertest)
```

## Seeds (development only)

```bash
pnpm seed       # wipes the development database and creates admin@example.com
pnpm populate   # adds 50 fake users
```

## Code quality

```bash
pnpm lint
```
