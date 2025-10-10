import { Component } from 'react';
import { logDebugEvent } from '../utils/debug.js';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    logDebugEvent('error', {
      message: error?.message,
      stack: error?.stack,
      info,
    });
    if (this.props.onError) {
      this.props.onError(error, info);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      const message = this.props.fallbackMessage || 'Something went wrong.';
      return (
        <div className="error-boundary" role="alert">
          <h2>{message}</h2>
          <pre className="error-details">
            {this.state.error?.message || 'Unexpected error'}
          </pre>
          <button type="button" onClick={this.handleReset}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
