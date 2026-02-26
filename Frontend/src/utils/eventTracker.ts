/**
 * Event Tracker - Track on-chain events and update local notes
 * 
 * This helps sync leafIndex from DepositEvent to local notes,
 * which is needed for generating Merkle proofs during withdrawal
 */

import { getNotes, saveNote } from "./noteStorage";
import type { DepositEventData } from "../types/EventTracker.type";

/**
 * Update note with leafIndex from DepositEvent
 * 
 * When a deposit is confirmed on-chain, the contract emits:
 * event DepositEvent(commitment, leaf_index, amount)
 * 
 * We need to capture the leaf_index and store it with the note
 * for future withdrawal proof generation
 */
export async function updateNoteWithLeafIndex(
  zkAddress: string,
  commitment: string,
  leafIndex: string
): Promise<boolean> {
  try {
    const notes = await getNotes(zkAddress);
    
    // Find note by commitment
    const note = notes.find(n => n.commitment === commitment);
    
    if (!note) {
      console.warn("Note not found for commitment:", commitment);
      return false;
    }
    
    // Save updated note with leafIndex
    await saveNote(zkAddress, {
      ...note,
      leafIndex,
    });
    
    console.log("✓ Note updated with leafIndex:", {
      commitment: commitment.slice(0, 20) + "...",
      leafIndex,
    });
    
    return true;
  } catch (error) {
    console.error("Failed to update note with leafIndex:", error);
    return false;
  }
}

/**
 * Track deposit event and update note
 * 
 * Usage after deposit transaction confirmed:
 * ```typescript
 * const receipt = await provider.waitForTransaction(txHash);
 * const event = parseDepositEvent(receipt.events);
 * if (event) {
 *   trackDepositEvent(walletAddress, event);
 * }
 * ```
 */
export function trackDepositEvent(
  walletAddress: string,
  event: DepositEventData
): void {
  console.log("📊 Tracking deposit event:", {
    commitment: event.commitment.slice(0, 20) + "...",
    leafIndex: event.leafIndex,
    amount: event.amount.toString(),
  });
  
  // Update note with leafIndex
  updateNoteWithLeafIndex(
    walletAddress,
    event.commitment,
    event.leafIndex
  );
}

/**
 * Parse DepositEvent from transaction receipt
 * 
 * Starknet event structure:
 * {
 *   from_address: contract_address,
 *   keys: [event_name_hash, ...key_params],
 *   data: [...data_params]
 * }
 * 
 * DepositEvent:
 * - keys: [event_hash, commitment, leaf_index]
 * - data: [amount.low, amount.high]
 */
export function parseDepositEvent(events: any[]): DepositEventData | null {
  // Find DepositEvent (event name hash would be specific)
  // For now, we assume first event is DepositEvent
  // In production, check event.keys[0] === depositEventHash
  
  if (!events || events.length === 0) {
    return null;
  }
  
  const event = events[0]; // Simplified - should filter by event type
  
  try {
    // Extract from event structure
    const commitment = event.keys?.[1];
    const leafIndex = event.keys?.[2];
    
    // Reconstruct u256 amount from low/high
    const amountLow = BigInt(event.data?.[0] || 0);
    const amountHigh = BigInt(event.data?.[1] || 0);
    const amount = amountLow + (amountHigh << 128n);
    
    if (!commitment || !leafIndex) {
      return null;
    }
    
    return {
      commitment,
      leafIndex,
      amount,
      transactionHash: event.transaction_hash || "",
    };
  } catch (error) {
    console.error("Failed to parse deposit event:", error);
    return null;
  }
}

/**
 * Monitor pending deposits and update when confirmed
 * 
 * This can be used to automatically track deposits in the background
 */
export class DepositMonitor {
  private pendingDeposits: Map<string, { commitment: string; walletAddress: string }>;
  
  constructor() {
    this.pendingDeposits = new Map();
  }
  
  /**
   * Add deposit to monitoring queue
   */
  addPendingDeposit(
    txHash: string,
    commitment: string,
    walletAddress: string
  ): void {
    this.pendingDeposits.set(txHash, { commitment, walletAddress });
    console.log("📝 Monitoring deposit:", txHash.slice(0, 10) + "...");
  }
  
  /**
   * Process confirmed transaction
   * Call this from transaction confirmation handler
   */
  async processConfirmedDeposit(
    txHash: string,
    provider: any
  ): Promise<void> {
    const pending = this.pendingDeposits.get(txHash);
    
    if (!pending) {
      return;
    }
    
    try {
      // Get transaction receipt
      const receipt = await provider.getTransactionReceipt(txHash);
      
      // Parse deposit event
      const event = parseDepositEvent(receipt.events || []);
      
      if (event) {
        // Update note with leafIndex
        trackDepositEvent(pending.walletAddress, event);
      }
      
      // Remove from pending
      this.pendingDeposits.delete(txHash);
      
      console.log("✓ Deposit processed:", txHash.slice(0, 10) + "...");
    } catch (error) {
      console.error("Failed to process deposit:", error);
    }
  }
  
  /**
   * Get pending deposits count
   */
  getPendingCount(): number {
    return this.pendingDeposits.size;
  }
}

// Singleton instance
export const depositMonitor = new DepositMonitor();
