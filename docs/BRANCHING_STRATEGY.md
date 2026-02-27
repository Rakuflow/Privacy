# Branching Strategy

This repository follows a lightweight GitFlow model for predictable releases.

## Long-Lived Branches

- `main`: production-ready, tagged releases only
- `develop`: integration branch for upcoming release

## Short-Lived Branches

- `feature/<ticket-or-scope>-<slug>`: new functionality
- `fix/<ticket-or-scope>-<slug>`: bug fixes
- `refactor/<scope>-<slug>`: non-functional code improvements
- `chore/<scope>-<slug>`: tooling/docs/maintenance
- `release/vX.Y.Z`: release hardening branch cut from `develop`
- `hotfix/vX.Y.Z`: urgent production fix cut from `main`

## Merge Rules

1. Create `feature/*`, `fix/*`, `refactor/*`, `chore/*` from `develop`.
2. Merge these branches back into `develop` via pull request.
3. Cut `release/vX.Y.Z` from `develop` when scope is frozen.
4. Merge `release/vX.Y.Z` into `main` after QA sign-off, then back-merge into `develop`.
5. Cut `hotfix/vX.Y.Z` from `main` for urgent production issues, then merge into both `main` and `develop`.

## Pull Request Standards

- Keep PRs focused and small enough to review safely.
- Require at least one reviewer approval.
- Require green CI/build checks before merge.
- Use squash merge for feature/fix/refactor/chore branches.

## Protected Branch Recommendations

- Disallow force-push on `main` and `develop`.
- Disallow direct pushes to `main` and `develop`.
- Require signed tags for releases.
