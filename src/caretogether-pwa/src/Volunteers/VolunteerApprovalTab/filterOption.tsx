import { filterType } from './filterType';

export type filterOption = {
  key: string;
  value: string | undefined;
  type?: filterType | undefined;
  selected: boolean;
};
