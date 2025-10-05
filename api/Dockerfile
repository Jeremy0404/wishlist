FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json knexfile.cjs ./
COPY migrations/ migrations/
COPY src/ src/
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production
COPY --from=build /app/dist ./dist
COPY knexfile.cjs ./knexfile.cjs
ENV NODE_ENV=production
CMD ["npm","run","start:prod"]
