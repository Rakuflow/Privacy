#!/usr/bin/env bash

# Config
ACCOUNT="my_account"
NETWORK="sepolia"
CONTRACT_ADDRESS="0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"  # ← THAY BẰNG CONTRACT ADDRESS THẬT SAU KHI DEPLOY
TOKEN_ADDRESS="0x04718f5a0Fc34cC1AF16A1cdee98fFB20C31f5cD61D6Ab07201858f4287c938D"
AMOUNT="1000000000000000000"  # 1 token (18 decimals, điều chỉnh theo token của bạn)
RHO="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"   # random rho
RCM="0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"   # random rcm
SPENDING_KEY="0x1111111111111111111111111111111111111111111111111111111111111111"  # random spending key

# Approve token trước nếu chưa (chạy 1 lần nếu cần)
# sncast call --account $ACCOUNT --contract-address $TOKEN_ADDRESS --function approve --arguments $CONTRACT_ADDRESS $AMOUNT --network $NETWORK

echo "Depositing $AMOUNT wei to Shielded Pool..."

sncast invoke \
  --account $ACCOUNT \
  --contract-address $CONTRACT_ADDRESS \
  --function deposit \
  --arguments $AMOUNT $RHO $RCM $SPENDING_KEY \
  --network $NETWORK

echo "Deposit transaction sent. Check tx hash on Starkscan Sepolia."