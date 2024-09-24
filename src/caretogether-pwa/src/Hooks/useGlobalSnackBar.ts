import { atom, useRecoilState } from 'recoil';

export const showGlobalSnackBar = atom<string | null>({
  key: 'showGlobalSnackBar',
  default: null,
});

export function useGlobalSnackBar() {
  const [message, set] = useRecoilState(showGlobalSnackBar);

  return {
    message,
    setAndShowGlobalSnackBar: (value: string) => {
      set(value);
    },
    resetSnackBar: () => {
      set(null);
    },
  };
}
