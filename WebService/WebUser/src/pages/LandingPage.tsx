import { Link } from 'react-router';
import { AnimatedBackground } from '../components/AnimatedBackground';
import { GlowButton } from '../components/GlowButton';
import { GlassCard } from '../components/GlassCard';
import { Footer } from '../components/Footer';
import { Shield, Lock, Zap, ArrowRight, Eye, GitBranch, PlayCircle, Layers, Users, ShieldCheck, Database, Code, Key } from 'lucide-react';
import { logo, starknetLogo, systemDesignImage } from '../assets';

export function LandingPage() {
  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />

      <nav className="border-b border-white/10 backdrop-blur-xl bg-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {/* <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-violet-500" /> */}
            <img src={logo} alt="RakuShield Logo" className="w-6 h-6 sm:w-8 sm:h-8" />
            <span className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">RakuShield</span>
          </div>
          <Link to="/app">
            <GlowButton>Launch App</GlowButton>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 lg:pt-32 pb-12 sm:pb-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-violet-500/10 border border-violet-500/20 rounded-full mb-6 sm:mb-8">
            <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse" />
            <span className="text-xs sm:text-sm text-violet-300">Powered by Starknet</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-white via-violet-200 to-indigo-200 bg-clip-text text-transparent leading-tight px-4">
            Privacy-First Transfers on Starknet
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-gray-400 mb-8 sm:mb-12 max-w-2xl mx-auto px-4">
            A shielded pool protocol leveraging zero-knowledge proofs for completely private transfers. Only you know the sender and receiver.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link to="/app">
              <GlowButton className="w-full sm:w-auto">
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </GlowButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <GlassCard>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-violet-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Eye className="w-6 h-6 text-violet-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-3">Shielded Transfer</h3>
                <p className="text-gray-400">Hide sender and receiver addresses using zk-commitments. On-chain observers only see public relayer addresses.</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-3">Zero-Knowledge Proofs</h3>
                <p className="text-gray-400">Prove ownership without revealing your identity. SNIP-9 meta-transactions keep your zk-address private.</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-3">Gas Abstraction</h3>
                <p className="text-gray-400">Pay gas with any token via paymasters or use relayers. No need to expose your main wallet.</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Video Tutorial Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 mb-2">
            <PlayCircle className="w-6 h-6 text-violet-400" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Video Tutorial</h2>
          </div>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">Watch our step-by-step guide to get started with RakuShield</p>
        </div>

        <GlassCard className="p-0 overflow-hidden max-w-5xl mx-auto">
          <div className="relative w-full pb-[56.25%]">
            <iframe
              className="absolute top-0 left-0 w-full h-full"
              src="https://www.youtube.com/embed/QVr1qt3OHn4"
              title="Tutorial Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </GlassCard>
      </section>

      {/* How It Works Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">How It Works</h2>
          <p className="text-sm sm:text-base text-gray-400">Three simple steps to private transfers</p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl font-bold">1</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">Establish Private Execution Identity</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Connect your wallet and sign a message to derive your unique zk-address (0zk...). This address is cryptographically linked to your wallet but remains private.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl font-bold">2</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">Deposit & Shield</h3>
              <p className="text-sm sm:text-base text-gray-400">Deposit tokens into the shielded pool contract. Your funds are locked with a zk-commitment, making them completely private.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 sm:gap-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-lg sm:text-xl font-bold">3</span>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold mb-1.5 sm:mb-2">Shielded Transfer or Withdraw</h3>
              <p className="text-sm sm:text-base text-gray-400">
                Send to another zk-address or withdraw to any public address. All transactions are executed via relayers keeping your identity private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Users className="w-6 h-6 text-violet-400" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Who Needs RakuShield?</h2>
          </div>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">Financial privacy is a fundamental right for everyone</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Privacy-Conscious Users */}
          <GlassCard className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 border-violet-500/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-violet-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-violet-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-violet-300">Privacy-Conscious Users</h3>
              <p className="text-sm text-gray-400">Protect your financial activity from surveillance, data brokers, and unwanted tracking</p>
            </div>
          </GlassCard>

          {/* DeFi Traders */}
          <GlassCard className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 border-indigo-500/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-300">DeFi Traders</h3>
              <p className="text-sm text-gray-400">Hide your trading strategies and positions from MEV bots and front-runners</p>
            </div>
          </GlassCard>

          {/* Businesses & DAOs */}
          <GlassCard className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-purple-300">Businesses & DAOs</h3>
              <p className="text-sm text-gray-400">Keep treasury movements, salaries, and financial operations confidential</p>
            </div>
          </GlassCard>

          {/* Whistleblowers & Activists */}
          <GlassCard className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-orange-300">Whistleblowers & Activists</h3>
              <p className="text-sm text-gray-400">Receive and send funds without compromising your identity or safety</p>
            </div>
          </GlassCard>

          {/* High Net Worth Individuals */}
          <GlassCard className="bg-gradient-to-br from-cyan-500/5 to-cyan-500/10 border-cyan-500/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-cyan-300">High Net Worth Individuals</h3>
              <p className="text-sm text-gray-400">Protect your wealth from targeted attacks and maintain financial confidentiality</p>
            </div>
          </GlassCard>

          {/* Regular Users */}
          <GlassCard className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-green-300">Everyone Else</h3>
              <p className="text-sm text-gray-400">Privacy is a basic human right for all.</p>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="mt-8 bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border-violet-500/20 text-center p-6">
          <p className="text-base text-gray-300">
            <strong className="text-violet-300">Privacy is not about having something to hide.</strong> It's about having control over what you share.
          </p>
        </GlassCard>
      </section>

      {/* Architecture Map Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Layers className="w-6 h-6 text-violet-400" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Starknet-Powered Architecture</h2>
          </div>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">Built with cutting-edge Starknet technologies for maximum security and scalability</p>
        </div>

        <div>
          <img src={systemDesignImage} alt="System Design" className="w-full max-w-4xl mx-auto rounded-lg shadow-lg pb-5" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Cairo Smart Contracts */}
          <GlassCard className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Code className="w-6 h-6 text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 text-orange-300">Cairo Smart Contracts</h3>
                <p className="text-sm text-gray-400">Production-ready shielded pool contract written in Cairo for provable security and efficiency</p>
              </div>
            </div>
          </GlassCard>

          {/* Poseidon & Pedersen */}
          <GlassCard className="bg-gradient-to-br from-cyan-500/5 to-cyan-500/10 border-cyan-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Key className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 text-cyan-300">Poseidon & Pedersen</h3>
                <p className="text-sm text-gray-400">ZK-friendly hash functions for commitments and nullifiers with native Cairo support</p>
              </div>
            </div>
          </GlassCard>

          {/* Garaga Verifier */}
          <GlassCard className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 text-purple-300">Garaga ZK Verifier</h3>
                <p className="text-sm text-gray-400">Efficient Noir proof verification optimized for Starknet's STARK proofs</p>
              </div>
            </div>
          </GlassCard>

          {/* Account Abstraction */}
          <GlassCard className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 border-indigo-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 text-indigo-300">Account Abstraction</h3>
                <p className="text-sm text-gray-400">SNIP-9 meta-transactions and paymaster support for gasless private transfers</p>
              </div>
            </div>
          </GlassCard>

          {/* Merkle Tree State */}
          <GlassCard className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <GitBranch className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 text-green-300">Merkle Tree State</h3>
                <p className="text-sm text-gray-400">On-chain Merkle tree for commitment tracking with efficient membership proofs</p>
              </div>
            </div>
          </GlassCard>

          {/* ERC-20 Integration */}
          <GlassCard className="bg-gradient-to-br from-yellow-500/5 to-yellow-500/10 border-yellow-500/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2 text-yellow-300">ERC-20 Integration</h3>
                <p className="text-sm text-gray-400">Native support for STRK and any Starknet ERC-20 token with approve & transfer flows</p>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Security Model Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <ShieldCheck className="w-6 h-6 text-violet-400" />
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">Multi-Layer Security Model</h2>
          </div>
          <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto">Your privacy is protected by cryptographic guarantees, not just obfuscation</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Security Layers */}
          <div className="space-y-4">
            <GlassCard className="bg-gradient-to-br from-violet-500/5 to-violet-500/10 border-violet-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-violet-300">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-violet-300">Nullifier-Based Double-Spend Prevention</h3>
                  <p className="text-sm text-gray-400">Each note can only be spent once. The nullifier hash uniquely identifies spent notes without revealing the note itself.</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 border-indigo-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-indigo-300">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-indigo-300">Zero-Knowledge Ownership Proofs</h3>
                  <p className="text-sm text-gray-400">Prove you own a note without revealing your spending key. Only valid key holders can generate correct proofs.</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-purple-300">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-purple-300">Poseidon Commitment Scheme</h3>
                  <p className="text-sm text-gray-400">Notes are hidden using Poseidon(amount, rho, rcm, spending_key). The commitment reveals nothing about the note contents.</p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-sm font-bold text-blue-300">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1 text-blue-300">Off-Chain Note Storage</h3>
                  <p className="text-sm text-gray-400">Note details (amount, rho, rcm) stored locally. On-chain state only contains commitments and nullifiers.</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Right: Security Diagram */}
          <GlassCard className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 p-6">
            <h3 className="text-lg font-semibold mb-4 text-center">Privacy Flow</h3>
            <div className="space-y-6">
              {/* Deposit */}
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">IN</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-green-300">Deposit</div>
                    <div className="text-xs text-gray-400">Public address -&gt; Shielded commitment</div>
                  </div>
                </div>
                <div className="ml-5 mt-2 pl-5 border-l-2 border-dashed border-gray-600 h-8"></div>
              </div>

              {/* Pool */}
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-violet-300">Shielded Pool</div>
                    <div className="text-xs text-gray-400">Funds mixed with other deposits</div>
                  </div>
                </div>
                <div className="ml-5 mt-2 pl-5 border-l-2 border-dashed border-gray-600 h-8"></div>
              </div>

              {/* Transfer */}
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">PRV</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-indigo-300">Private Transfer</div>
                    <div className="text-xs text-gray-400">Nullifier + new commitment only</div>
                  </div>
                </div>
                <div className="ml-5 mt-2 pl-5 border-l-2 border-dashed border-gray-600 h-8"></div>
              </div>

              {/* Withdraw */}
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold">OUT</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-blue-300">Withdraw</div>
                    <div className="text-xs text-gray-400">Exit to any public address</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-xs text-amber-300">
                <strong>Key Insight:</strong> On-chain observers cannot link deposits to withdrawals or determine transaction amounts in the shielded pool.
              </p>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Built on Starknet Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <GlassCard className="text-center p-6 sm:p-8 md:p-12">
          <img src={starknetLogo} alt="Starknet Logo" className="w-20 h-20 mx-auto mb-4 sm:mb-6" />
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">Built on Starknet</h2>
          <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Leveraging Cairo smart contracts and Starknet's native account abstraction for the most secure and private transfer experience.
          </p>
          <div className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white/5 border border-white/10 rounded-xl">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full" />
            <span className="text-xs sm:text-sm">Starknet Sepolia</span>
          </div>
        </GlassCard>
      </section>

      <Footer />
    </div>
  );
}
