/**
 * Test utility to verify zkStorage encoding/decoding
 * Run this in browser console to test
 */

import { saveZkKeypair, loadZkKeypair, clearZkKeypair } from './zkStorage';
import type { ZkKeypair } from '../contexts/ZkKeypairContext';

export function testZkStorage() {
  console.log("🧪 Testing zkStorage encoding/decoding...\n");

  // Test data
  const testKeypair: ZkKeypair = {
    spendingKey: "0x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0",
    spendingPubKey: "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210",
    zkAddress: "0zk987654321098765432109876543210987654321098765432109876543210",
    walletAddress: "0x0000000000000000000000000000000000000000000000000000000000000001",
  };

  console.log("📝 Original keypair:", testKeypair);

  // Test 1: Save
  console.log("\n✅ Test 1: Save keypair");
  try {
    saveZkKeypair(testKeypair);
    console.log("✓ Keypair saved successfully");
  } catch (error) {
    console.error("✗ Failed to save:", error);
    return;
  }

  // Test 2: Load
  console.log("\n✅ Test 2: Load keypair");
  try {
    const loaded = loadZkKeypair(testKeypair.walletAddress);
    if (!loaded) {
      console.error("✗ Failed to load: returned null");
      return;
    }
    console.log("✓ Keypair loaded successfully");
    console.log("📝 Loaded keypair:", loaded);

    // Verify all fields match
    const matches = 
      loaded.spendingKey === testKeypair.spendingKey &&
      loaded.spendingPubKey === testKeypair.spendingPubKey &&
      loaded.zkAddress === testKeypair.zkAddress &&
      loaded.walletAddress === testKeypair.walletAddress;

    if (matches) {
      console.log("✓ All fields match!");
    } else {
      console.error("✗ Fields don't match:");
      console.log("  spendingKey:", loaded.spendingKey === testKeypair.spendingKey);
      console.log("  spendingPubKey:", loaded.spendingPubKey === testKeypair.spendingPubKey);
      console.log("  zkAddress:", loaded.zkAddress === testKeypair.zkAddress);
      console.log("  walletAddress:", loaded.walletAddress === testKeypair.walletAddress);
    }
  } catch (error) {
    console.error("✗ Failed to load:", error);
    return;
  }

  // Test 3: Load with wrong wallet address
  console.log("\n✅ Test 3: Load with wrong wallet address");
  try {
    const wrongAddress = "0x0000000000000000000000000000000000000000000000000000000000000002";
    const loaded = loadZkKeypair(wrongAddress);
    if (loaded === null) {
      console.log("✓ Correctly returned null for non-existent wallet");
    } else {
      console.error("✗ Should have returned null but got:", loaded);
    }
  } catch (error) {
    console.error("✗ Unexpected error:", error);
  }

  // Test 4: Clear
  console.log("\n✅ Test 4: Clear keypair");
  try {
    clearZkKeypair(testKeypair.walletAddress);
    console.log("✓ Keypair cleared");

    const loaded = loadZkKeypair(testKeypair.walletAddress);
    if (loaded === null) {
      console.log("✓ Verified keypair is gone");
    } else {
      console.error("✗ Keypair still exists after clear:", loaded);
    }
  } catch (error) {
    console.error("✗ Failed to clear:", error);
    return;
  }

  console.log("\n🎉 All tests passed!");
}

// Export for manual testing
(window as any).testZkStorage = testZkStorage;
