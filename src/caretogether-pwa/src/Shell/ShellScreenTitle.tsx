import { atom, useSetRecoilState } from "recoil";

export const screenTitleState = atom({
  key: 'screenTitleState',
  default: "CareTogether"
});

export default function useScreenTitle(title: string) {
  const setScreenTitle = useSetRecoilState(screenTitleState);
  setScreenTitle(title);
}
