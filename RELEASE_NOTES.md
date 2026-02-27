# Release Notes

## v0.1.0 (February 27, 2026)

### Summary

`v0.1.0` establishes a cleaner and more production-ready baseline for the repository:
- frontend structure alignment after refactor
- standardized versioning and release documentation
- formalized branch and release workflow

### Highlights

- **Frontend architecture cleanup**
  - Global side effects moved out of `App.tsx` into startup setup.
  - Route export barrel added at `Frontend/src/routes/index.ts`.
  - Vite alias map updated to current directory layout.

- **UI source quality improvements**
  - Replaced hardcoded `"/src/assets/..."` references in core pages/components with direct imports.
  - Cleaned up footer component structure and copy.

- **Project governance baseline**
  - Added `README.md`, `CHANGELOG.md`, `VERSION`, and `Frontend/.env.example`.
  - Added workflow docs:
    - `docs/BRANCHING_STRATEGY.md`
    - `docs/RELEASE_PROCESS.md`

### Breaking Changes

None.

### Known Issues

- Frontend production bundle is currently large and triggers Vite chunk-size warnings. Functional build remains successful.

### Upgrade Notes

1. Pull latest changes.
2. Ensure `Frontend/.env` includes all values listed in `Frontend/.env.example`.
3. Rebuild frontend:
   ```bash
   cd Frontend
   npm run build
   ```
