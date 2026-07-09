'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

// Catches client-side render errors and shows a friendly message
// instead of a blank white page. Useful for debugging hydration issues.
export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[GlobalErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050508] text-white flex items-center justify-center p-6">
          <div className="glass rounded-3xl p-8 max-w-lg w-full border border-red-500/30">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold mb-3">Une erreur est survenue</h1>
            <p className="text-gray-400 text-sm mb-6">
              Le tableau de bord n&apos;a pas pu se charger correctement. Essayez de rafraîchir la page
              (Ctrl+Shift+R pour ignorer le cache).
            </p>
            {this.state.error && (
              <pre className="text-xs bg-black/40 rounded-lg p-3 mb-6 overflow-auto max-h-40 text-red-300 border border-red-500/20">
                {this.state.error.message}
                {this.state.error.stack?.slice(0, 500)}
              </pre>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-500 to-violet-600 hover:scale-[1.02] transition-transform"
              >
                Rafraîchir la page
              </button>
              <a
                href="/"
                className="flex-1 py-3 rounded-xl font-semibold text-sm glass border border-white/10 hover:bg-white/10 text-center"
              >
                Retour à l&apos;accueil
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
