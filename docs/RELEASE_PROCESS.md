# Release Process

This process standardizes releases for frontend, contracts, and docs.

## 1) Plan the Release

1. Confirm scope in `develop`.
2. Pick a target version using Semantic Versioning.
3. Create branch `release/vX.Y.Z` from `develop`.

## 2) Prepare Release Artifacts

1. Update `VERSION`.
2. Update package version(s), currently `Frontend/package.json`.
3. Update `CHANGELOG.md`:
   - move notable items from `Unreleased` to `vX.Y.Z`
4. Update `RELEASE_NOTES.md` with:
   - summary
   - highlights
   - breaking changes (if any)
   - known issues

## 3) Validate

1. Build frontend:
   ```bash
   cd Frontend
   npm run build
   ```
2. Run contract validation:
   ```bash
   cd Packages/Contract
   scarb build
   scarb test
   ```
3. Validate deploy/test scripts as needed in `Packages/test`.

## 4) Publish

1. Merge `release/vX.Y.Z` into `main`.
2. Tag release:
   ```bash
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```
3. Merge `main` back into `develop`.

## 5) Post-Release

1. Create or update `Unreleased` section in `CHANGELOG.md`.
2. Announce release with link to `RELEASE_NOTES.md`.
3. Open follow-up issues for deferred items.
