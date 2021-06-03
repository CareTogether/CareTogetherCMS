import { ApplicationInsights } from '@microsoft/applicationinsights-web'
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';
import { createBrowserHistory } from 'history';

const browserHistory = createBrowserHistory({ basename: '' });
const aiReact = new ReactPlugin();
const appInsights = new ApplicationInsights({ config: {
  connectionString: process.env.REACT_APP_APPINSIGHTS_CONNECTIONSTRING,
  extensions: [aiReact],
    extensionConfig: {
      [aiReact.identifier]: { history: browserHistory }
  }
}});
appInsights.loadAppInsights();
export { aiReact, appInsights };
