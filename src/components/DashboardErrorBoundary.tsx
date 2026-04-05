import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  hasError: boolean;
}

export class DashboardErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Keep this local to avoid noisy user-facing failures.
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#050c18' }}>
          <div className="max-w-md w-full rounded-2xl p-6 text-center" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)' }}>
            <h2 className="text-white text-lg font-bold mb-2">Something went wrong in the dashboard</h2>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.65)' }}>
              Reload the page to continue where you left off.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
