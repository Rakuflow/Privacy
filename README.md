# RakuFlow ZK Starknet

Privacy-first transfer system on Starknet using a shielded pool model and zero-knowledge tooling.

Current release: `0.1.0` (February 27, 2026).

## Repository Layout

| Path | Purpose |
| --- | --- |
| `Frontend/` | React + Vite application for wallet, deposit, transfer, withdraw flows |
| `Packages/Contract/` | Cairo smart contracts (Scarb + Starknet Foundry) |
| `Packages/Circuits/` | Noir circuits and proving inputs |
| `Packages/test/` | Node scripts for integration/deposit testing |
| `docs/` | Branching strategy and release process |
| `CHANGELOG.md` | Keep-a-Changelog style change history |
| `RELEASE_NOTES.md` | Human-readable release summaries |
| `VERSION` | Project release version source of truth |

## Prerequisites

- Node.js 20+
- npm 10+
- Scarb + Starknet Foundry (`scarb`, `snforge`, `sncast`) for contract work
- Noir toolchain (`nargo`) for circuit work

## Quick Start

### 1) Frontend

```bash
cd Frontend
npm ci
cp .env.example .env
npm run dev
```

Production build:

```bash
cd Frontend
npm run build
```

### 2) Contracts

```bash
cd Packages/Contract
scarb build
scarb test
```

## Frontend Environment Variables

Create `Frontend/.env` from `Frontend/.env.example`.

| Variable | Description |
| --- | --- |
| `VITE_RPC_SEPOLIA` | RPC endpoint for Starknet Sepolia |
| `VITE_RPC_MAINNET` | RPC endpoint for Starknet Mainnet |
| `VITE_CHAIN_ID_SEPOLIA` | Chain ID for Sepolia (`SN_SEPOLIA`) |
| `VITE_CHAIN_ID_MAINNET` | Chain ID for Mainnet (`SN_MAIN`) |
| `VITE_SHIELDED_POOL` | Deployed ShieldedPool contract address |
| `VITE_GARAGA_VERIFIER` | Deployed verifier contract address |
| `VITE_STRK_TOKEN` | STRK token contract address |
| `VITE_RELAYER_URL` | Relayer API base URL |

## Branching and Release

- Branch model: see `docs/BRANCHING_STRATEGY.md`
- Release checklist: see `docs/RELEASE_PROCESS.md`
- Versioning: Semantic Versioning (`MAJOR.MINOR.PATCH`)
- Release history: `CHANGELOG.md`
- Public release summary: `RELEASE_NOTES.md`

## Security Notes

- Do not commit real secrets in `.env` files.
- Rotate keys immediately if a private key or RPC credential is exposed.
- Treat `Packages/test/` scripts as operational tooling and validate addresses before execution.
