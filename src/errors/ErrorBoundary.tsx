import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import './error.css';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('WebOS Subsystem Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="os-error-boundary-fallback" role="alert">
          <AlertTriangle size={28} color="#ef4444" />
          <div className="os-error-boundary-title">
            {this.props.fallbackTitle || 'A component encountered an issue'}
          </div>
          <div className="os-error-boundary-msg">
            {this.state.error?.message || 'An unexpected error occurred during rendering.'}
          </div>
          <button className="os-error-retry-btn" onClick={this.handleReset}>
            <RefreshCw size={13} style={{ display: 'inline', marginRight: 6 }} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
