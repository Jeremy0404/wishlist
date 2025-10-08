# ---------- build stage ----------
FROM node:20-slim AS build
WORKDIR /app

# copy manifests
COPY package.json package-lock.json ./
RUN npm ci

# copy sources
COPY tsconfig.json knexfile.cjs ./
COPY migrations/ ./migrations/
COPY src/ ./src/

# build TS
RUN npm run build

# ---------- runtime stage ----------
FROM node:20-slim AS runtime
WORKDIR /app

# production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# copy app
COPY --from=build /app/dist ./dist
COPY knexfile.cjs ./knexfile.cjs
COPY migrations/ ./migrations/

# healthcheck
HEALTHCHECK --interval=20s --timeout=3s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"

# default port (internal)
EXPOSE 3000

# start:prod must: run migrations then start server
CMD ["npm", "run", "start:prod"]
