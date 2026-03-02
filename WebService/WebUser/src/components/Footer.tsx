import { Github, Twitter, BookOpen, FileText } from 'lucide-react';
import { WALLET_URLS, EXPLORER_URLS, OTHER_URLS } from '../config/urls';
import { logo } from '../assets';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-white/5 backdrop-blur-xl mt-12 sm:mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="RakuShield Logo" className="w-5 h-5 sm:w-7 sm:h-7 rounded-2xl" />
              <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">RakuShield</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-4">Privacy-first transfers on Starknet using zero-knowledge proofs. Keep your transactions private and secure.</p>
          </div>

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

          <div>
            <h3 className="text-sm font-semibold mb-4 text-white">Community</h3>
            <ul className="space-y-3">
              <li>
                <a href={OTHER_URLS.SWITTER} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-violet-400 transition-colors inline-flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Twitter / X
                </a>
              </li>
            </ul>
          </div>

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
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500 text-center sm:text-left">Copyright {currentYear} RakuShield. Built with privacy in mind on Starknet Sepolia.</p>
        </div>
      </div>
    </footer>
  );
}
