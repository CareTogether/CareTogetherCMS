import { CommunicationsClient, ConfigurationClient, FilesClient, RecordsClient, UsersClient } from "../GeneratedClient";
import { authenticatingFetch } from "../Authentication/AuthenticatedHttp";

const usersClient = new UsersClient(process.env.REACT_APP_API_HOST, authenticatingFetch);

const configurationClient = new ConfigurationClient(process.env.REACT_APP_API_HOST, authenticatingFetch);

const recordsClient = new RecordsClient(process.env.REACT_APP_API_HOST, authenticatingFetch);

const filesClient = new FilesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);

const communicationsClient = new CommunicationsClient(process.env.REACT_APP_API_HOST, authenticatingFetch);

export const api = {
  users: usersClient,
  configuration: configurationClient,
  records: recordsClient,
  files: filesClient,
  communications: communicationsClient
};
