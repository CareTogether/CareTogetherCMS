import React from 'react';
import { appInsights } from './ApplicationInsightsService';
import posthog from 'posthog-js';

export class GlobalErrorBoundary extends React.Component<
  { children?: React.ReactNode },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { hasError: boolean; error: any }
> {
  constructor(props: object) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  componentDidCatch(error: any, errorInfo: any) {
    console.error(error);
    console.error(errorInfo);
    appInsights.trackEvent({
      name: 'ErrorScreen',
      properties: {
        error: JSON.stringify(error),
        errorInfo: JSON.stringify(errorInfo),
      },
    });
    posthog.capture('GlobalErrorBoundary', {
      error: error,
      errorInfo: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <h1 className="ph-unmask">Something went wrong.</h1>
          <pre className="ph-unmask" style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message
              ? this.state.error.message
              : JSON.stringify(this.state.error)}
          </pre>
        </>
      );
    }

    return this.props.children;
  }
}
