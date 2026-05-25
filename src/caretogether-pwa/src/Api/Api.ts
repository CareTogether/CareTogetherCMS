import {
  CommunicationsClient,
  ConfigurationClient,
  FilesClient,
  RecordsClient,
  UsersClient,
} from '../GeneratedClient';
import { authenticatingFetch } from '../Authentication/AuthenticatedHttp';

const usersClient = new UsersClient(
  import.meta.env.VITE_APP_API_HOST,
  authenticatingFetch
);

const configurationClient = new ConfigurationClient(
  import.meta.env.VITE_APP_API_HOST,
  authenticatingFetch
);

const recordsClient = new RecordsClient(
  import.meta.env.VITE_APP_API_HOST,
  authenticatingFetch
);

const filesClient = new FilesClient(
  import.meta.env.VITE_APP_API_HOST,
  authenticatingFetch
);

const communicationsClient = new CommunicationsClient(
  import.meta.env.VITE_APP_API_HOST,
  authenticatingFetch
);

export const api = {
  users: usersClient,
  configuration: configurationClient,
  records: recordsClient,
  files: filesClient,
  communications: communicationsClient,
};
