FROM oven/bun AS build
WORKDIR /home/node/app

COPY . .
RUN bun install
RUN bun run tsc


FROM oven/bun
WORKDIR /home/node/app

COPY . .
RUN bun install

CMD [ "bun", "run", "src/index.ts"]