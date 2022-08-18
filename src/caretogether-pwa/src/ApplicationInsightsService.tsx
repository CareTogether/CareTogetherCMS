import { ApplicationInsights, ITelemetryItem } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { globalMsalInstance } from './Authentication/Auth';

var aiReactPlugin = new ReactPlugin();
var appInsights = new ApplicationInsights({
  config: {
    connectionString: process.env.REACT_APP_APPINSIGHTS_CONNECTIONSTRING,
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
    enableAjaxErrorStatusText: true,
    enableAjaxPerfTracking: true,
    extensions: [aiReactPlugin]
  }
});
appInsights.loadAppInsights();

appInsights.addTelemetryInitializer((env: ITelemetryItem) => {
  const activeAccount = globalMsalInstance.getActiveAccount();
  if (activeAccount) {
    env.tags = env.tags || [];
    env.tags["caretogether.userId"] = activeAccount.localAccountId;
  }
});

export { aiReactPlugin, appInsights };
