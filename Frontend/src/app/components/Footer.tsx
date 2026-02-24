import { Shield, Github, Twitter, BookOpen, FileText } from 'lucide-react';
import { Link } from 'react-router';
import { WALLET_URLS, EXPLORER_URLS, OTHER_URLS } from '../../config/urls';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-white/5 backdrop-blur-xl mt-12 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-30">
          {/* About */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/src/assets/Logo.png" alt="RakuShield Logo" className="w-5 h-5 sm:w-7 sm:h-7 rounded-2xl" />
              <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">RakuShield</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">Privacy-first transfers on Starknet using zero-knowledge proofs. Keep your transactions private and secure.</p>
            {/* <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg inline-flex">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-400 font-medium">
                Starknet Sepolia
              </span>
            </div> */}
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-white">Resources</h3>
            <ul className="space-y-3">
              <li>
                <a href={OTHER_URLS.DOCUMENTATION} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-violet-400 transition-colors inline-flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Documentation
                </a>
              </li>
              <li>
                <a href={OTHER_URLS.GITHUB} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-violet-400 transition-colors inline-flex items-center gap-2">
                  <Github className="w-4 h-4" />
                  GitHub Repository
                </a>
              </li>
              <li>
                <a href={EXPLORER_URLS.SEPOLIA} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-violet-400 transition-colors inline-flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Block Explorer
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-white">Community</h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="https://twitter.com/starknet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-violet-400 transition-colors inline-flex items-center gap-2"
                >
                  <Twitter className="w-4 h-4" />
                  Twitter / X
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/starknet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-400 hover:text-violet-400 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                  Discord Server
                </a>
              </li>
              <li>
                <a href="https://t.me/starknet" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-violet-400 transition-colors inline-flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19c-.14.75-.42 1-.68 1.03c-.58.05-1.02-.38-1.58-.75c-.88-.58-1.38-.94-2.23-1.5c-.99-.65-.35-1.01.22-1.59c.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02c-.09.02-1.49.95-4.22 2.79c-.4.27-.76.41-1.08.4c-.36-.01-1.04-.2-1.55-.37c-.63-.2-1.12-.31-1.08-.66c.02-.18.27-.36.74-.55c2.92-1.27 4.86-2.11 5.83-2.51c2.78-1.16 3.35-1.36 3.73-1.36c.08 0 .27.02.39.12c.1.08.13.19.14.27c-.01.06.01.24 0 .38z" />
                  </svg>
                  Telegram Group
                </a>
              </li>
            </ul>
          </div>

          {/* Wallets */}
          <div>
            <h3 className="text-sm font-semibold mb-4 text-white">Supported Wallets</h3>
            <ul className="space-y-3">
              <li>
                <a href={WALLET_URLS.ARGENT_X} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-violet-400 transition-colors inline-flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">A</span>
                  </div>
                  Argent X
                </a>
              </li>
              <li>
                <a href={WALLET_URLS.BRAAVOS} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-violet-400 transition-colors inline-flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">B</span>
                  </div>
                  Braavos Wallet
                </a>
              </li>
            </ul>
            {/* <div className="mt-4 p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-lg">
              <p className="text-xs text-violet-300">
                Connect with any Starknet wallet to start shielding your assets
              </p>
            </div> */}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 text-center sm:text-left">© {currentYear} RakuShield. Built with privacy in mind on Starknet Sepolia.</p>
        </div>
      </div>
    </footer>
  );
}
