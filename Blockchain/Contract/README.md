# Contract Package

## Prerequisites

- `scarb`
- `snforge`
- `sncast`
- optional: `jq` (for ABI extraction)

## Development Commands

```bash
scarb fmt
scarb build
scarb clean
```

Run tests:

```bash
scarb test
```

## ABI Extraction

```bash
jq '.abi' target/dev/contract_<contract_name>.contract_class.json > <contract_name>.abi.json
```

## Declare (Sepolia)

```bash
sncast declare --contract-name <contract_name> --network sepolia
```

## Deploy (Sepolia)

```bash
sncast \
  --accounts-file ~/.starknet_accounts/starknet_accounts.json \
  --account my_account \
  deploy \
  --class-hash <class_hash> \
  --arguments <constructor_args> \
  --network sepolia
```

## Verifier Setup (Noir/Garaga)

`GaragaVerifier` is now an adapter contract. It does not validate proofs by length anymore.

Detailed generation guide:
- `../Circuits/README.md`

- Constructor args:
  - `transfer_backend`: contract address of the Noir transfer verifier backend
  - `withdraw_backend`: contract address of the Noir withdraw verifier backend
- Runtime checks:
  - `verify_shielded_transfer` expects `public_inputs.len() == 3`
  - `verify_withdraw` expects `public_inputs.len() == 5`
  - both methods forward `proof` as `full_proof_with_hints` to backend verifier contracts
  - both methods compare backend returned public inputs with `public_inputs` passed by caller

### Backend Packages Already In Repo

Generated verifier packages are expected here:

- `src/zk_verifier/verifier_transfer`
- `src/zk_verifier/verifier_withdraw`

Each package exposes contract entrypoint:

- `verify_ultra_keccak_zk_honk_proof(full_proof_with_hints: Span<felt252>) -> Result<Span<u256>, felt252>`

### Deployment Order (Production)

1. Build and deploy transfer backend verifier contract from:
   - `src/zk_verifier/verifier_transfer`
2. Build and deploy withdraw backend verifier contract from:
   - `src/zk_verifier/verifier_withdraw`
3. Deploy `GaragaVerifier` with constructor args:
   - `transfer_backend=<transfer_backend_address>`
   - `withdraw_backend=<withdraw_backend_address>`
4. Deploy `ShieldedPool` with constructor args:
   - `verifier=<garaga_verifier_address>`
   - `initial_token=<erc20_token_address>`
   - `initial_token_decimals=<u8>`

Recommended deployment order:

1. Deploy transfer circuit verifier backend (generated from Noir/`bb`/Garaga pipeline).
2. Deploy withdraw circuit verifier backend.
3. Deploy `GaragaVerifier` with those two backend addresses.
4. Deploy `ShieldedPool` and pass verifier + initial supported token config.
