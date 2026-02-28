#!/usr/bin/env node

/**
 * Generate a new Starknet wallet for relayer service
 * This creates a NEW keypair - need to deploy an account contract and fund it
 */

import { ec, encode, hash } from 'starknet';
import { randomBytes } from 'crypto';

console.log('Generating new Starknet wallet for relayer...\n');

// Generate random private key
const privateKey = '0x' + randomBytes(31).toString('hex');

// Generate public key from private key
const starkKeyPair = ec.starkCurve.getStarkKey(privateKey);
const publicKey = encode.addHexPrefix(starkKeyPair);

console.log('Wallet Generated!\n');
console.log('================================');
console.log('PRIVATE KEY (keep secret!):\n');
console.log(privateKey);
console.log('\nPUBLIC KEY:\n');
console.log(publicKey);
console.log('================================\n');

console.log('IMPORTANT NEXT STEPS:\n');
console.log('1. DEPLOY ACCOUNT:');
console.log('   - Use Argent X or Braavos browser extension');
console.log('   - Import this private key');
console.log('   - Deploy the account (costs ~0.001 STRK)');
console.log('');
console.log('2. FUND WALLET:');
console.log('   - Send STRK for gas fees');
console.log('   - Minimum: 0.05 STRK');
console.log('   - Recommended: 0.1-1 STRK');
console.log('');
console.log('3. ADD TO .env:');
console.log('   cd relayer');
console.log('   cp .env.example .env');
console.log('   # Edit .env and add:');
console.log(`   RELAYER_PRIVATE_KEY=${privateKey}`);
console.log('   RELAYER_ADDRESS=0x...deployed_address...');
console.log('');
console.log('4. START RELAYER:');
console.log('   npm run dev');
console.log('');

console.log('SECURITY REMINDER:');
console.log('- NEVER commit .env to git');
console.log('- NEVER share private key');
console.log('- Backup private key securely');
console.log('');

// Generate .env template
const envContent = `# Generated ${new Date().toISOString()}

# Relayer wallet credentials (from generate-wallet.js)
RELAYER_PRIVATE_KEY=${privateKey}
RELAYER_ADDRESS=0x...DEPLOYED_ACCOUNT_ADDRESS...

# Shielded Pool contract (from frontend)
SHIELDED_POOL_CONTRACT=0x...CONTRACT_ADDRESS...

# RPC URL (get own key at alchemy.com)
RPC_URL=https://starknet-sepolia.g.alchemy.com/v2/ALCHEMY_KEY

# Server port
PORT=3001
`;

console.log('Creating .env file...\n');

try {
  const fs = await import('fs');
  fs.writeFileSync('.env', envContent);
  console.log('Created .env file with private key!');
  console.log('   Edit it to add RELAYER_ADDRESS and SHIELDED_POOL_CONTRACT\n');
} catch (err) {
  console.log('Could not create .env file automatically.');
  console.log('   Please create it manually with the content above.\n');
}

console.log('Documentation:');
console.log('   relayer/QUICKSTART.md - Setup guide');
console.log('   relayer/README.md - Full documentation');
console.log('');
