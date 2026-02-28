import { useZkKeypair } from "../contexts/ZkKeypairContext";

/**
 * Hook to get the current zk-address
 * Returns the zk-address from memory (Context)
 * If not available, returns a placeholder prompting user to generate keypair
 */
export function useZkAddress(): string {
  const { keypair } = useZkKeypair();
  
  if (!keypair) {
    return "0zk_please_setup_keypair_first";
  }
  
  return keypair.zkAddress;
}
