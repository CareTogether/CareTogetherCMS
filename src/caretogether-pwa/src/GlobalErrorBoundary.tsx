import React from 'react';
import { appInsights } from './ApplicationInsightsService';
import posthog from 'posthog-js';
import { getAppVersion } from './Utilities/appVersion';

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
        app_version: getAppVersion(),
      },
    });
    posthog.captureException(error, {
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ph-unmask">
          <h1>Something went wrong.</h1>
          <p style={{ fontSize: '0.8rem', color: '#666', margin: '0.5rem 0' }}>
            Version: {getAppVersion()}
          </p>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.message
              ? this.state.error.message
              : JSON.stringify(this.state.error)}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}
