/**
 * Debug component to verify ZkKeypairProvider is working
 * Remove this in production
 */

import { useZkKeypair } from "../../contexts/ZkKeypairContext";

export function ZkKeypairProviderTest() {
  try {
    const { keypair, isReady } = useZkKeypair();
    console.log("✅ ZkKeypairProvider is working:", { isReady, hasKeypair: !!keypair });
    return null;
  } catch (error) {
    console.error("❌ ZkKeypairProvider test failed:", error);
    return null;
  }
}
