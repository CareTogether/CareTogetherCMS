import { useAppInsightsContext } from "@microsoft/applicationinsights-react-js";
import { useCallback } from "react";

const ignoreComponentsForConsole: string[] = [
  //"AuthenticationWrapper",
  //"LocationContext",
];

export function useScopedTrace(component: string) {
  const appInsights = useAppInsightsContext();

  return useCallback((message: string) => {
    if (!ignoreComponentsForConsole.includes(component)) {
      console.debug(`[${component}] ${message}`);
    }
    appInsights.trackTrace({
      message: message,
      properties: {
        "Component Name": component
      }
    });
  }, [ appInsights, component ]);
}
