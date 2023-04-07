import { selector } from "recoil";
import { CommunicationsClient, ConfigurationClient, FilesClient, RecordsClient, UsersClient } from "../GeneratedClient";
import { accessTokenFetchQuery, authenticatingFetch } from "../Authentication/AuthenticatedHttp";

export const usersClientQuery = selector({
  key: 'usersClient',
  get: ({get}) => {
    const accessTokenFetch = get(accessTokenFetchQuery);
    return new UsersClient(process.env.REACT_APP_API_HOST, accessTokenFetch);
  }
});

export const configurationClientQuery = selector({
  key: 'configurationClient',
  get: ({get}) => {
    const accessTokenFetch = get(accessTokenFetchQuery);
    return new ConfigurationClient(process.env.REACT_APP_API_HOST, accessTokenFetch);
  }
});

export const recordsClientQuery = selector({
  key: 'directoryClientQuery',
  get: ({get}) => {
    const accessTokenFetch = get(accessTokenFetchQuery);
    return new RecordsClient(process.env.REACT_APP_API_HOST, accessTokenFetch);
  }
});

export const filesClient = new FilesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);

export const communicationsClient = new CommunicationsClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
