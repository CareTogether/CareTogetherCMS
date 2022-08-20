import { useAppInsightsContext } from "@microsoft/applicationinsights-react-js";

export function useScopedTrace(component: string) {
  const appInsights = useAppInsightsContext();

  return (message: string) => {
    console.debug(`[${component}] ${message}`);
    appInsights.trackTrace({
      message: message,
      properties: {
        "Component Name": component
      }
    });
  }
}
