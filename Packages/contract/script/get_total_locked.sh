#!/bin/bash

# Config
NETWORK="sepolia"
CONTRACT_ADDRESS="0xYOUR_DEPLOYED_SHIELDED_POOL_ADDRESS"   # THAY BẰNG ĐỊA CHỈ CONTRACT

echo "=== Get Total Locked in Pool ==="

# Vì _total_locked là storage variable, sncast call không đọc trực tiếp private storage.
# Cách đơn giản: Nếu bạn thêm hàm view get_total_locked vào contract (xem bên dưới), thì dùng:
# sncast call --contract-address $CONTRACT_ADDRESS --function get_total_locked --network $NETWORK

# Nếu chưa thêm hàm view, bạn có thể theo dõi event DepositEvent trên Starkscan hoặc dùng starknet.js/starknet.py để đọc storage slot.

echo "Hiện tại contract không có hàm view cho _total_locked."
echo "Gợi ý: Thêm hàm view vào contract và redeploy/declare lại."

# Nếu bạn đã thêm hàm view:
# sncast call --contract-address $CONTRACT_ADDRESS --function get_total_locked --network $NETWORK