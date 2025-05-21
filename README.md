
  

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

  
  

### Running Tests

  

#### Unit Tests:

```bash


./run cmd yarn test:prepare

docker  compose  exec  api  yarn  test

  

```

  

#### Code Quality

```bash


docker  compose  exec  api  yarn  eslint

  

```
