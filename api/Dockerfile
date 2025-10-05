FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json knexfile.cjs ./
COPY migrations/ migrations/
COPY src/ src/
RUN npx tsc -p .

FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/migrations ./migrations
CMD ["node", "dist/server.js"]
