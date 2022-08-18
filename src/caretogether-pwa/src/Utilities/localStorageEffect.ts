import { AtomEffect } from "recoil";

// Source: https://recoiljs.org/docs/guides/atom-effects#local-storage-persistence
export const localStorageEffect: <T>(key: string) => AtomEffect<T> = key => ({ setSelf, onSet }) => {
  const savedValue = localStorage.getItem(key);
  if (savedValue != null) {
    setSelf(JSON.parse(savedValue));
  }
  onSet((newValue, _, isReset) => {
    isReset
      ? localStorage.removeItem(key)
      : localStorage.setItem(key, JSON.stringify(newValue));
  });
};
