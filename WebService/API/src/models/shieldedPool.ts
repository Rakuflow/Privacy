import { Contract, CallData } from "starknet";
import { provider, relayerAccount, getRelayerNonceLatest } from "./starknet";
import { RAKU_SHIELD_ABI } from "../abis/RakuShield.js";
import { config } from "../config/index.js";

// Get shielded pool contract instance
export function getShieldedPoolContract() {
  return new Contract({
    abi: RAKU_SHIELD_ABI as any,
    address: config.SHIELDED_POOL_CONTRACT,
    providerOrAccount: relayerAccount,
  });
}

// Execute shielded transfer
export async function executeShieldedTransfer(
  proof: string[],
  publicInputs: string[],
  _maxFee?: string,
) {
  const nonce = await getRelayerNonceLatest();
  return relayerAccount.execute(
    {
      contractAddress: config.SHIELDED_POOL_CONTRACT,
      entrypoint: "shielded_transfer",
      calldata: CallData.compile([proof, publicInputs]),
    },
    {
      nonce,
      blockIdentifier: "latest",
    },
  );
}

// Execute withdraw
export async function executeWithdraw(
  proof: string[],
  publicInputs: string[],
  recipient: string,
  _maxFee?: string,
) {
  const nonce = await getRelayerNonceLatest();
  return relayerAccount.execute(
    {
      contractAddress: config.SHIELDED_POOL_CONTRACT,
      entrypoint: "withdraw",
      calldata: CallData.compile([proof, publicInputs, recipient]),
    },
    {
      nonce,
      blockIdentifier: "latest",
    },
  );
}
