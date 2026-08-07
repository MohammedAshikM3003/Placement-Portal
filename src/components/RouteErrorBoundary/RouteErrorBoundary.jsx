import React from 'react';
import styles from './RouteErrorBoundary.module.css';

/**
 * Error Boundary Component to catch errors during lazy loading
 * Prevents navigation from getting stuck due to failed component loads
 */
class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('❌ Route Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });

    // Auto-reload once if the error is a ChunkLoadError or CSS/JS chunk load failure
    const isChunkLoadError = 
      error?.name === 'ChunkLoadError' || 
      /Loading (CSS|chunk)/i.test(error?.message || '');

    if (isChunkLoadError) {
      const chunkFailedKey = 'last_chunk_load_reload';
      const lastReload = sessionStorage.getItem(chunkFailedKey);
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
        sessionStorage.setItem(chunkFailedKey, now.toString());
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    // Clear error state and try to reload
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoBack = () => {
    // Navigate back to previous page
    window.history.back();
  };

  handleGoHome = () => {
    // Navigate to home page
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorCard}>
            <div className={styles.iconWrapper}>
              <svg 
                className={styles.errorIcon} 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
              >
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="currentColor"/>
              </svg>
            </div>

            <h2 className={styles.title}>Oops! Something went wrong</h2>
            <p className={styles.message}>
              {this.state.error?.message || 'Failed to load this page. This might be due to a network issue or a temporary problem.'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className={styles.errorDetails}>
                <summary>Error Details (Development Only)</summary>
                <pre className={styles.errorStack}>
                  {this.state.error?.stack}
                </pre>
                <pre className={styles.errorInfo}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className={styles.buttonGroup}>
              <button 
                className={styles.primaryButton}
                onClick={this.handleReload}
              >
                🔄 Reload Page
              </button>
              <button 
                className={styles.secondaryButton}
                onClick={this.handleGoBack}
              >
                ← Go Back
              </button>
              <button 
                className={styles.secondaryButton}
                onClick={this.handleGoHome}
              >
                🏠 Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default RouteErrorBoundary;
