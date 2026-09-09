import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertOctagon, RotateCw } from 'lucide-react';
import './error.css';

interface WindowErrorBoundaryProps {
  appTitle: string;
  children: ReactNode;
}

interface WindowErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class WindowErrorBoundary extends Component<WindowErrorBoundaryProps, WindowErrorBoundaryState> {
  constructor(props: WindowErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): WindowErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`Window [${this.props.appTitle}] crashed:`, error, errorInfo);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="os-error-boundary-fallback" role="alert">
          <AlertOctagon size={32} color="#f43f5e" />
          <div className="os-error-boundary-title">{this.props.appTitle} crashed</div>
          <div className="os-error-boundary-msg">
            {this.state.error?.message || 'The application window encountered an unhandled exception.'}
          </div>
          <button className="os-error-retry-btn" onClick={this.handleRestart}>
            <RotateCw size={13} style={{ display: 'inline', marginRight: 6 }} />
            Relaunch Window Content
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
