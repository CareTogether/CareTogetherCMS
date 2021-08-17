import { atom, selector, useSetRecoilState } from "recoil";
import { PeopleClient } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";
import { currentOrganizationState, currentLocationState } from "./SessionModel";

// We're using the request ID pattern for query refresh:
// https://recoiljs.org/docs/guides/asynchronous-data-queries#query-refresh
const peopleRequestIDState = atom({
  key: 'peopleRequestIDState',
  default: 0
});

export const peopleData = selector({
  key: 'people',
  get: async ({get}) => {
    get(peopleRequestIDState); // Add request ID as a dependency to enable refresh
    const organizationId = get(currentOrganizationState);
    const locationId = get(currentLocationState);
    const peopleClient = new PeopleClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
    const dataResponse = await peopleClient.get(organizationId, locationId);
    return dataResponse;
  },
});

export function useRefreshPeople() {
  const set = useSetRecoilState(peopleRequestIDState);
  return () => {
    set(requestID => requestID + 1);
  };
}
