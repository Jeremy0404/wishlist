# Deploy artifacts

Files a human copies to the `mediaserver` VPS to run wishlist in production at
<https://wishlist.jerco.fr>.

Unlike a single-container app, wishlist runs three services: `web` (nginx, serves the SPA and
proxies `/api/` to the API), `api` (Node, self-migrating on startup), and `postgres`. NPM targets
`wishlist-web-1:80`.

## Files

- `docker-compose.prod.yml` — `web` + `api` (both from GHCR) + self-hosted PostgreSQL 16.
- `.env.example` — every variable the stack reads. Copy to `.env` on the server and fill in real
  values; never commit `.env`.
- `rollback.sh <version>` — points the stack at an already-published image tag and restarts `web`
  and `api` together. Never touches the database.
- `backup.sh` — dumps Postgres *and* archives the uploads volume, encrypts both with `age`.
- `backup-freshness-check.sh` — cron-friendly check that fails loudly if either the newest database
  dump or the newest uploads archive is older than a threshold.

There is no `migrate.sh`: the API self-migrates. `api/package.json`'s `start:prod` runs
`knex migrate:latest` before starting the server, so a forward deploy applies pending migrations
as a side effect of `rollback.sh` restarting the container.

## One-time setup on the server

1. Copy this repo's `deploy/` directory to `~/wishlist/deploy/` on the server.
2. `cp deploy/.env.example deploy/.env` and fill in real values:
   - `RELEASE_VERSION` — the image tag to run, filled in on the first real deploy.
   - `APP_PORT` — `3005`, a free loopback port on this host.
   - `POSTGRES_PASSWORD` — generated fresh, never reused across apps.
   - `JWT_SECRET` — generated fresh. Rotating it invalidates every existing session.
   - `SMTP_URL` / `MAIL_FROM` — the relay the magic link is sent through. **Left blank, sign-in
     silently breaks for anyone without a live session**: the API logs the message instead of
     sending it.
   - `BACKUP_AGE_RECIPIENT` — an `age` public key. The matching private key is generated off-server
     and handed to the operator once — never written to the server or committed anywhere.
   - `BACKUP_OFFHOST_DESTINATION` — blank for now: backups are local-only and `backup.sh` warns on
     every run. Tracked as a follow-up issue.
   - `BACKUP_ALERT_DISCORD_WEBHOOK` — blank for now. Tracked as a follow-up issue.
3. `docker login ghcr.io` on the server, if not already authenticated from another app's deploy.
4. `docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env up -d`.
5. Join NPM to the stack's private network (see "Networking") and configure the
   `wishlist.jerco.fr` proxy host in the NPM UI.
6. Add `backup.sh` and `backup-freshness-check.sh` to cron.

## Networking

The stack publishes `web` on `127.0.0.1:3005` only — never a public interface. NPM reaches it by
container name over the stack's private Docker network, which has to be joined once after the
first `up -d` creates it:

```bash
docker network connect wishlist_default nginx-proxy-manager
```

NPM proxy host: `wishlist.jerco.fr` → `wishlist-web-1` port `80`, scheme `http`, Block Common
Exploits on, Websockets off, Let's Encrypt cert with Force SSL + HTTP/2 + HSTS.

The loopback port is only for host-local health checks (`rollback.sh`) and debugging.

## Deployment

The `deploy` job is **not** wired into `release.yml` yet. A tag push builds, pushes and cosign-signs
both images and stops there; the deploy itself is run deliberately, by hand, from the server:

```bash
ssh mediaserver "cd ~/wishlist && ./deploy/rollback.sh <version>"
```

Automating this on every tag is a separate decision, deferred until the pipeline has been run
manually and verified end to end at least once.

## Required GitHub Actions secrets

`RELEASE_PLEASE_TOKEN` is the only secret `release-please.yml` needs. `release.yml`'s `build`/`sign`
jobs publish and sign both images using the built-in `GITHUB_TOKEN` and OIDC — no extra secrets.

`SSH_HOST` / `SSH_USER` / `SSH_KEY` / `SSH_PORT` (a dedicated `wishlist-ci-deploy` ed25519 keypair)
are only needed once the `deploy` job is actually wired in.

## Restore

A restore needs **both** artefacts. The database alone brings wishlist back with every item image
broken.

```bash
# Database
age -d -i <private-key> wishlist-<timestamp>.sql.age \
  | docker compose -f deploy/docker-compose.prod.yml --env-file deploy/.env \
      exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"

# Uploads volume
age -d -i <private-key> wishlist-uploads-<timestamp>.tar.age \
  | docker run --rm -i -v wishlist-uploads:/data alpine:3 tar -xf - -C /data
```
