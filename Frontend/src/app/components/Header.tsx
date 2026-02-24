import { Link } from 'react-router';
import { useAccount } from '@starknet-react/core';
import { WalletButton } from './WalletButton';
import { Shield, ArrowLeft } from 'lucide-react';

interface AppHeaderProps {
  showBackButton?: boolean;
}

export function Header({ showBackButton = true }: AppHeaderProps) {
  const { address } = useAccount();

  return (
    <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          {showBackButton && <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />}
          <img src="/src/assets/Logo.png" alt="RakuShield Logo" className="w-5 h-5 sm:w-7 sm:h-7" />
          <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">RakuShield</span>
        </Link>

        {/* Wallet Button / Address */}
        {address ? (
          <div className="flex items-center gap-3">
            <div className="hidden sm:block px-3 py-2 bg-white/5 border border-white/10 rounded-lg">
              <p className="font-mono text-sm text-violet-400">
                {address.slice(0, 6)}...{address.slice(-4)}
              </p>
            </div>
            <WalletButton />
          </div>
        ) : (
          <WalletButton />
        )}
      </div>
    </nav>
  );
}
