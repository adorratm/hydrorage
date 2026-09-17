FROM node:26.9.0-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare yarn@4.18.0 --activate
COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN yarn workspaces focus @hydrorage/api

FROM node:26.9.0-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare yarn@4.18.0 --activate
COPY --from=deps /app /app
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
WORKDIR /app/apps/api
RUN yarn build

FROM node:26.9.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable && corepack prepare yarn@4.18.0 --activate
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3000
CMD ["sh", "-c", "yarn db:migrate && yarn db:seed && node dist/main.js"]
