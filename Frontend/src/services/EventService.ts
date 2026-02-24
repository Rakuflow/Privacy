import { RpcProvider } from "starknet";
import { CONTRACTS, RPC_CONFIG } from "../contracts/config";

export interface DepositEventData {
  type: "deposit";
  commitment: string;
  leafIndex: string;
  amount: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export interface TransferEventData {
  type: "transfer";
  nullifierHash: string;
  commitmentOut: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export interface WithdrawEventData {
  type: "withdraw";
  nullifierHash: string;
  recipient: string;
  amount: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export type ShieldedEventData = DepositEventData | TransferEventData | WithdrawEventData;

export class EventService {
  private provider: RpcProvider;

  constructor() {
    this.provider = new RpcProvider({
      nodeUrl: RPC_CONFIG.nodeUrl,
    });
  }

  /**
   * Fetch all events from ShieldedPool contract
   */
  async fetchAllEvents(fromBlock: number = 0): Promise<ShieldedEventData[]> {
    try {
      const events: ShieldedEventData[] = [];

      // Get current block number
      const currentBlock = await this.provider.getBlockNumber();
      
      // Fetch events in chunks (Alchemy has limits)
      const chunkSize = 1000;
      
      for (let i = fromBlock; i <= currentBlock; i += chunkSize) {
        const toBlock = Math.min(i + chunkSize - 1, currentBlock);
        
        // Fetch events for this chunk
        const result = await this.provider.getEvents({
          address: CONTRACTS.SHIELDED_POOL,
          from_block: { block_number: i },
          to_block: { block_number: toBlock },
          chunk_size: 100,
        });

        // Parse events
        for (const event of result.events) {
          const parsedEvent = this.parseEvent(event);
          if (parsedEvent) {
            events.push(parsedEvent);
          }
        }
      }

      // Sort by block number (newest first)
      events.sort((a, b) => b.blockNumber - a.blockNumber);

      return events;
    } catch (error) {
      console.error("Failed to fetch events:", error);
      return [];
    }
  }

  /**
   * Parse event data based on event keys
   */
  private parseEvent(event: any): ShieldedEventData | null {
    try {
      const eventKey = event.keys[0];
      
      // DepositEvent key hash
      if (eventKey === this.getEventKeyHash("DepositEvent")) {
        return {
          type: "deposit",
          commitment: event.keys[1],
          leafIndex: event.keys[2],
          amount: event.data[0],
          blockNumber: event.block_number || 0,
          transactionHash: event.transaction_hash,
          timestamp: Date.now(), // TODO: fetch actual block timestamp
        };
      }
      
      // TransferEvent key hash
      if (eventKey === this.getEventKeyHash("TransferEvent")) {
        return {
          type: "transfer",
          nullifierHash: event.keys[1],
          commitmentOut: event.keys[2],
          blockNumber: event.block_number || 0,
          transactionHash: event.transaction_hash,
          timestamp: Date.now(),
        };
      }
      
      // WithdrawEvent key hash
      if (eventKey === this.getEventKeyHash("WithdrawEvent")) {
        return {
          type: "withdraw",
          nullifierHash: event.keys[1],
          recipient: event.keys[2],
          amount: event.data[0],
          blockNumber: event.block_number || 0,
          transactionHash: event.transaction_hash,
          timestamp: Date.now(),
        };
      }

      return null;
    } catch (error) {
      console.error("Failed to parse event:", error);
      return null;
    }
  }

  /**
   * Get event key hash (simplified - you may need to compute actual hash)
   */
  private getEventKeyHash(eventName: string): string {
    // These are placeholder values - you need to compute actual event selector hashes
    // In Cairo, event selector = sn_keccak(event_name)
    const eventHashes: Record<string, string> = {
      "DepositEvent": "0x0", // Placeholder
      "TransferEvent": "0x1", // Placeholder
      "WithdrawEvent": "0x2", // Placeholder
    };
    
    return eventHashes[eventName] || "0x0";
  }

  /**
   * Fetch events for specific user's deposits
   */
  async fetchUserDeposits(userAddress: string): Promise<DepositEventData[]> {
    const allEvents = await this.fetchAllEvents();
    
    // Filter deposit events
    // Note: We can't filter by user directly from events since commitment doesn't reveal user
    // User needs to check if they own the commitment locally
    return allEvents.filter(e => e.type === "deposit") as DepositEventData[];
  }
}
