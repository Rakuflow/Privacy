# Changelog

All notable changes to this project are documented in this file.

The format is based on Keep a Changelog and uses Semantic Versioning.

## [Unreleased]

### Added
- Reserved for upcoming changes.

## [0.1.0] - 2026-02-27

### Added
- Root-level project documentation (`README.md`) with setup, structure, and environment guidance.
- Branching strategy documentation in `docs/BRANCHING_STRATEGY.md`.
- Release process checklist in `docs/RELEASE_PROCESS.md`.
- `RELEASE_NOTES.md` and root `VERSION` file.
- `Frontend/.env.example` for consistent frontend environment setup.
- Global route barrel file `Frontend/src/routes/index.ts`.

### Changed
- Refactored frontend bootstrap by moving global error-handling setup out of `App.tsx` and into `main.tsx`.
- Updated Vite path aliases to match current `src` structure (`components`, `pages`, `routes`).
- Updated frontend package version from `0.0.1` to `0.1.0`.
- Normalized static asset usage in UI pages/components by importing assets directly instead of hardcoded `/src/...` paths.
- Cleaned footer layout spacing and standardized footer copyright text.
- Refined landing/home copy for clearer professional wording.
- Standardized Starknet provider RPC configuration to read from shared env config.

### Fixed
- Removed stale alias references to deleted `src/app/*` paths.
- Reduced risk of duplicate global error-handling initialization with one-time setup guard.
