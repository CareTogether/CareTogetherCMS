import { atom } from 'recoil';

export const reportSubmenuItemsAtom = atom<
  {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }[]
>({
  key: 'reportSubmenuItems',
  default: [],
});
