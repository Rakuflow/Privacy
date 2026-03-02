# Noir Circuit Verifier Backend Guide

This document explains how to generate production verifier backends for the two Noir circuits used in RakuShield:
- `shielded_transfer`
- `shielded_withdraw`

Goals:
- Do not hand-write `honk_verifier*.cairo` files.
- Generate verifiers from the `nargo -> bb -> garaga` pipeline so each backend matches the correct proof system and verification key.

## 1. Recommended Toolchain

- `nargo`: use the same version that compiles your circuits (this repository is currently aligned with `1.0.0-beta.18`).
- `bb`: must match your `nargo` version through `bbup`.
- `garaga`: use a recent stable release (`pip install garaga` or the official installation method).

Quick version checks:

```bash
nargo --version
bb --version
garaga --version
```

Sync `bb` with `nargo` (required):

```bash
bbup -nv 1.0.0-beta.18
```

## 2. Required Outputs Per Circuit

Each circuit should produce:
- `target/<circuit>.json` (compiled bytecode)
- `target/vk` (verification key)
- `target/proof` (proof, required for runtime testing)
- `target/public_inputs` (public inputs, required for runtime testing)
- a generated Cairo verifier package from `garaga gen`

Important:
- A verifier package must be generated from that circuit's own `target/vk`.
- Never reuse one verifier package for both `shielded_transfer` and `shielded_withdraw`.

## 3. Generate Artifacts for `shielded_transfer`

From the repository root:

```bash
cd Blockchain/Circuits/shielded_transfer

# 1) Compile the circuit
nargo compile

# 2) Generate verification key
bb write_vk -b ./target/shielded_transfer.json -o ./target --oracle_hash keccak

# 3) Generate Cairo verifier backend package
garaga gen --system ultra_keccak_zk_honk --vk target/vk
```

Optional proof generation test:

```bash
# Prover.toml must contain a valid witness for private inputs.
nargo execute shielded_transfer
bb prove -b ./target/shielded_transfer.json -w ./target/shielded_transfer.gz -o ./target --oracle_hash keccak
garaga calldata --system ultra_keccak_honk --proof target/proof --vk target/vk
```

## 4. Generate Artifacts for `shielded_withdraw`

From the repository root:

```bash
cd Blockchain/Circuits/shielded_withdraw

# 1) Compile the circuit
nargo compile

# 2) Generate verification key
bb write_vk -b ./target/shielded_withdraw.json -o ./target --oracle_hash keccak

# 3) Generate Cairo verifier backend package
garaga gen --system ultra_keccak_zk_honk --vk target/vk
```

Optional proof generation test:

```bash
# Prover.toml must contain a valid witness for private inputs.
nargo execute shielded_withdraw
bb prove -b ./target/shielded_withdraw.json -w ./target/shielded_withdraw.gz -o ./target --oracle_hash keccak
garaga calldata --system ultra_keccak_honk --proof target/proof --vk target/vk
```

## 5. Verifier Package Locations in This Repository

Keep generated verifier backends under:

```text
Blockchain/Circuits/zk_verifier/verifier_transfer/
Blockchain/Circuits/zk_verifier/verifier_withdraw/
```

Typical generated files include:
- `honk_verifier.cairo`
- `honk_verifier_circuits.cairo`
- `honk_verifier_constants.cairo`
- `lib.cairo`
- `Scarb.toml`

## 6. Contract Integration and Deployment Flow

If your deployment flow uses `Blockchain/Contract`, ensure the generated backend packages are copied or mirrored into the contract structure expected by that package (see `Blockchain/Contract/README.md`).

Recommended deployment order:
1. Declare/deploy the `shielded_transfer` verifier backend.
2. Declare/deploy the `shielded_withdraw` verifier backend.
3. Deploy `GaragaVerifier` with:
   - `transfer_backend`
   - `withdraw_backend`
4. Deploy `ShieldedPool` pointing to `GaragaVerifier`.

## 7. Common Mistakes

- Running `nargo execute shielded_transfer` inside the `shielded_withdraw` directory (or the reverse).
- Using the wrong `.json` or `.gz` file in `bb prove`.
- Generating a verifier package from the wrong `target/vk`.
- Using mismatched `nargo` and `bb` versions.
