import { atom, selector, useSetRecoilState } from "recoil";
import { VolunteerFamiliesClient } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";

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
    const volunteerFamiliesClient = new VolunteerFamiliesClient(process.env.REACT_APP_API_HOST, authenticatingFetch);
    const dataResponse = await volunteerFamiliesClient.listAllVolunteerFamilies("11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222");
    return dataResponse;
  },
});

export function useRefreshVolunteerFamilies() {
  const set = useSetRecoilState(volunteerFamiliesRequestIDState);
  return () => {
    set(requestID => requestID + 1);
  };
}
