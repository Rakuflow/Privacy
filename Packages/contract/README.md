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
