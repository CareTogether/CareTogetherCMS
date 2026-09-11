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

const hostFamilyRoleFilter: filterOption = {
  key: 'Host Family',
  value: '2',
  selected: true,
  type: filterType.Family,
};

const unselectedPartnerRoleFilter = {
  ...partnerRoleFilter,
  selected: false,
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
const unselectedStatusFilters = statusFilters.map((statusFilter) => ({
  ...statusFilter,
  selected: false,
}));

function familyWithRoleStatus(role: string, status: RoleApprovalStatus) {
  return {
    volunteerFamilyInfo: {
      familyRoleApprovals: {
        [role]: { currentStatus: status },
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

test('preserves the Roles is-not operator through the controlled grid model', () => {
  const filters = volunteerFiltersFromGridFilterModel({
    items: [
      {
        field: 'roles',
        operator: 'not',
        value: partnerRoleFilter.value,
      },
    ],
  });

  const restoredModel = gridFilterModelFromVolunteerFilters(filters);

  expect(restoredModel.items).toContainEqual(
    expect.objectContaining({
      field: 'roles',
      operator: 'not',
      value: partnerRoleFilter.value,
    })
  );
});

test('Status is-not excludes matching families and retains other statuses', () => {
  const approvedFamily = familyWithRoleStatus(
    'Partner',
    RoleApprovalStatus.Approved
  );
  const prospectiveFamily = familyWithRoleStatus(
    'Partner',
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

test('Roles is-not excludes Host Family and retains families with other roles', () => {
  const hostFamily = familyWithRoleStatus(
    'Host Family',
    RoleApprovalStatus.Approved
  );
  const partnerFamily = familyWithRoleStatus(
    'Partner',
    RoleApprovalStatus.Approved
  );
  const hostAndPartnerFamily = {
    volunteerFamilyInfo: {
      familyRoleApprovals: {
        'Host Family': { currentStatus: RoleApprovalStatus.Approved },
        Partner: { currentStatus: RoleApprovalStatus.Prospective },
      },
    },
  } as CombinedFamilyInfo;
  const prospectiveHostFamily = familyWithRoleStatus(
    'Host Family',
    RoleApprovalStatus.Prospective
  );
  const roleFilters = [hostFamilyRoleFilter, unselectedPartnerRoleFilter];

  expect(
    familyOrFamilyMembersMeetRoleStatusFilterCriteria(
      hostFamily,
      roleFilters,
      unselectedStatusFilters,
      'isAnyOf',
      'not'
    )
  ).toBe(false);
  expect(
    familyOrFamilyMembersMeetRoleStatusFilterCriteria(
      partnerFamily,
      roleFilters,
      unselectedStatusFilters,
      'isAnyOf',
      'not'
    )
  ).toBe(true);
  expect(
    familyOrFamilyMembersMeetRoleStatusFilterCriteria(
      hostAndPartnerFamily,
      roleFilters,
      unselectedStatusFilters,
      'isAnyOf',
      'not'
    )
  ).toBe(false);
  expect(
    familyOrFamilyMembersMeetRoleStatusFilterCriteria(
      prospectiveHostFamily,
      roleFilters,
      unselectedStatusFilters,
      'isAnyOf',
      'not'
    )
  ).toBe(false);
});

test('Roles is-not retains seeded families with an un-applied Host Family entry', () => {
  const familyCoachRoleFilter: filterOption = {
    key: 'Family Coach',
    value: '3',
    selected: false,
    type: filterType.Individual,
  };
  const familyFriendRoleFilter: filterOption = {
    key: 'Family Friend',
    value: '4',
    selected: false,
    type: filterType.Individual,
  };
  const coachworthyFamily = {
    volunteerFamilyInfo: {
      familyRoleApprovals: {
        'Host Family': { currentStatus: null },
      },
      individualVolunteers: {
        emily: {
          approvalStatusByRole: {
            'Family Coach': { currentStatus: RoleApprovalStatus.Approved },
          },
        },
      },
    },
  } as CombinedFamilyInfo;
  const skywalkerFamily = {
    volunteerFamilyInfo: {
      familyRoleApprovals: {
        'Host Family': { currentStatus: null },
      },
      individualVolunteers: {
        leia: {
          approvalStatusByRole: {
            'Family Friend': { currentStatus: RoleApprovalStatus.Prospective },
          },
        },
      },
    },
  } as CombinedFamilyInfo;
  const roleFilters = [
    hostFamilyRoleFilter,
    familyCoachRoleFilter,
    familyFriendRoleFilter,
  ];

  expect(
    familyOrFamilyMembersMeetRoleStatusFilterCriteria(
      coachworthyFamily,
      roleFilters,
      unselectedStatusFilters,
      'isAnyOf',
      'not'
    )
  ).toBe(true);
  expect(
    familyOrFamilyMembersMeetRoleStatusFilterCriteria(
      skywalkerFamily,
      roleFilters,
      unselectedStatusFilters,
      'isAnyOf',
      'not'
    )
  ).toBe(true);
});
