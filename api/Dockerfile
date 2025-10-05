# Utilise node 20 en mode slim
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY tsconfig.json knexfile.cjs ./
COPY migrations/ migrations/
COPY src/ src/
RUN npm i -g ts-node typescript
RUN npx tsc -p .

FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/migrations ./migrations

CMD ["node", "dist/server.js"]
