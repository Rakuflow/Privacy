# RakuShield Relayer Backend

RakuShield Relayer Backend is an Express + TypeScript service that relays private Starknet transactions and stores off-chain note/history data for clients.

This repository is the backend component of the system.

## System overview

RakuShield is composed of:

1. Frontend client (user wallet + UI)
2. This relayer backend API
3. Starknet Shielded Pool contract
4. MongoDB for note/history persistence

High-level flow:

1. Client asks relayer for fee quote (`POST /api/estimate-fee`)
2. Client signs relay intent and sends request (`POST /api/relay`)
3. Relayer validates request, relays tx, and returns tx hash
4. Client stores/reads note and history via API (`/api/notes`, `/api/history`)

## Tech stack

- Node.js
- TypeScript (ESM)
- Express
- Mongoose (MongoDB)
- starknet.js
- Swagger UI (OpenAPI)
- Pino structured logger

## Project structure

```text
src/
  abis/                 # Contract ABI
  config/               # Env/default config + DB connection + logger
  controllers/          # Route handlers
  docs/                 # OpenAPI spec + Swagger setup
  middleware/           # Validation, rate limit, request/error logging
  models/               # Starknet client + Mongo models
  routes/               # /health and /api routes
  utils/                # Fee estimator + signature utilities
  server.ts             # App bootstrap
scripts/
  generate-wallet.mjs   # Generate Starknet relayer key
```

## Prerequisites

- Node.js 20+ (recommended)
- npm 10+ (recommended)
- MongoDB Atlas or local MongoDB
- Starknet RPC endpoint
- Deployed Starknet account for relayer

## Installation

```bash
npm install
```

## Environment variables

Create `.env` in repository root:

```env
PORT=3001
LOG_LEVEL=info

RELAYER_PRIVATE_KEY=0x...
RELAYER_ADDRESS=0x...
RELAYER_CAIRO_VERSION=1
RELAYER_TX_MAX_FEE_WEI=100000000000000000

SHIELDED_POOL_CONTRACT=0x...
RPC_URL=https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/...

MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=Cluster0
MONGO_DB_NAME=test_net
```

Notes:

- `MONGO_DB_NAME` defaults to `test_net` if not set.
- `LOG_LEVEL` defaults to `debug` in non-production and `info` in production.
- If your Mongo URI has no database path, the service still uses `MONGO_DB_NAME`.
- Required env keys validated at startup:
  - `RELAYER_PRIVATE_KEY`
  - `RELAYER_ADDRESS`
  - `SHIELDED_POOL_CONTRACT`
  - `MONGO_URI`

## Run

Development:

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

Quick checks:

```bash
curl http://localhost:3001/health
curl http://localhost:3001/openapi.json
```

Swagger UI:

- `http://localhost:3001/docs`

## Logging standard

- Structured JSON logs powered by Pino.
- Request/response logs include:
  - `requestId`
  - `method`
  - `path`
  - `statusCode`
  - `durationMs`
- Each response returns `X-Request-Id` header for traceability.
- Sensitive fields are redacted by logger configuration.

## API reference

Base URL: `http://localhost:3001`

### 1) Health

- `GET /health`

Response:

```json
{
  "status": "ok",
  "relayerAddress": "0x...",
  "balance": "0x...",
  "version": "2.0.0",
  "uptime": 12345
}
```

### 2) Estimate fee

- `POST /api/estimate-fee`

Request:

```json
{
  "type": "transfer",
  "proof": ["0x1", "0x2", "0x3"],
  "publicInputs": ["0x1", "0x2", "0x3", "0x4"],
  "feeToken": "STRK"
}
```

Rules:

- `proof.length` must be `3`
- `publicInputs.length` must be:
  - `4` for `transfer`
  - `5` for `withdraw`

### 3) Relay transaction

- `POST /api/relay`

Request:

```json
{
  "quoteId": "uuid-optional",
  "intent": {
    "type": "withdraw",
    "proof": ["0x1", "0x2", "0x3"],
    "publicInputs": ["0x1", "0x2", "0x3", "0x4", "0x5"],
    "recipient": "0xabc...",
    "userAddress": "0xuser...",
    "timestamp": 1730000000000,
    "nonce": "0x123",
    "signature": ["0xr", "0xs"],
    "feeToken": "STRK",
    "maxFeeAmount": "1000000000000000"
  }
}
```

### 4) Notes

- `GET /api/notes/:zkAddress` -> get unspent notes
- `POST /api/notes` -> save note
- `POST /api/notes/mark-spent` -> mark note spent

### 5) History

- `GET /api/history/:zkAddress` -> get history by zkAddress
- `POST /api/history` -> save history entry

## Database

Configured in `src/config/database.ts`:

- Connects via `MONGO_URI`
- Forces database name with `MONGO_DB_NAME` (default `test_net`)

Collections:

- `notes`
- `histories`

Indexes:

- `notes`: `{ commitment: unique }`, `{ zkAddress: 1, isSpent: 1 }`
- `histories`: `{ zkAddress: 1, timestamp: -1 }`

## Rate limits

Rate limit window: `60s` (from `src/config/default.json`)

- Heavy APIs (`/api/estimate-fee`, `/api/relay`): max `10` req/window
- Write APIs (`POST /api/notes`, `POST /api/history`, ...): max `60` req/window
- Read APIs (`GET /api/notes/:zkAddress`, `GET /api/history/:zkAddress`): max `180` req/window

## Utility scripts

- `npm run generate-wallet`: generate a Starknet private key/public key and scaffold `.env`.
- `start-dev.sh` / `start-dev.bat`: quick start helpers.
- `test-health.sh`: quick health endpoint check.

## Current limitations (important)

Current code is suitable for dev/integration testing, but has production gaps:

1. Signature verification is currently format + timestamp checks; not full on-chain account signature verification.
2. Nonce replay protection is in-memory only and resets on server restart.
3. Fee quote cache is in-memory only and not shared across instances.
4. Fee collection currently runs in mock mode (`collectFeeFromUser` returns mock tx hash).
5. Some fee config values in `default.json` are not yet wired into `feeEstimator.ts` constants.

## Production hardening checklist

1. Implement real token transfer and settlement for fee collection.
2. Persist nonce and fee quote state in Redis or database.
3. Add robust signature verification via Starknet account contract validation.
4. Add authentication/authorization policy for write endpoints.
5. Add test suite (unit + integration + e2e).
6. Add CI checks for lint, typecheck, tests.

## License

MIT
