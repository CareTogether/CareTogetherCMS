import { atom, AtomEffect } from 'recoil';

// As in https://recoiljs.org/docs/guides/atom-effects/#local-storage-persistence
const localStorageEffect =
  <T,>(key: string): AtomEffect<T> =>
  ({ setSelf, onSet }) => {
    const savedValue = sessionStorage.getItem(key);
    if (savedValue != null) {
      setSelf(JSON.parse(savedValue));
    }

    onSet((newValue, _, isReset) => {
      isReset
        ? sessionStorage.removeItem(key)
        : sessionStorage.setItem(key, JSON.stringify(newValue));
    });
  };

export const familyScreenV2State = atom<boolean | undefined>({
  key: 'familyScreenV2State',
  default: undefined,
  effects: [localStorageEffect('familyScreenV2State')],
});
