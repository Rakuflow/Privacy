#!/bin/bash

# Config
ACCOUNT_NAME="my_account"
NETWORK="sepolia"
CONTRACT_ADDRESS="0x0343d4b5c3f7de55fe6e54c243a65b954623f47f5e16ea4c47ad6cd8599844fb"   # THAY BẰNG ĐỊA CHỈ CONTRACT SAU KHI DEPLOY
TOKEN_ADDRESS="0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"

# Tham số test
AMOUNT="1000000000000000000"   # 1 token (18 decimals)
RHO="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
RCM="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
SPENDING_KEY="0x1111111111111111111111111111111111111111111111111111111111111111"

echo "=== Test Deposit ==="

# Bước 1: Approve token cho contract
echo "Approving token..."
sncast --account $ACCOUNT_NAME --network $NETWORK \
    invoke \
    --contract-address $TOKEN_ADDRESS \
    --function approve \
    --arguments $CONTRACT_ADDRESS $AMOUNT

# Chờ tx confirm (tùy tay, có thể sleep 10-20s hoặc check bằng starkscan)
sleep 15

# Bước 2: Gọi deposit
echo "Depositing..."
sncast --account $ACCOUNT_NAME --network $NETWORK \
    invoke \
    --contract-address $CONTRACT_ADDRESS \
    --function deposit \
    --arguments $AMOUNT $RHO $RCM $SPENDING_KEY

echo "Deposit done. Check transaction on Starkscan Sepolia."
echo "Expect: Event DepositEvent emitted + total_locked tăng"