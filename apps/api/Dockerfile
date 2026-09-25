# syntax=docker/dockerfile:1
FROM node:26.10.0-alpine AS deps
WORKDIR /app
# Node 26 Alpine ships without corepack binary
RUN npm install -g corepack \
  && corepack enable \
  && corepack prepare yarn@4.18.1 --activate
COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN yarn workspaces focus @hydrorage/api

FROM node:26.10.0-alpine AS build
WORKDIR /app
RUN npm install -g corepack \
  && corepack enable \
  && corepack prepare yarn@4.18.1 --activate
COPY --from=deps /app /app
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
WORKDIR /app/apps/api
RUN yarn build

FROM node:26.10.0-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN npm install -g corepack \
  && corepack enable \
  && corepack prepare yarn@4.18.1 --activate
COPY --from=build /app /app
WORKDIR /app/apps/api
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=6 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]
