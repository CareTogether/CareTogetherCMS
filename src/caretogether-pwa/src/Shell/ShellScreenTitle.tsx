import { atom, useSetRecoilState } from "recoil";

export const screenTitleState = atom<string | null>({
  key: 'screenTitleState',
  default: null
});

export default function useScreenTitle(title: string) {
  const setScreenTitle = useSetRecoilState(screenTitleState);
  setScreenTitle(title);
}
