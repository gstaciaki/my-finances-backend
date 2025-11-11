# My Finances Backend

This system corresponds to the backend of my financial tracking application. It is a personal project aimed at enhancing my studies by allowing me to develop the entire ecosystem of the application.

## Technologies

- Express.js
- Prisma
- Postgresql

## Running locally with Docker

### Required tools:

```bash
docker
docker  compose
```

### Set environment variables

```bash
cp  .env.example  .env
```

### Up containers

```bash
docker  compose  up  -d
```
OR
```
./run dc up -d
```

### Run migrations

```
./run cmd pnpm prisma migrate dev
```

### Checking API

```
curl --location 'http://localhost:3000/health'
```


### Running Tests

#### Unit Tests:

```bash

./run cmd pnpm test:prepare

./run cmd pnpm test

```

  

#### Code Quality

```bash
./run cmd pnpm eslint
```
