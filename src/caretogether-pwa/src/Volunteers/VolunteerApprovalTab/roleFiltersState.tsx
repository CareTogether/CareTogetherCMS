import { atom } from 'jotai';
import { notAppliedLabel } from './catchAllLabel';
import { EffectiveLocationPolicy } from '../../GeneratedClient';
import { filterOption } from './filterOption';
import { filterType } from './filterType';

export function buildRoleFilters(policy: EffectiveLocationPolicy) {
  const familyRoles = [
    ...Object.keys(policy.volunteerPolicy?.volunteerFamilyRoles || {}),
  ];
  const individualRoles = [
    ...Object.keys(policy.volunteerPolicy?.volunteerRoles || {}),
  ];
  const combinedRoles = [notAppliedLabel, ...familyRoles, ...individualRoles];
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
}

export const roleFiltersState = atom<filterOption[] | null>(null);
