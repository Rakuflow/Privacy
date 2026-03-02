import { Account, RpcProvider, Contract, cairo, json } from 'starknet';
import * as dotenv from 'dotenv';
import fs from 'fs';

// Load env
dotenv.config();

const RPC_URL = "https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_8/LfKXerIDAvp3ToDzzjfD8";
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const SHIELDED_POOL_ADDRESS = process.env.SHIELDED_POOL_ADDRESS; // địa chỉ deploy của ShieldedPool
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS;
// SHIELDED_VERIFIER_ADDRESS không cần ở đây vì verifier là internal storage

// if (!RPC_URL || !PRIVATE_KEY || !SHIELDED_POOL_ADDRESS || !TOKEN_ADDRESS) {
//     console.error('Missing env vars: RPC_URL, PRIVATE_KEY, SHIELDED_POOL_ADDRESS, TOKEN_ADDRESS');
//     process.exit(1);
// }

async function main() {
    // Provider
    const provider = new RpcProvider({ nodeUrl: RPC_URL });

    // Account (dùng để sign tx)
    const account = new Account(provider, '0xYourAccountAddressIfKnown', PRIVATE_KEY); // hoặc dùng starknet.getStarknet() nếu integrate với wallet

    // Load ABI
    const abi = json.parse(fs.readFileSync('./abi/ShieldedPool.json', 'utf8'));
    console.log('ABI loaded:', abi);

    // Khởi tạo Contract
    const shieldedPool = new Contract(abi, SHIELDED_POOL_ADDRESS, provider);
    shieldedPool.connect(account); // connect account để sign write tx

    // Tham số cho deposit (thay đổi theo nhu cầu của bạn)
    const amount = cairo.uint256(1000000000000000000n); // ví dụ: 1 token (18 decimals), điều chỉnh theo token của bạn
    // amount low/high: low = phần dưới 128 bit, high = phần trên
    // cairo.uint256(1n) → { low: 1n, high: 0n }
    const rho = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'; // felt252 hex
    const rcm = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
    const spending_key = '0x1111111111111111111111111111111111111111111111111111111111111111';

    console.log('Calling deposit...');
    console.log('Amount (u256):', amount);
    console.log('rho:', rho);
    console.log('rcm:', rcm);
    console.log('spending_key:', spending_key);

    try {
        // Gọi function deposit (external, cần sign)
        const txResponse = await shieldedPool.deposit(
            TOKEN_ADDRESS,
            amount,          // u256 → starknet.js tự serialize thành 2 felts (low, high)
            rho,
            rcm,
            spending_key
        );

        console.log('Transaction sent!');
        console.log('Transaction hash:', txResponse.transaction_hash);

        // Wait for receipt (tùy chọn)
        const receipt = await provider.waitForTransaction(txResponse.transaction_hash, {
            retryInterval: 500,
            successStates: ['ACCEPTED_ON_L2']
        });

        console.log('Transaction confirmed!');
        console.log('Status:', receipt.statusReceipt);
        if (receipt.events?.length > 0) {
            console.log('Events emitted (DepositEvent):', receipt.events);
        }
    } catch (error) {
        console.error('Error calling deposit:', error);
        if (error.message.includes('INSUFFICIENT_BALANCE')) {
            console.log('→ Kiểm tra balance token của account và approve trước nếu cần (token.transfer_from).');
        }
    }
}

main().catch(console.error);
