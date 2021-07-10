import { atom, selector, useSetRecoilState } from "recoil";
import { PeopleClient } from "../GeneratedClient";
import { authenticatingFetch } from "../Auth";

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
    const peopleClient = new PeopleClient("https://localhost:44359", authenticatingFetch);
    const dataResponse = await peopleClient.get("11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222");
    return dataResponse;
  },
});

export function useRefreshPeople() {
  const set = useSetRecoilState(peopleRequestIDState);
  return () => {
    set(requestID => requestID + 1);
  };
}
