# Branching Strategy

This repository follows a lightweight GitFlow model for predictable releases.

## Long-Lived Branches

- `main`: production-ready, tagged releases only
- `dev`: integration branch for upcoming release

## Short-Lived Branches

- `feature/<ticket-or-scope>-<slug>`: new functionality
- `fix/<ticket-or-scope>-<slug>`: bug fixes
- `refactor/<scope>-<slug>`: non-functional code improvements
- `chore/<scope>-<slug>`: tooling/docs/maintenance
- `release/vX.Y.Z`: release hardening branch cut from `dev`
- `hotfix/vX.Y.Z`: urgent production fix cut from `main`

## Merge Rules

1. Create `feature/*`, `fix/*`, `refactor/*`, `chore/*` from `dev`.
2. Merge these branches back into `dev` via pull request.
3. Cut `release/vX.Y.Z` from `dev` when scope is frozen.
4. Merge `release/vX.Y.Z` into `main` after QA sign-off, create tag `vX.Y.Z` on `main`, then back-merge into `dev`.
5. Cut `hotfix/vX.Y.Z` from `main` for urgent production issues, then merge into both `main` and `dev`.

## Release Branch Quick Commands

```bash
git checkout dev
git pull origin dev
git checkout -b release/vX.Y.Z
git push -u origin release/vX.Y.Z
```

After release merge to `main`:

```bash
git checkout main
git pull origin main
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin vX.Y.Z
```

## Pull Request Standards

- Keep PRs focused and small enough to review safely.
- Require at least one reviewer approval.
- Require green CI/build checks before merge.
- Use squash merge for feature/fix/refactor/chore branches.

## Protected Branch Recommendations

- Disallow force-push on `main` and `dev`.
- Disallow direct pushes to `main` and `dev`.
- Require signed tags for releases.
