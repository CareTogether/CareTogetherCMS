import { ReactNode, useEffect } from 'react';
import { atom, useSetRecoilState } from 'recoil';

export const screenTitleState = atom<string | null>({
  key: 'screenTitleState',
  default: null,
});

export function useScreenTitle(title: string) {
  const setScreenTitle = useSetRecoilState(screenTitleState);
  useEffect(() => {
    setScreenTitle(title);
  }, [setScreenTitle, title]);
}

export const screenTitleComponentState = atom<ReactNode | null>({
  key: 'screenTitleComponentState',
  default: null,
});

export function useScreenTitleComponent(component: ReactNode) {
  const setScreenTitleComponent = useSetRecoilState(screenTitleComponentState);
  useEffect(() => {
    setScreenTitleComponent(component);

    // Clear the screen title component
    return () => setScreenTitleComponent(null);
  }, [setScreenTitleComponent, component]);
}
