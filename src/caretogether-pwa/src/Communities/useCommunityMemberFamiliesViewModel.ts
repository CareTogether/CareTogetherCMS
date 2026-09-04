import { useMemo } from 'react';
import type {
  CombinedFamilyInfo,
  CommunityInfo,
  EmailAddress,
  Person,
  PhoneNumber,
} from '../GeneratedClient';
import { Permission } from '../GeneratedClient';
import { useVisibleFamilies } from '../Model/Data';
import { useCommunityPermissions } from '../Model/SessionModel';
import {
  adultApprovalRows,
  adultsFor,
  buildCommunityMemberFamilies,
  canViewFamilyContactInfo,
  emailAddressesFor,
  familyApprovalRows,
  isPrimaryFamilyContact,
  phoneNumbersFor,
  type CommunityMemberFamilyApprovalRow,
} from './communityMemberFamiliesModel';

export type CommunityMemberFamilyAdultRow = {
  approvalRows: CommunityMemberFamilyApprovalRow[];
  emailAddresses: EmailAddress[];
  isPrimaryContact: boolean;
  person: Person | undefined;
  phoneNumbers: PhoneNumber[];
  rowKey: string;
};

export type CommunityMemberFamilyRow = {
  adultRows: CommunityMemberFamilyAdultRow[];
  approvalRows: CommunityMemberFamilyApprovalRow[];
  canViewContactInfo: boolean;
  family: CombinedFamilyInfo;
  familyId: string;
};

export type CommunityMemberFamiliesViewModel = {
  canEditMemberFamilies: boolean;
  community: NonNullable<CommunityInfo['community']>;
  memberFamilyRows: CommunityMemberFamilyRow[];
};

export function useCommunityMemberFamiliesViewModel(
  communityInfo: CommunityInfo
): CommunityMemberFamiliesViewModel {
  const permissions = useCommunityPermissions(communityInfo);
  const visibleFamilies = useVisibleFamilies();
  const community = communityInfo.community!;
  const canEditMemberFamilies = permissions(
    Permission.EditCommunityMemberFamilies
  );
  const communityCanViewContactInfo = permissions(
    Permission.ViewPersonContactInfo
  );

  const memberFamilyRows = useMemo(
    () =>
      buildCommunityMemberFamilies(
        community?.memberFamilies,
        visibleFamilies
      ).map((family) => {
        const familyId = family.family!.id!;
        const canViewContactInfo = canViewFamilyContactInfo(
          family,
          communityCanViewContactInfo
        );
        const adultRows = adultsFor(family).map((adult) => {
          const person = adult?.item1;

          return {
            approvalRows: adultApprovalRows(family, person),
            emailAddresses: emailAddressesFor(person),
            isPrimaryContact: person
              ? isPrimaryFamilyContact(family, person)
              : false,
            person,
            phoneNumbers: phoneNumbersFor(person),
            rowKey: `${familyId}-${person?.id || 'no-adults'}`,
          };
        });

        return {
          adultRows,
          approvalRows: familyApprovalRows(family),
          canViewContactInfo,
          family,
          familyId,
        };
      }),
    [community?.memberFamilies, communityCanViewContactInfo, visibleFamilies]
  );

  return {
    canEditMemberFamilies,
    community,
    memberFamilyRows,
  };
}
