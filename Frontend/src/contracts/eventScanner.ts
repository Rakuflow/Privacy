/**
 * Event Scanner for ShieldedPool Contract
 * Scans DepositEvent and TransferEvent to find commitments on-chain
 */

import { Provider, Contract, hash } from "starknet";
import { CONTRACTS, NETWORK } from "./config";
import shieldedPoolAbi from "./abis/shieldedPool.json";
import type {
  DepositEventData,
  TransferEventData,
  WithdrawEventData,
} from "../types/EventScanner.type";

/**
 * Scan DepositEvent from contract
 */
export async function scanDepositEvents(
  fromBlock: number = 0,
  toBlock: number | "latest" = "latest"
): Promise<DepositEventData[]> {
  try {
    const provider = new Provider({ nodeUrl: NETWORK.RPC_URL });
    const contract = new Contract(shieldedPoolAbi, CONTRACTS.SHIELDED_POOL, provider);

    console.log("📡 Scanning DepositEvent from block", fromBlock, "to", toBlock);

    // Get events using getEvents
    const events = await provider.getEvents({
      address: CONTRACTS.SHIELDED_POOL,
      from_block: { block_number: fromBlock },
      to_block: toBlock === "latest" ? "latest" : { block_number: toBlock },
      keys: [
        [hash.getSelectorFromName("DepositEvent")], // event selector
      ],
      chunk_size: 1000,
    });

    const depositEvents: DepositEventData[] = [];

    for (const event of events.events) {
      try {
        // Event structure from contract:
        // #[key] commitment: felt252
        // #[key] leaf_index: u256
        // #[data] amount: u256
        
        // keys[0] = event selector
        // keys[1] = commitment
        // keys[2] = leaf_index.low
        // keys[3] = leaf_index.high
        // data[0] = amount.low
        // data[1] = amount.high

        if (event.keys.length >= 4 && event.data.length >= 2) {
          const commitment = event.keys[1];
          const leafIndexLow = BigInt(event.keys[2]);
          const leafIndexHigh = BigInt(event.keys[3]);
          const leafIndex = (leafIndexHigh << 128n) | leafIndexLow;
          
          const amountLow = BigInt(event.data[0]);
          const amountHigh = BigInt(event.data[1]);
          const amount = (amountHigh << 128n) | amountLow;

          depositEvents.push({
            commitment,
            leaf_index: leafIndex.toString(),
            amount: amount.toString(),
            blockNumber: event.block_number || 0,
            transactionHash: event.transaction_hash || "",
          });
        }
      } catch (error) {
        console.warn("Failed to parse DepositEvent:", error);
      }
    }

    console.log(`✅ Found ${depositEvents.length} DepositEvents`);
    return depositEvents;
  } catch (error) {
    console.error("Error scanning DepositEvents:", error);
    return [];
  }
}

/**
 * Scan TransferEvent from contract
 */
export async function scanTransferEvents(
  fromBlock: number = 0,
  toBlock: number | "latest" = "latest"
): Promise<TransferEventData[]> {
  try {
    const provider = new Provider({ nodeUrl: NETWORK.RPC_URL });

    console.log("📡 Scanning TransferEvent from block", fromBlock, "to", toBlock);

    const events = await provider.getEvents({
      address: CONTRACTS.SHIELDED_POOL,
      from_block: { block_number: fromBlock },
      to_block: toBlock === "latest" ? "latest" : { block_number: toBlock },
      keys: [
        [hash.getSelectorFromName("TransferEvent")],
      ],
      chunk_size: 1000,
    });

    const transferEvents: TransferEventData[] = [];

    for (const event of events.events) {
      try {
        // Event structure:
        // #[key] nullifier_hash: felt252
        // #[key] commitment_out: felt252
        
        // keys[0] = event selector
        // keys[1] = nullifier_hash
        // keys[2] = commitment_out

        if (event.keys.length >= 3) {
          const nullifier_hash = event.keys[1];
          const commitment_out = event.keys[2];

          transferEvents.push({
            nullifier_hash,
            commitment_out,
            blockNumber: event.block_number || 0,
            transactionHash: event.transaction_hash || "",
          });
        }
      } catch (error) {
        console.warn("Failed to parse TransferEvent:", error);
      }
    }

    console.log(`✅ Found ${transferEvents.length} TransferEvents`);
    return transferEvents;
  } catch (error) {
    console.error("Error scanning TransferEvents:", error);
    return [];
  }
}

/**
 * Scan WithdrawEvent from contract
 */
export async function scanWithdrawEvents(
  fromBlock: number = 0,
  toBlock: number | "latest" = "latest"
): Promise<WithdrawEventData[]> {
  try {
    const provider = new Provider({ nodeUrl: NETWORK.RPC_URL });

    console.log("📡 Scanning WithdrawEvent from block", fromBlock, "to", toBlock);

    const events = await provider.getEvents({
      address: CONTRACTS.SHIELDED_POOL,
      from_block: { block_number: fromBlock },
      to_block: toBlock === "latest" ? "latest" : { block_number: toBlock },
      keys: [
        [hash.getSelectorFromName("WithdrawEvent")],
      ],
      chunk_size: 1000,
    });

    const withdrawEvents: WithdrawEventData[] = [];

    for (const event of events.events) {
      try {
        // Event structure:
        // #[key] nullifier_hash: felt252
        // #[key] recipient: ContractAddress
        // #[data] amount: u256
        
        // keys[0] = event selector
        // keys[1] = nullifier_hash
        // keys[2] = recipient
        // data[0] = amount.low
        // data[1] = amount.high

        if (event.keys.length >= 3 && event.data.length >= 2) {
          const nullifier_hash = event.keys[1];
          const recipient = event.keys[2];
          
          const amountLow = BigInt(event.data[0]);
          const amountHigh = BigInt(event.data[1]);
          const amount = (amountHigh << 128n) | amountLow;

          withdrawEvents.push({
            nullifier_hash,
            recipient,
            amount: amount.toString(),
            blockNumber: event.block_number || 0,
            transactionHash: event.transaction_hash || "",
          });
        }
      } catch (error) {
        console.warn("Failed to parse WithdrawEvent:", error);
      }
    }

    console.log(`✅ Found ${withdrawEvents.length} WithdrawEvents`);
    return withdrawEvents;
  } catch (error) {
    console.error("Error scanning WithdrawEvents:", error);
    return [];
  }
}

/**
 * Get all commitments on-chain with their leaf indices
 * Combines DepositEvent and TransferEvent
 */
export async function getAllCommitmentsOnChain(
  fromBlock: number = 0
): Promise<Map<string, string>> {
  const [deposits, transfers] = await Promise.all([
    scanDepositEvents(fromBlock),
    scanTransferEvents(fromBlock),
  ]);

  // Map: commitment -> leaf_index
  const commitmentMap = new Map<string, string>();

  // Add deposits (have explicit leaf_index)
  for (const deposit of deposits) {
    commitmentMap.set(deposit.commitment, deposit.leaf_index);
  }

  // For transfers, we need to compute leaf_index
  // TransferEvent creates new commitment at next available index
  // We need to count all commitments (deposits + transfers before this one)
  
  // Sort all events by block number and transaction order
  const allEvents = [
    ...deposits.map(d => ({ type: "deposit" as const, commitment: d.commitment, block: d.blockNumber, tx: d.transactionHash })),
    ...transfers.map(t => ({ type: "transfer" as const, commitment: t.commitment_out, block: t.blockNumber, tx: t.transactionHash })),
  ].sort((a, b) => {
    if (a.block !== b.block) return a.block - b.block;
    return a.tx.localeCompare(b.tx);
  });

  // Recompute leaf indices
  let currentIndex = 0;
  for (const event of allEvents) {
    commitmentMap.set(event.commitment, currentIndex.toString());
    currentIndex++;
  }

  console.log(`📊 Total commitments on-chain: ${commitmentMap.size}`);
  return commitmentMap;
}

/**
 * Get spent nullifiers from WithdrawEvent and TransferEvent
 */
export async function getSpentNullifiers(
  fromBlock: number = 0
): Promise<Set<string>> {
  const [withdraws, transfers] = await Promise.all([
    scanWithdrawEvents(fromBlock),
    scanTransferEvents(fromBlock),
  ]);

  const spentNullifiers = new Set<string>();

  // Add nullifiers from withdrawals
  for (const withdraw of withdraws) {
    spentNullifiers.add(withdraw.nullifier_hash);
  }

  // Add nullifiers from transfers
  for (const transfer of transfers) {
    spentNullifiers.add(transfer.nullifier_hash);
  }

  console.log(`📊 Total spent nullifiers: ${spentNullifiers.size}`);
  return spentNullifiers;
}
