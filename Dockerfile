FROM oven/bun AS build
WORKDIR /home/node/app

COPY . .
RUN bun tsc

FROM oven/bun
WORKDIR /home/node/app

COPY . .

CMD [ "bun", "run", "src/index.ts"]