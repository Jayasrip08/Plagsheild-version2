import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error caught by ErrorBoundary:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleResetSession = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="eb-screen">
          <div className="eb-card">
            <div className="eb-icon">
              <AlertTriangle size={26} />
            </div>
            <h2>Something went wrong</h2>
            <p>
              This page hit an unexpected error and couldn't render. Your data is safe —
              reloading usually fixes this.
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button type="button" className="eb-btn" onClick={this.handleReload}>
                <RefreshCw size={15} /> Reload Page
              </button>
              <button
                type="button"
                className="eb-btn"
                style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1' }}
                onClick={this.handleResetSession}
              >
                Sign Out & Reset
              </button>
            </div>
            {this.state.error?.message && (
              <details style={{ marginTop: 16, textAlign: 'left', fontSize: 12, color: '#64748b' }}>
                <summary style={{ cursor: 'pointer', marginBottom: 6, fontWeight: 500 }}>Technical details</summary>
                <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: '#f8fafc', border: '1px solid #e2e8f0', padding: 8, borderRadius: 6, fontSize: 11, fontFamily: 'monospace' }}>
                  {this.state.error.message}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
