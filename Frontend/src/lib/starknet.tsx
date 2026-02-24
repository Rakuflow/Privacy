import {
  StarknetConfig,
  jsonRpcProvider,
  publicProvider,
  InjectedConnector,
} from "@starknet-react/core";
import { sepolia } from "@starknet-react/chains";
import { ReactNode } from "react";

const chains = [sepolia];

const provider = jsonRpcProvider({
  rpc: (chain) => ({
    nodeUrl: `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_10/9Lwh6YBXUMo2Y8U1X0KWK`,
  }),
});

// Create connector instances with proper configuration
function argentX() {
  return new InjectedConnector({
    options: {
      id: "argentX",
      name: "Argent X",
    },
  });
}

function braavos() {
  return new InjectedConnector({
    options: {
      id: "braavos",
      name: "Braavos",
    },
  });
}

const connectors = [
  argentX(),
  braavos(),
];

export function StarknetProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <StarknetConfig
      chains={chains}
      provider={provider}
      connectors={connectors}
      autoConnect
    >
      {children}
    </StarknetConfig>
  );
}