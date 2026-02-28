# RakuShield WebUser

Frontend dApp for privacy-first transfers on Starknet.

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

```bash
cd WebService/WebUser
npm ci
```

Create `.env` from template:

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

## Run

Development:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

## Environment Variables

`WebService/WebUser/.env` requires:

- `VITE_RPC_SEPOLIA`
- `VITE_RPC_MAINNET`
- `VITE_CHAIN_ID_SEPOLIA`
- `VITE_CHAIN_ID_MAINNET`
- `VITE_SHIELDED_POOL`
- `VITE_GARAGA_VERIFIER`
- `VITE_STRK_TOKEN`
- `VITE_RELAYER_URL`

Default template values are provided in `.env.example` and should be replaced for real deployments.
