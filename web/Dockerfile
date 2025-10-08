# ---------- build stage ----------
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
ARG COMMIT_SHA=unknown
RUN echo "$COMMIT_SHA" > /app/dist/version.txt

COPY . .

ENV VITE_API_URL=/api
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=3s --retries=5 \
  CMD wget -qO- http://localhost/ >/dev/null 2>&1 || exit 1
