# 🔄 Zk-Keypair Persistence Flow Diagram

## Complete User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER OPENS APP                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │  Connect Wallet?      │
         └───────┬───────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
     [YES]              [NO]
        │                 │
        │                 └──► Show "Connect Wallet" screen
        │
        ▼
┌────────────────────────────────────────┐
│  ZkKeypairContext Auto-Load            │
│  Check: localStorage[wallet_address]   │
└────────┬───────────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  FOUND    NOT FOUND
    │         │
    │         └──► Show "Setup Required" banner
    │              User clicks "Setup Now"
    │                     │
    │                     ▼
    │              ┌──────────────────┐
    │              │ Sign Message     │
    │              │ (Wallet popup)   │
    │              └────┬─────────────┘
    │                   │
    │                   ▼
    │              ┌──────────────────┐
    │              │ Derive Keypair   │
    │              │ (deterministic)  │
    │              └────┬─────────────┘
    │                   │
    │                   ▼
    │              ┌──────────────────┐
    │              │ Save Encoded to  │
    │              │ localStorage     │
    │              └────┬─────────────┘
    │                   │
    └───────────────────┴──► ✅ ZK-ADDRESS READY
                             │
                             ▼
                    ┌─────────────────┐
                    │ Use App         │
                    │ - Deposit       │
                    │ - Transfer      │
                    │ - Withdraw      │
                    └─────────────────┘
```

## Reload Flow (The Key Feature!)

```
┌─────────────────────────────────────────┐
│  USER PRESSES F5 / Ctrl+R              │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Page Reloads                           │
│  All JavaScript state lost              │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  Wallet Auto-Reconnects                 │
│  (via starknet-react)                   │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  ZkKeypairContext Triggers              │
│  useEffect([address])                   │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  loadZkKeypair(address)                 │
│  - Fetch from localStorage              │
│  - Decode with wallet-based key         │
│  - Validate wallet address match        │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  ✅ ZK-ADDRESS RESTORED!                │
│  NO SIGNATURE NEEDED!                   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  User can immediately:                  │
│  - See zk-address                       │
│  - Make deposits                        │
│  - Make transfers                       │
│  - Make withdrawals                     │
└─────────────────────────────────────────┘
```

## Multi-Wallet Flow

```
┌─────────────────────────────────────────┐
│  WALLET A Connected (has keypair)       │
│  zk-address: 0zk123...                  │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  User switches to WALLET B              │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  ZkKeypairContext detects change        │
│  prevAddress ≠ currentAddress           │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│  loadZkKeypair(WALLET_B_address)        │
└────────┬────────────────────────────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
  FOUND    NOT FOUND
    │          │
    │          ▼
    │    ┌──────────────────────┐
    │    │ Show "Setup Required"│
    │    │ for Wallet B         │
    │    └──────────────────────┘
    │
    ▼
┌──────────────────────┐
│ Restore Wallet B's   │
│ keypair              │
│ zk-address: 0zk789...│
└──────────────────────┘
```

## Storage Structure

```
localStorage
│
├── zkkeypair_v1_0x1234... (Wallet A)
│   └── {
│         "spendingKey": "encoded_base64_xxx",
│         "spendingPubKey": "encoded_base64_yyy",
│         "zkAddress": "encoded_base64_zzz",
│         "walletAddress": "0x1234...",
│         "timestamp": 1234567890
│       }
│
├── zkkeypair_v1_0x5678... (Wallet B)
│   └── {
│         "spendingKey": "encoded_base64_aaa",
│         "spendingPubKey": "encoded_base64_bbb",
│         "zkAddress": "encoded_base64_ccc",
│         "walletAddress": "0x5678...",
│         "timestamp": 1234567891
│       }
│
└── ... (other app data)
```

## Encoding/Decoding Flow

```
SAVE FLOW:
────────────────────────────────────────────────
Plain Keypair (in memory)
        │
        ▼
Generate encoding key from wallet address
  encodingKey = walletAddress + salt
        │
        ▼
XOR each field with encoding key
        │
        ▼
Base64 encode result
        │
        ▼
Save to localStorage
        │
        ▼
✅ STORED (unreadable to casual observer)


LOAD FLOW:
────────────────────────────────────────────────
Fetch from localStorage by wallet address
        │
        ▼
Base64 decode
        │
        ▼
Generate same encoding key from wallet address
        │
        ▼
XOR to decode each field
        │
        ▼
Validate wallet address matches
        │
        ▼
✅ KEYPAIR RESTORED to memory
```

## State Management

```
React Context (ZkKeypairContext)
├── Memory State
│   ├── keypair: ZkKeypair | null
│   ├── isReady: boolean
│   └── walletAddress: string
│
├── Auto-Restore Logic
│   ├── On mount: Load from localStorage
│   ├── On wallet connect: Load for that wallet
│   ├── On wallet switch: Load for new wallet
│   └── On disconnect: Clear memory only
│
└── Auto-Save Logic
    └── On setKeypair: Save to localStorage
```

## Timeline Example

```
T=0s    User opens app
T=1s    Wallet auto-connects (Argent)
T=1.1s  ZkKeypairContext triggers
T=1.15s Check localStorage → Found!
T=1.2s  Decode keypair
T=1.25s ✅ zk-address displayed (0zk123...)
T=5s    User makes deposit
T=10s   User makes transfer
T=15s   User presses F5 to reload
T=16s   Page reloads
T=17s   Wallet auto-reconnects
T=17.1s ZkKeypairContext triggers
T=17.15s Check localStorage → Found!
T=17.2s Decode keypair
T=17.25s ✅ zk-address displayed (0zk123...) ← SAME AS BEFORE!
T=20s   User continues using app (NO SIGNATURE!)
```

## Error Handling

```
┌─────────────────────────────┐
│  Load Attempt               │
└──────┬──────────────────────┘
       │
       ▼
  ┌─────────────┐
  │ Try Decode  │
  └──┬──────────┘
     │
     ├─► Success → Return keypair
     │
     ├─► Corrupted Data
     │   └─► Delete from storage
     │       └─► Return null
     │
     ├─► Wallet Mismatch
     │   └─► Return null
     │
     └─► Not Found
         └─► Return null
                │
                ▼
         Show "Setup Required"
```

## Security Layers

```
Layer 1: Deterministic Derivation
────────────────────────────────
Same wallet + Same signature → Same zk-address
✅ Can always regenerate

Layer 2: XOR Encoding
────────────────────────────────
Plain → XOR(data, wallet-based-key) → Base64
⚠️ Obfuscation, not encryption

Layer 3: Per-Wallet Keys
────────────────────────────────
Each wallet has unique encoding key
✅ Isolation between wallets

Layer 4: User Control
────────────────────────────────
"Clear Stored Keys" button
✅ Privacy control
```

## Console Output Examples

### Successful Auto-Restore
```
🔄 Wallet connected: Checking for stored zk-keypair... { wallet: '0x049d36...a24' }
✅ Restored zk-keypair from storage
📊 Balance refreshed: { address: '0x049d36...', totalBalance: '1000000...', noteCount: 2 }
```

### First Time Setup
```
🔄 Wallet connected: Checking for stored zk-keypair... { wallet: '0x049d36...a24' }
📭 No stored zk-keypair found
[User clicks "Setup Now"]
Requesting signature for typed data: {...}
✓ Signature received: ['0x...', '0x...']
Deriving zk-keypair from signature: { r: '...', s: '...', wallet: '0x049d36...' }
✓ Entropy: 0x...
✓ zk_spend_sk: 0x1234...
✓ zk_spend_pk: 0x5678...
✓ zk_address (0zk): 0zk9abc...
💾 Zk-keypair saved to storage
✅ Zk-keypair saved to localStorage: { wallet: '0x049d36...', zkAddress: '0zk9abc...' }
```

---
