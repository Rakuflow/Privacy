import React, { Component, ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { GlowButton } from './GlowButton';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Global Error Boundary
 * Catches React errors and prevents app crashes
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-gray-900/95 backdrop-blur-xl border border-red-500/20 rounded-xl p-8 text-center">
              {/* Icon */}
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500/30">
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-white mb-3">Oops! Something went wrong</h1>

              {/* Description */}
              <p className="text-gray-400 mb-6">The application encountered an unexpected error. Please try refreshing the page.</p>

              {/* Error Details (dev only) */}
              {/* {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-black/50 border border-red-500/20 rounded-lg text-left">
                  <p className="text-xs font-mono text-red-300 break-all">
                    {this.state.error.message}
                  </p>
                </div>
              )} */}

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <GlowButton onClick={this.handleReset} className="w-full">
                  Try Again
                </GlowButton>
                <button onClick={() => window.location.reload()} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors">
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
