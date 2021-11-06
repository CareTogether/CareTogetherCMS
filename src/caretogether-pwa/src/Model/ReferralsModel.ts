import { selector } from "recoil";
import { visibleFamiliesData } from "./ModelLoader";

export const partneringFamiliesData = selector({
  key: 'partneringFamiliesData',
  get: ({get}) => {
    const visibleFamilies = get(visibleFamiliesData);
    return visibleFamilies.filter(f => f.partneringFamilyInfo);
  }});
