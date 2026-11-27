import type { CombinedFamilyInfo } from '../GeneratedClient';
import type { IndividualVolunteerContext } from '../Requirements/RequirementContext';
import type { BuildApprovalLedgerRowsInput } from './approvalLedgerViewModel';

/**
 * The approval ledger input for a family: the family's own requirements plus
 * one source per active adult. Shared by the family screen and the dashboard
 * so both show the same approval rows.
 */
export function familyApprovalLedgerInput(
  family: CombinedFamilyInfo | undefined,
  familyId: string
) {
  const volunteerFamilyInfo = family?.volunteerFamilyInfo;
  const activeAdults = (family?.family?.adults ?? []).flatMap((adult) =>
    adult.item1?.id && adult.item1.active ? [adult.item1] : []
  );

  const individuals = Object.entries(
    volunteerFamilyInfo?.individualVolunteers ?? {}
  ).flatMap(([personId, volunteerInfo]) => {
    const person = activeAdults.find((adult) => adult.id === personId);
    if (!person) return [];

    const label =
      [person.firstName, person.lastName].filter(Boolean).join(' ') || 'Adult';
    const context: IndividualVolunteerContext = {
      kind: 'Individual Volunteer',
      volunteerFamilyId: familyId,
      personId,
    };

    return [
      {
        id: personId,
        label,
        context,
        subject: { scope: 'person' as const, id: personId, label },
        approvalStatusByRole: volunteerInfo.approvalStatusByRole ?? {},
        roleRemovals: volunteerInfo.roleRemovals ?? [],
        completedRequirements: volunteerInfo.completedRequirements ?? [],
        exemptedRequirements: volunteerInfo.exemptedRequirements ?? [],
        missingRequirements: volunteerInfo.missingRequirements ?? [],
        missingOptionalRequirements:
          volunteerInfo.missingOptionalRequirements ?? [],
        availableApplications: volunteerInfo.availableApplications ?? [],
      },
    ];
  });

  return {
    family: {
      context: {
        kind: 'Volunteer Family' as const,
        volunteerFamilyId: familyId,
      },
      completedRequirements: volunteerFamilyInfo?.completedRequirements ?? [],
      exemptedRequirements: volunteerFamilyInfo?.exemptedRequirements ?? [],
      missingRequirements: volunteerFamilyInfo?.missingRequirements ?? [],
      missingOptionalRequirements:
        volunteerFamilyInfo?.missingOptionalRequirements ?? [],
      availableApplications: volunteerFamilyInfo?.availableApplications ?? [],
      familyRoleApprovals: volunteerFamilyInfo?.familyRoleApprovals ?? {},
      roleRemovals: volunteerFamilyInfo?.roleRemovals ?? [],
    },
    individuals,
  } satisfies BuildApprovalLedgerRowsInput;
}
