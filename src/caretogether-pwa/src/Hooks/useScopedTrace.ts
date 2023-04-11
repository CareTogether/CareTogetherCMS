import { useAppInsightsContext } from "@microsoft/applicationinsights-react-js";
import { useCallback } from "react";

export function useScopedTrace(component: string) {
  const appInsights = useAppInsightsContext();

  return useCallback((message: string) => {
    console.debug(`[${component}] ${message}`);
    appInsights.trackTrace({
      message: message,
      properties: {
        "Component Name": component
      }
    });
  }, [ appInsights, component ]);
}
