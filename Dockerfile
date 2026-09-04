FROM node:24-alpine AS frontend-build
WORKDIR /build/Frontend
COPY Frontend/package*.json ./
RUN npm ci
COPY Frontend/ ./
RUN npm run build

FROM node:24-alpine AS backend-build
WORKDIR /build/Backend
COPY Backend/package*.json ./
RUN npm ci
COPY Backend/ ./
RUN npm run build && npm prune --omit=dev

FROM node:24-alpine AS runtime
WORKDIR /app/Backend
ENV NODE_ENV=production PORT=8080
COPY --chown=node:node --from=backend-build /build/Backend/package*.json ./
COPY --chown=node:node --from=backend-build /build/Backend/node_modules ./node_modules
COPY --chown=node:node --from=backend-build /build/Backend/dist ./dist
COPY --chown=node:node --from=frontend-build /build/Frontend/dist /app/Frontend/dist
USER node
EXPOSE 8080
CMD ["node", "dist/index.node.js"]
