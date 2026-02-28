# Release Notes

## v0.1.0 (February 28, 2026)

### Release Theme

Initial launch of the RakuFlow project on Starknet.

### Problem We Are Solving

Public blockchain activity is transparent by default. For users, teams, and organizations, this creates privacy risk in normal financial operations.

RakuFlow addresses this by separating public wallet identity from shielded transfer identity, while keeping Starknet security and composability.

### What This First Release Delivers

- Complete privacy-first transfer baseline:
  - Connect wallet
  - Generate shielded identity
  - Deposit into shielded pool
  - Transfer privately between shielded addresses
  - Withdraw back to public addresses
- Starknet technical foundation:
  - Frontend dApp in `WebService/WebUser`
  - Relayer backend in `WebService/API`
  - Cairo contracts in `Blockchain/Contract`
  - Noir circuit in `Blockchain/Circuits/shielded_transfer`
  - Script tests in `Blockchain/test`
- Delivery governance baseline:
  - `VERSION`, `CHANGELOG.md`, `RELEASE_NOTES.md`
  - `docs/BRANCHING_STRATEGY.md`, `docs/RELEASE_PROCESS.md`

### Who This Release Is For

- Users who need better transaction privacy on Starknet
- Teams evaluating shielded transfer architecture
- Contributors and developers building the next project phases

### Current Scope

- Primary working scope is Starknet Sepolia.
- This release is a strong project baseline, not a final production endpoint.

### Release Branch and Tag

- Release branch: `release/v0.1.0`
- Release tag: `v0.1.0`

### Known Limitations

- Mainnet rollout is not part of this initial release.
- Additional optimization and hardening are planned for next iterations.

### Next Priorities

- Mainnet readiness planning
- Performance and reliability improvements
- Deeper relayer and privacy workflow hardening

### Upgrade Notes

For first-time setup and environment requirements, follow `README.md`.
