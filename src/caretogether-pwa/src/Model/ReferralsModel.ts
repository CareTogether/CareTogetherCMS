import { atom, selector, useSetRecoilState } from "recoil";
import { ReferralsClient } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";

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
    const referralsClient = new ReferralsClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
    const dataResponse = await referralsClient.listAllReferrals("11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222");
    return dataResponse;
  },
});

export function useRefreshReferrals() {
  const set = useSetRecoilState(referralsRequestIDState);
  return () => {
    set(requestID => requestID + 1);
  };
}
