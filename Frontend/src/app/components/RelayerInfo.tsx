import { Info, ExternalLink } from "lucide-react";

interface RelayerInfoProps {
  variant?: "compact" | "full";
}

export function RelayerInfo({ variant = "full" }: RelayerInfoProps) {
  if (variant === "compact") {
    return (
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-blue-200">
            <p className="font-semibold mb-1">Privacy Note:</p>
            <p className="text-blue-300/90">
              Your wallet address will appear as "From" on explorer. For true
              anonymity, a relayer service is needed.{" "}
              <a
                href="/docs/anonymous-relayer-guide.md"
                target="_blank"
                className="text-blue-300 underline hover:text-blue-200"
              >
                Learn more →
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 border border-blue-500/20 rounded-lg">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <h4 className="text-sm font-semibold text-blue-300">
            🔒 Privacy Level Explained
          </h4>
          
          <div className="space-y-2 text-xs text-blue-200/90">
            <div className="p-2 bg-green-500/10 border border-green-500/20 rounded">
              <p className="font-semibold text-green-300 mb-1">
                ✅ What IS Private:
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-green-200/90 ml-2">
                <li>Sender's zk-address (0zk...)</li>
                <li>Recipient's zk-address (0zk...)</li>
                <li>Transfer amount</li>
                <li>Which note was spent</li>
              </ul>
            </div>

            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded">
              <p className="font-semibold text-amber-300 mb-1">
                ⚠️ What is NOT Private (Currently):
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 ml-2">
                <li>Your wallet address (0x...) appears as "From" on explorer</li>
                <li>Transaction timestamp</li>
              </ul>
            </div>

            <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded">
              <p className="font-semibold text-purple-300 mb-1">
                🚀 True Anonymity (Requires Backend):
              </p>
              <p className="text-purple-200/90">
                To hide your wallet address, you need a relayer service that
                submits transactions on your behalf.
              </p>
              <a
                href="https://github.com/your-repo/docs/anonymous-relayer-guide.md"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-purple-300 hover:text-purple-200 underline"
              >
                <span>Read implementation guide</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <p className="text-xs text-gray-400 italic pt-1">
            💡 On-chain observers can see: nullifier hash + new commitment, but
            cannot link them to identities or amounts.
          </p>
        </div>
      </div>
    </div>
  );
}
