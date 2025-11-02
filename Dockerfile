FROM node:24-alpine

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install

COPY . .

RUN yarn prisma generate

EXPOSE 3000

CMD ["yarn", "dev"]