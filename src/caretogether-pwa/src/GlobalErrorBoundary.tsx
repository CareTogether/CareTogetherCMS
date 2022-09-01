import React from "react";
import { appInsights } from "./ApplicationInsightsService";

export class GlobalErrorBoundary extends React.Component<
  { children?: React.ReactNode; },
  { hasError: boolean; error: any; }> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(error);
    console.error(errorInfo);
    appInsights.trackEvent({
      name: "ErrorScreen",
      properties: {
        'error': JSON.stringify(error),
        'errorInfo': JSON.stringify(errorInfo)
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <>
          <h1>Something went wrong.</h1>
          <pre style={{whiteSpace:'pre-wrap'}}>
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
