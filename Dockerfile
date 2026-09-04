FROM node:24-alpine AS base
RUN npm install -g pnpm@10.32.1
WORKDIR /build

# Shared dependency layer for both build stages. Only the manifests are copied
# so this layer is reused whenever application source changes.
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc ./
COPY Backend/package.json Backend/
COPY Frontend/package.json Frontend/
RUN pnpm install --frozen-lockfile

FROM deps AS frontend-build
COPY Frontend/ Frontend/
RUN pnpm --filter frontend run build

# Keeps devDependencies: the Compose `migrate` service runs drizzle-kit from here.
FROM deps AS backend-build
COPY Backend/ Backend/
RUN pnpm --filter @time-report/api run build

# Self-contained production tree with a real (non-symlinked) node_modules.
FROM backend-build AS backend-prod
RUN pnpm --filter @time-report/api deploy --prod /prod/api

FROM node:24-alpine AS runtime
WORKDIR /app/Backend
ENV NODE_ENV=production PORT=8080
COPY --chown=node:node --from=backend-prod /prod/api ./
COPY --chown=node:node --from=frontend-build /build/Frontend/dist /app/Frontend/dist
USER node
EXPOSE 8080
CMD ["node", "dist/index.node.js"]
