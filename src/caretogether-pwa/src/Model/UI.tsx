import { atom } from 'jotai';

export const reportSubmenuItemsAtom = atom<
  {
    label: string;
    isActive: boolean;
    onClick: () => void;
  }[]
>([]);
