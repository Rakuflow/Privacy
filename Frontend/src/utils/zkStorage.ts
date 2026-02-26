/**
 * Secure storage for zk-keypair in browser localStorage
 * Uses base64 encoding for obfuscation (not cryptographic security)
 * 
 * IMPORTANT: This is NOT cryptographically secure encryption.
 * For production, consider using Web Crypto API with user-provided password.
 */

import type { ZkKeypair } from "../types/ZkKeypair.type";

const STORAGE_PREFIX = "zkkeypair_";
const STORAGE_VERSION = "v1";

/**
 * Simple XOR encoding for obfuscation
 * Note: This is NOT secure encryption, just obfuscation
 */
function encodeString(str: string, key: string): string {
  let result = "";
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result); // base64 encode
}

function decodeString(encoded: string, key: string): string {
  try {
    const decoded = atob(encoded); // base64 decode
    let result = "";
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (error) {
    console.error("Failed to decode string:", error);
    throw new Error("Invalid encoded data");
  }
}

/**
 * Get storage key for specific wallet address
 */
function getStorageKey(walletAddress: string): string {
  if (!walletAddress) {
    throw new Error("Wallet address is required");
  }
  return `${STORAGE_PREFIX}${STORAGE_VERSION}_${walletAddress.toLowerCase()}`;
}

/**
 * Generate encoding key from wallet address
 * This ensures each wallet has a unique encoding key
 */
function getEncodingKey(walletAddress: string): string {
  // Use wallet address + salt as encoding key
  return walletAddress + "_starkshield_zk_" + STORAGE_VERSION;
}

/**
 * Save zk-keypair to localStorage (encoded)
 */
export function saveZkKeypair(keypair: ZkKeypair): void {
  try {
    const { walletAddress } = keypair;
    if (!walletAddress) {
      throw new Error("Wallet address is required to save keypair");
    }

    const storageKey = getStorageKey(walletAddress);
    const encodingKey = getEncodingKey(walletAddress);

    // Encode each sensitive field
    const encoded = {
      spendingKey: encodeString(keypair.spendingKey, encodingKey),
      spendingPubKey: encodeString(keypair.spendingPubKey, encodingKey),
      zkAddress: encodeString(keypair.zkAddress, encodingKey),
      walletAddress: walletAddress, // Store wallet address in plain (for key lookup)
      timestamp: Date.now(),
    };

    localStorage.setItem(storageKey, JSON.stringify(encoded));
    
    console.log("✅ Zk-keypair saved to localStorage:", {
      wallet: walletAddress.slice(0, 10) + "...",
      zkAddress: keypair.zkAddress.slice(0, 15) + "...",
    });
  } catch (error) {
    console.error("Failed to save zk-keypair:", error);
    throw new Error("Failed to save zk-keypair to storage");
  }
}

/**
 * Load zk-keypair from localStorage (decode)
 */
export function loadZkKeypair(walletAddress: string): ZkKeypair | null {
  try {
    if (!walletAddress) {
      return null;
    }

    const storageKey = getStorageKey(walletAddress);
    const encodingKey = getEncodingKey(walletAddress);

    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      console.log("📭 No stored zk-keypair found for wallet:", walletAddress.slice(0, 10) + "...");
      return null;
    }

    const encoded = JSON.parse(stored);

    // Decode each field
    const keypair: ZkKeypair = {
      spendingKey: decodeString(encoded.spendingKey, encodingKey),
      spendingPubKey: decodeString(encoded.spendingPubKey, encodingKey),
      zkAddress: decodeString(encoded.zkAddress, encodingKey),
      walletAddress: encoded.walletAddress,
    };

    // Verify wallet address matches
    if (keypair.walletAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      console.warn("⚠️ Wallet address mismatch in stored keypair");
      return null;
    }

    console.log("✅ Zk-keypair loaded from localStorage:", {
      wallet: walletAddress.slice(0, 10) + "...",
      zkAddress: keypair.zkAddress.slice(0, 15) + "...",
      timestamp: encoded.timestamp,
    });

    return keypair;
  } catch (error) {
    console.error("Failed to load zk-keypair:", error);
    // Clear corrupted data
    try {
      localStorage.removeItem(getStorageKey(walletAddress));
    } catch (e) {
      // Ignore
    }
    return null;
  }
}

/**
 * Clear zk-keypair from localStorage
 */
export function clearZkKeypair(walletAddress: string): void {
  try {
    if (!walletAddress) {
      return;
    }

    const storageKey = getStorageKey(walletAddress);
    localStorage.removeItem(storageKey);

    console.log("🗑️ Zk-keypair cleared from localStorage:", walletAddress.slice(0, 10) + "...");
  } catch (error) {
    console.error("Failed to clear zk-keypair:", error);
  }
}

/**
 * Clear all zk-keypairs from localStorage
 * Useful for debugging or privacy features
 */
export function clearAllZkKeypairs(): void {
  try {
    const keys = Object.keys(localStorage);
    const zkKeys = keys.filter(key => key.startsWith(STORAGE_PREFIX));
    
    zkKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(`🗑️ Cleared ${zkKeys.length} zk-keypair(s) from localStorage`);
  } catch (error) {
    console.error("Failed to clear all zk-keypairs:", error);
  }
}

/**
 * Check if zk-keypair exists for wallet
 */
export function hasZkKeypair(walletAddress: string): boolean {
  if (!walletAddress) {
    return false;
  }

  const storageKey = getStorageKey(walletAddress);
  return localStorage.getItem(storageKey) !== null;
}
