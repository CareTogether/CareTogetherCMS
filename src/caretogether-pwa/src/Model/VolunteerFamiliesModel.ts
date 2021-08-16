import { atom, selector, useSetRecoilState } from "recoil";
import { VolunteerFamiliesClient } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";
import { currentOrganizationState, currentLocationState } from "./SessionModel";

// We're using the request ID pattern for query refresh:
// https://recoiljs.org/docs/guides/asynchronous-data-queries#query-refresh
const volunteerFamiliesRequestIDState = atom({
  key: 'volunteerFamiliesRequestIDState',
  default: 0
});

export const volunteerFamiliesData = selector({
  key: 'volunteerFamilies',
  get: async ({get}) => {
    get(volunteerFamiliesRequestIDState); // Add request ID as a dependency to enable refresh
    const organizationId = get(currentOrganizationState);
    const locationId = get(currentLocationState);
    const volunteerFamiliesClient = new VolunteerFamiliesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
    const dataResponse = await volunteerFamiliesClient.listAllVolunteerFamilies(organizationId, locationId);
    return dataResponse;
  },
});

export function useRefreshVolunteerFamilies() {
  const set = useSetRecoilState(volunteerFamiliesRequestIDState);
  return () => {
    set(requestID => requestID + 1);
  };
}
