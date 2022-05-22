import { CombinedFamilyInfo } from "../../GeneratedClient";
import { simplify } from "../../Utilities/stringUtils";

export function familyLastName(family: CombinedFamilyInfo) {
    return family.family!.adults?.filter(adult => family.family!.primaryFamilyContactPersonId === adult.item1?.id)[0]?.item1?.lastName || "";
}

export function filterFamiliesByText(families : CombinedFamilyInfo[], inputText: string) {
    return families.filter(family => inputText.length === 0 ||
        family.family?.adults?.some(adult => simplify(`${adult.item1?.firstName} ${adult.item1?.lastName}`).includes(inputText.toLowerCase())) ||
        family.family?.children?.some(child => simplify(`${child?.firstName} ${child?.lastName}`).includes(inputText.toLowerCase())));
}

export function sortFamiliesByLastNameDesc(families : CombinedFamilyInfo[]) {
    return families.map(x => x).sort((a, b) =>
    familyLastName(a) < familyLastName(b) ? -1 : familyLastName(a) > familyLastName(b) ? 1 : 0);
}