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

### Breaking changes

A change release-please should bump the **major** version for uses `!` after the type and a
`BREAKING CHANGE:` footer describing exactly what breaks:

```
feat!: remove the legacy /api/v1/wishlists endpoint

BREAKING CHANGE: /api/v1/wishlists is removed, use /api/wishlists instead.
```

Whether an issue is a breaking change is decided during triage (`breaking-change` label + a note
on the issue describing what breaks), not invented at merge time. Since PRs are squash-merged, both
the `!` and the footer must be set explicitly in the squash-merge commit box — GitHub doesn't carry
them over from the PR title/description automatically.

## Releases

[Release Please](https://github.com/googleapis/release-please) watches Conventional Commits on
`main` and keeps a single Release PR up to date with the next version and changelog. Merging that
PR tags the release (`vX.Y.Z`) and publishes a GitHub Release. The tag push then triggers
`.github/workflows/release.yml`, which builds the `api` and `web` images from their own
Dockerfiles, pushes both to GHCR, and signs them keylessly with cosign.

The version is tracked in `.release-please-manifest.json` and `CHANGELOG.md` only — `release-type`
is `simple`, so neither `api/package.json` nor `web/package.json` is bumped. There is no root
workspace to version.

## Deployment

Merging the Release PR tags `vX.Y.Z`, and that tag push builds, signs **and deploys** to
`mediaserver`, serving <https://wishlist.jerco.fr>. See `deploy/README.md`.

`deploy.yml` is the older, unsigned path: it builds and pushes GHCR images tagged by commit SHA on
every push to `main`, while its `deploy` job is gated `if: github.event_name == 'workflow_dispatch'`
and so never runs on a push. It is being replaced by the signed release pipeline above.

## One-time setup

### Release Please token

`release-please.yml` needs a `RELEASE_PLEASE_TOKEN` repo secret — a fine-grained PAT scoped to
this repo with `contents: write`, `pull-requests: write`, and `issues: write`. The default
`GITHUB_TOKEN` can't be used: PRs it opens don't trigger other workflows (CI wouldn't run on the
Release PR).
