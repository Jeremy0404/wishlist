# Contributing

## Workflow

One task = one branch = one PR.

1. Branch off `main`:
   - `feat/<short-name>` — new feature
   - `fix/<short-name>` — bug fix
   - `chore/<short-name>` — tooling, deps, config
2. Develop and commit using [Conventional Commits](#commits).
3. Push the branch and open a Pull Request.
4. **CI must be green** (lint + typecheck on both packages, plus the end-to-end test stack) before
   merging.
5. Squash merge into `main` — the only merge method enabled on this repo. The PR title becomes the
   squash commit message, so title it like a Conventional Commit (see below).

`main` is protected: changes land through PRs, never direct pushes.

## Local checks (same as CI)

Each package is installed and checked on its own — there is no root workspace.

```bash
cd api && npm ci && npm run lint && npm run typecheck
cd web && npm ci && npm run lint && npm run typecheck
docker compose -f docker-compose.test.yml up --build --abort-on-container-exit tests
```

## Issues

Issues are filed through the forms in `.github/ISSUE_TEMPLATE/` (blank issues are disabled). Every
issue carries a type label (`feature` / `chore` / `fix`) and a status label (`needs-refining` /
`ready` / `in-review`), plus an optional `domain:api` / `domain:web` / `domain:infra`.

## Commits

`<type>: <imperative summary>` (lowercase, no trailing period), type in
`feat` / `fix` / `chore`. Examples:

- `feat: add markdown export for a wish list`
- `fix: keep long item URLs from overflowing the card`
- `chore: bump vite to 7.1`

## Deployment

`deploy.yml` builds and pushes the GHCR images on every push to `main`, but the deployment job
itself only runs on a manual `workflow_dispatch` — see the note in that workflow.
