import { atom, selector, useSetRecoilState } from "recoil";
import { ReferralsClient } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";
import { currentOrganizationState, currentLocationState } from "./SessionModel";

// We're using the request ID pattern for query refresh:
// https://recoiljs.org/docs/guides/asynchronous-data-queries#query-refresh
const referralsRequestIDState = atom({
  key: 'referralsRequestIDState',
  default: 0
});

export const referralsData = selector({
  key: 'referrals',
  get: async ({get}) => {
    get(referralsRequestIDState); // Add request ID as a dependency to enable refresh
    const organizationId = get(currentOrganizationState);
    const locationId = get(currentLocationState);
    const referralsClient = new ReferralsClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
    const dataResponse = await referralsClient.listAllReferrals(organizationId, locationId);
    return dataResponse;
  },
});

export function useRefreshReferrals() {
  const set = useSetRecoilState(referralsRequestIDState);
  return () => {
    set(requestID => requestID + 1);
  };
}
