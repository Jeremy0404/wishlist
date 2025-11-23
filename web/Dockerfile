# ---------- build ----------
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV VITE_API_URL=/api
RUN npm run build
ARG COMMIT_SHA=unknown
RUN sh -lc 'echo "$COMMIT_SHA" > /app/dist/version.txt'

# ---------- runtime ----------
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=20s --timeout=3s --retries=5 \
  CMD wget -qO- http://127.0.0.1/ > /dev/null 2>&1 || exit 1
