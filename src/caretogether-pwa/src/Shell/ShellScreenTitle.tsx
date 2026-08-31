import { ReactNode, useEffect } from 'react';
import { atom, useSetAtom } from 'jotai';

export const screenTitleState = atom<string | null>(null);

export function useScreenTitle(title: string) {
  const setScreenTitle = useSetAtom(screenTitleState);
  useEffect(() => {
    setScreenTitle(title);
  }, [setScreenTitle, title]);
}

export const screenTitleComponentState = atom<ReactNode | null>(null);

export function useScreenTitleComponent(component: ReactNode) {
  const setScreenTitleComponent = useSetAtom(screenTitleComponentState);
  useEffect(() => {
    setScreenTitleComponent(component);

    // Clear the screen title component
    return () => setScreenTitleComponent(null);
  }, [setScreenTitleComponent, component]);
}
