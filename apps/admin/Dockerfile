# syntax=docker/dockerfile:1
FROM node:26.10.0-alpine AS deps
WORKDIR /app
RUN npm install -g corepack \
  && corepack enable \
  && corepack prepare yarn@4.18.0 --activate
COPY package.json yarn.lock .yarnrc.yml ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/shared/package.json ./packages/shared/
RUN yarn workspaces focus @hydrorage/admin

FROM node:26.10.0-alpine AS build
WORKDIR /app
RUN npm install -g corepack \
  && corepack enable \
  && corepack prepare yarn@4.18.0 --activate
COPY --from=deps /app /app
COPY apps/admin ./apps/admin
COPY packages/shared ./packages/shared
ARG VITE_API_URL=https://api.hydrorage.com.tr/api
ARG VITE_LANDING_URL=https://hydrorage.com.tr
ENV VITE_API_URL=$VITE_API_URL \
    VITE_LANDING_URL=$VITE_LANDING_URL
WORKDIR /app/apps/admin
RUN yarn build

FROM nginx:1.27-alpine AS runner
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/admin/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
