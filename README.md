# Wishlist

A simple web application for managing wish lists.

## Development

### Prerequisites
- **Node.js** (v20 or later) and **npm**
- **Docker** & **Docker Compose** (for the database and optional API container)
- **Playwright** (installed via `npm i -D @playwright/test` – the dev script will install browsers automatically)

### 1. Set up environment variables
```bash
cp .env.example .env               # root (used by Docker compose)
cp api/.env.example api/.env       # API-specific variables
cp web/.env.development.example web/.env.development
```
Edit the files if you need custom ports or secrets. The defaults work out‑of‑the‑box.

### 2. Start the database (Docker)
```bash
docker compose up -d db   # brings up a PostgreSQL instance
```
The database listens on `localhost:65432` (mapped to container port 5432). Update your local `DATABASE_URL` if you were pointing at 5432/55432 before.

### 3. (Optional) Run the API locally
```bash
cd api
npm ci               # install dependencies
npm run dev          # starts the API (http://localhost:3000)
```
The API reads its configuration from `api/.env` and connects to the Docker‑hosted Postgres instance.

### 4. Load sample data
The seed wipes existing rows and inserts demo accounts and wish lists that cover the full flow (multiple families, reservations, and purchased items). From the `api/` directory run:
```bash
npm run migrate:latest   # apply database schema
npm run seed:run         # reset and populate demo data
```
Both commands expect to be run from `api/` so Knex can read `knexfile.cjs`; running elsewhere will produce a "No configuration file found" error.
Log in with `alice@example.com`, `bob@example.com`, or `charlie@example.com` using password `dev` to explore shared families, wish lists, and reservations without manual setup.

### 5. Run the frontend dev server
```bash
cd web
npm ci               # install dependencies
npm run dev          # Vite dev server on http://localhost:5173
```
The frontend reads `VITE_API_URL` from `web/.env.development`.

### 6. Verify the app
Open your browser at **http://localhost:5173**. You should see the landing page, be able to register a new user, log in, and navigate the wish‑list features.

## Tests

Run the tests using Docker Compose, which starts the API and DB services automatically and executes the test suite:
```bash
docker compose -f docker-compose.test.yml up --build tests
```

Install Playwright browsers once (if not already installed):
```bash
npx playwright install
```

---

For more details, see the individual `README`s in the `api` and `web` directories.
