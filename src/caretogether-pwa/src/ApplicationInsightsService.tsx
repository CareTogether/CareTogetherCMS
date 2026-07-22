import {
  ApplicationInsights,
  ITelemetryItem,
} from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { globalMsalInstance } from './Authentication/Auth';

const aiReactPlugin = new ReactPlugin();
const appInsightsConnectionString = import.meta.env
  .VITE_APP_APPINSIGHTS_CONNECTIONSTRING;
const appInsightsEnabled = Boolean(appInsightsConnectionString?.trim());
const configuredAppInsights = new ApplicationInsights({
  config: {
    connectionString: appInsightsConnectionString,
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
    enableAjaxErrorStatusText: true,
    enableAjaxPerfTracking: true,
    // From
    // https://learn.microsoft.com/en-us/azure/azure-monitor/app/javascript-sdk-configuration?tabs=javascriptwebsdkloaderscript#enable-w3c-distributed-tracing-support
    //
    // If the XMLHttpRequest or Fetch Ajax requests are sent to a different
    // domain host, including subdomains, the correlation headers aren't
    // included by default. To enable this feature, set the
    // enableCorsCorrelation configuration field to true. If you set
    // enableCorsCorrelation to true, all XMLHttpRequest and Fetch Ajax requests
    // include the correlation headers. As a result, if the application on the
    // server that is being called doesn't support the traceparent header, the
    // request might fail, depending on whether the browser / version can
    // validate the request based on which headers the server accepts. You can
    // use the correlationHeaderExcludedDomains configuration field to exclude
    // the server's domain from cross-component correlation header injection.
    // For example, you can use correlationHeaderExcludedDomains:
    // ['*.auth0.com'] to exclude correlation headers from requests sent to the
    // Auth0 identity provider.
    correlationHeaderExcludedDomains: [
      'localhost',
      '127.0.0.1',
      '*.featurebase.app',
      'do.featurebase.app',
      'featurebase.app',
    ],
    extensions: [aiReactPlugin],
  },
});

if (appInsightsEnabled) {
  configuredAppInsights.loadAppInsights();

  configuredAppInsights.addTelemetryInitializer((env: ITelemetryItem) => {
    const activeAccount = globalMsalInstance.getActiveAccount();
    if (activeAccount) {
      env.tags = env.tags || [];
      env.tags['caretogether.userId'] = activeAccount.localAccountId;
    }
  });
}

const appInsights = appInsightsEnabled
  ? configuredAppInsights
  : {
      trackEvent: () => undefined,
      trackTrace: () => undefined,
    };

export { aiReactPlugin, appInsights };
