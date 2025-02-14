import { atom, selector } from 'recoil';
import { catchAllLabel } from './catchAllLabel';
import { filterOption } from './filterOption';
import { RoleApprovalStatus } from '../../GeneratedClient';

export const statusFiltersState = atom({
  key: 'statusFiltersState',
  default: selector({
    key: 'statusFiltersState/Default',
    get: () => {
      const options = [
        { key: catchAllLabel, value: 0 },
        {
          key: RoleApprovalStatus[RoleApprovalStatus.Prospective],
          value: RoleApprovalStatus.Prospective,
        },
        {
          key: RoleApprovalStatus[RoleApprovalStatus.Approved],
          value: RoleApprovalStatus.Approved,
        },
        {
          key: RoleApprovalStatus[RoleApprovalStatus.Onboarded],
          value: RoleApprovalStatus.Onboarded,
        },
        {
          key: RoleApprovalStatus[RoleApprovalStatus.Expired],
          value: RoleApprovalStatus.Expired,
        },
        {
          key: RoleApprovalStatus[RoleApprovalStatus.Inactive],
          value: RoleApprovalStatus.Inactive,
        },
        {
          key: RoleApprovalStatus[RoleApprovalStatus.Denied],
          value: RoleApprovalStatus.Denied,
        },
      ];
      const statusFilters: filterOption[] = options.map((option) => ({
        key: option.key,
        value: option.value.toString(),
        selected: false,
      }));
      return statusFilters;
    },
  }),
});
