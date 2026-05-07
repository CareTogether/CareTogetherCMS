import { atom, selector } from 'recoil';
import { notAppliedLabel } from './catchAllLabel';
import { policyData } from '../../Model/ConfigurationModel';
import { filterOption } from './filterOption';
import { filterType } from './filterType';

export const roleFiltersState = atom({
  key: 'newRoleFiltersState',
  default: selector({
    key: 'newRoleFiltersState/Default',
    get: ({ get }) => {
      const policy = get(policyData);
      const familyRoles = [
        ...Object.keys(policy.volunteerPolicy?.volunteerFamilyRoles || {}),
      ];
      const individualRoles = [
        ...Object.keys(policy.volunteerPolicy?.volunteerRoles || {}),
      ];
      const combinedRoles = [
        notAppliedLabel,
        ...familyRoles,
        ...individualRoles,
      ];
      const roleFilters: filterOption[] = [];
      for (let i = 0; i < combinedRoles.length; i++) {
        const isIndividualRole = i >= familyRoles.length + 1;
        const roleType = isIndividualRole
          ? filterType.Individual
          : combinedRoles[i] === notAppliedLabel
            ? undefined
            : filterType.Family;
        roleFilters.push({
          key: combinedRoles[i],
          value: i.toString(),
          selected: false,
          type: roleType,
        });
      }
      return roleFilters;
    },
  }),
});
