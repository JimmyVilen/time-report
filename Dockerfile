# Shared stage: full dependency tree plus the built app. docker-compose targets
# this stage for the migration job, which needs tsx and scripts/db from devDeps.
FROM node:24-alpine AS build
WORKDIR /build
COPY package*.json ./
RUN npm ci
COPY . ./
RUN npm run build

FROM build AS prune
RUN npm prune --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=8080
COPY --chown=node:node --from=prune /build/package*.json ./
COPY --chown=node:node --from=prune /build/node_modules ./node_modules
COPY --chown=node:node --from=prune /build/dist ./dist
COPY --chown=node:node --from=prune /build/serve.js ./serve.js
USER node
EXPOSE 8080
CMD ["node", "serve.js"]
