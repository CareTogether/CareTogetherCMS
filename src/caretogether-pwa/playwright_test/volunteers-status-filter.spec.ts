import { expect, test } from '@playwright/test';
import {
  RoleApprovalStatus,
  type CombinedFamilyInfo,
} from '../src/GeneratedClient';
import { filterType } from '../src/Volunteers/VolunteerApprovalTab/filterType';
import type { filterOption } from '../src/Volunteers/VolunteerApprovalTab/filterOption';
import { familyOrFamilyMembersMeetRoleStatusFilterCriteria } from '../src/Volunteers/VolunteerApprovalTab/volunteerApprovalRoleStatusFilters';
import {
  gridFilterModelFromVolunteerFilters,
  volunteerFiltersFromGridFilterModel,
} from '../src/Volunteers/volunteersGridFilterAdapter';

const partnerRoleFilter: filterOption = {
  key: 'Partner',
  value: '1',
  selected: true,
  type: filterType.Family,
};

const approvedStatusFilter: filterOption = {
  key: 'Approved',
  value: RoleApprovalStatus.Approved.toString(),
  selected: true,
};

const prospectiveStatusFilter: filterOption = {
  key: 'Prospective',
  value: RoleApprovalStatus.Prospective.toString(),
  selected: false,
};

const statusFilters = [approvedStatusFilter, prospectiveStatusFilter];

function familyWithPartnerStatus(status: RoleApprovalStatus) {
  return {
    volunteerFamilyInfo: {
      familyRoleApprovals: {
        Partner: { currentStatus: status },
      },
    },
  } as CombinedFamilyInfo;
}

test('preserves the Status is-not operator through the controlled grid model', () => {
  const filters = volunteerFiltersFromGridFilterModel({
    items: [
      {
        field: 'status',
        operator: 'not',
        value: RoleApprovalStatus.Approved.toString(),
      },
    ],
  });

  const restoredModel = gridFilterModelFromVolunteerFilters(filters);

  expect(restoredModel.items).toContainEqual(
    expect.objectContaining({
      field: 'status',
      operator: 'not',
      value: RoleApprovalStatus.Approved.toString(),
    })
  );
});

test('Status is-not excludes matching families and retains other statuses', () => {
  const approvedFamily = familyWithPartnerStatus(RoleApprovalStatus.Approved);
  const prospectiveFamily = familyWithPartnerStatus(
    RoleApprovalStatus.Prospective
  );

  expect(
    familyOrFamilyMembersMeetRoleStatusFilterCriteria(
      approvedFamily,
      [partnerRoleFilter],
      statusFilters,
      'not'
    )
  ).toBe(false);
  expect(
    familyOrFamilyMembersMeetRoleStatusFilterCriteria(
      prospectiveFamily,
      [partnerRoleFilter],
      statusFilters,
      'not'
    )
  ).toBe(true);
});
