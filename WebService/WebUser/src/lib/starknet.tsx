import { StarknetConfig, jsonRpcProvider, InjectedConnector } from '@starknet-react/core';
import { sepolia } from '@starknet-react/chains';
import type { ReactNode } from 'react';
import { env } from '../config/envConfig';

const chains = [sepolia];
const RPC_URL = env.RPC_SEPOLIA;

const provider = jsonRpcProvider({
  rpc: () => ({
    nodeUrl: RPC_URL,
  }),
});

function argentX() {
  return new InjectedConnector({
    options: {
      id: 'argentX',
      name: 'Argent X',
    },
  });
}

function braavos() {
  return new InjectedConnector({
    options: {
      id: 'braavos',
      name: 'Braavos',
    },
  });
}

const connectors = [argentX(), braavos()];

export function StarknetProvider({ children }: { children: ReactNode }) {
  return (
    <StarknetConfig chains={chains} provider={provider} connectors={connectors} autoConnect>
      {children}
    </StarknetConfig>
  );
}
