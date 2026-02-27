# RakuFlow ZK Starknet

Private value transfer infrastructure on Starknet, built around a shielded pool + zero-knowledge proofs.

<p align="center">
  <img src="Frontend/src/assets/RakuShield.png" width="320" alt="RakuShield logo" />
</p>

<p align="center">
  <strong>RakuShield</strong><br/>
  Privacy-First Transfers on Starknet
</p>


Current release: `0.1.0` (February 27, 2026)

## 1) Why this project exists

Public blockchains are transparent by default. For normal users, DAOs, and teams, that means:
- wallet-to-wallet transfer history is easy to trace.
- balance and treasury movement are publicly linkable.
- operational privacy is weak for sensitive payments.

RakuFlow solves this by separating **public wallet identity** from **shielded transfer identity**, while still using Starknet security guarantees.

## 2) What RakuFlow does

RakuFlow provides a privacy-first transfer flow:
- deposit tokens from a public address into a shielded pool
- represent value as commitments and notes
- transfer privately between shielded addresses
- withdraw back to a public address when needed

Core result:
- observers can see on-chain state transitions
- observers cannot directly link sender/receiver identity inside the shielded flow

## 3) Product overview (for non-dev and stakeholders)

### Key capabilities
- private transfer UX in a web app
- wallet integration (Starknet wallets)
- relayer-aware transfer flow
- shielded note lifecycle management
- deposit / transfer / withdraw transaction history views

### Typical user journey
1. Connect Starknet wallet.
2. Generate deterministic zk-keypair (shielded identity).
3. Deposit STRK/token into shielded pool.
4. Transfer privately to another shielded address.
5. Withdraw from shielded state back to public address.

### Scope status
- Focused on Starknet Sepolia for current development/release cycle.
- Structured for iterative production hardening.

## 4) Technical architecture (for developers)

### High-level design
- **Frontend (`Frontend/`)**: React + Vite dApp UI and client-side orchestration.
- **Contracts (`Packages/Contract/`)**: Cairo contracts for shielded pool logic.
- **Circuits (`Packages/Circuits/`)**: Noir circuits/proof-related artifacts.
- **Scripts (`Packages/test/`)**: operational/integration scripts for contract interaction.

### System and flow diagrams

System architecture:

![System Design](Frontend/src/assets/SystemDesign.jpg)

Transaction flow:

![Transaction Flow](Frontend/src/assets/TransactionFlow.jpg)

## 5) Repository structure

| Path | Purpose |
| --- | --- |
| `Frontend/` | React + Vite dApp (UI, routing, wallet, services, hooks) |
| `Packages/Contract/` | Cairo contract code, Scarb config, deployment/test tooling |
| `Packages/Circuits/` | Noir circuit package(s) and proving inputs |
| `Packages/test/` | Node scripts for local/sepolia interaction |
| `docs/` | Engineering process docs (branching + release) |
| `CHANGELOG.md` | Machine-readable release history |
| `RELEASE_NOTES.md` | Human-readable release summary |
| `VERSION` | Project release version source of truth |

## 6) Getting started

### Prerequisites
- Node.js 20+
- npm 10+
- Scarb
- Starknet Foundry (`snforge`, `sncast`) for contract testing/deploy
- Noir toolchain (`nargo`) for circuit workflows

### Frontend setup

```bash
cd Frontend
npm ci
```

Create environment file:

- PowerShell:
```powershell
Copy-Item .env.example .env
```

- Bash:
```bash
cp .env.example .env
```

Run dev server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

### Contract package

```bash
cd Packages/Contract
scarb build
scarb test
```

If `snforge` is not installed, `scarb test` will fail until Starknet Foundry is available in your environment.

## 7) Environment variables (Frontend)

Set in `Frontend/.env`:

| Variable | Description |
| --- | --- |
| `VITE_RPC_SEPOLIA` | Starknet Sepolia RPC URL |
| `VITE_RPC_MAINNET` | Starknet Mainnet RPC URL |
| `VITE_CHAIN_ID_SEPOLIA` | Sepolia chain id (`SN_SEPOLIA`) |
| `VITE_CHAIN_ID_MAINNET` | Mainnet chain id (`SN_MAIN`) |
| `VITE_SHIELDED_POOL` | Shielded pool contract address |
| `VITE_GARAGA_VERIFIER` | Verifier contract address |
| `VITE_STRK_TOKEN` | Token contract address |
| `VITE_RELAYER_URL` | Relayer API base URL |

Reference template: `Frontend/.env.example`.

## 8) Security and operational notes

- Never commit real secrets or private keys.
- Treat integration scripts in `Packages/test/` as operational scripts, not end-user commands.
- Validate network, contract addresses, and account contexts before running write transactions.

## 9) Branching, release, and versioning

- Branching model: `docs/BRANCHING_STRATEGY.md`
- Release checklist/process: `docs/RELEASE_PROCESS.md`
- Versioning standard: Semantic Versioning (`MAJOR.MINOR.PATCH`)
- Release history: `CHANGELOG.md`
- Public release summary: `RELEASE_NOTES.md`

## 10) Release 0.1.0 summary

`v0.1.0` establishes a production-oriented baseline:
- frontend structure cleanup and route/bootstrap normalization
- standardized release/documentation artifacts
- formalized branching/release workflow for team execution
