import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error caught by ErrorBoundary:', error, info?.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
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
            <button type="button" className="eb-btn" onClick={this.handleReload}>
              <RefreshCw size={15} /> Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
