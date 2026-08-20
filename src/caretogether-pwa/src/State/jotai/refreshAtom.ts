import { atom, type PrimitiveAtom } from 'jotai';

export function createRefreshTokenAtom() {
  return atom(0);
}

export function createRefreshAtom(refreshTokenAtom: PrimitiveAtom<number>) {
  return atom(null, (_get, set) => {
    set(refreshTokenAtom, (current) => current + 1);
  });
}
