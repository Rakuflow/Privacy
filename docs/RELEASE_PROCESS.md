# Release Process

This process standardizes releases for frontend, contracts, and docs.

## 1) Plan the Release

1. Confirm scope in `dev`.
2. Pick a target version using Semantic Versioning.
3. Create branch `release/vX.Y.Z` from `dev`.
4. Freeze feature scope on release branch (bugfix/docs only).

## 2) Prepare Release Artifacts

1. Update `VERSION`.
2. Update package version(s) if needed:
   - `WebService/WebUser/package.json`
   - `WebService/API/package.json`
   - `Blockchain/test/package.json`
3. Update `CHANGELOG.md`:
   - move notable items from `Unreleased` to `vX.Y.Z`
4. Update `RELEASE_NOTES.md` with:
   - summary
   - highlights
   - breaking changes (if any)
   - known issues
5. Update root `README.md` release section if release metadata changed.

## 3) Validate

1. Build frontend:
   ```bash
   cd WebService/WebUser
   npm run build
   ```
2. Validate API build:
   ```bash
   cd WebService/API
   npm run build
   ```
3. Run contract validation:
   ```bash
   cd Blockchain/Contract
   scarb build
   scarb test
   ```
4. Validate script-based interactions as needed in `Blockchain/test`.

## 4) Publish

1. Push release branch:
   ```bash
   git checkout release/vX.Y.Z
   git push -u origin release/vX.Y.Z
   ```
2. Merge `release/vX.Y.Z` into `main`.
3. Tag release from `main`:
   ```bash
   git checkout main
   git pull origin main
   git tag -a vX.Y.Z -m "Release vX.Y.Z"
   git push origin vX.Y.Z
   ```
4. Merge `main` back into `dev`.

## 5) Post-Release

1. Create or update `Unreleased` section in `CHANGELOG.md`.
2. Announce release with link to `RELEASE_NOTES.md`.
3. Open follow-up issues for deferred items.

## 6) Example: v0.1.0

```bash
git checkout dev
git pull origin dev
git checkout -b release/v0.1.0

# update VERSION/docs/changelog/release notes, run validation
git add .
git commit -m "release: prepare v0.1.0"
git push -u origin release/v0.1.0

# after PR merged to main
git checkout main
git pull origin main
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```
