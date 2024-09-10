import { RecoilValue, useRecoilValueLoadable } from 'recoil';

export function useLoadable<T>(value: RecoilValue<T | null>) {
  const loadableValue = useRecoilValueLoadable(value);
  if (loadableValue.state === 'hasValue' && loadableValue.contents !== null) {
    return loadableValue.contents;
  } else if (loadableValue.state === 'hasError') {
    throw loadableValue.contents;
  } else {
    return null;
  }
}
