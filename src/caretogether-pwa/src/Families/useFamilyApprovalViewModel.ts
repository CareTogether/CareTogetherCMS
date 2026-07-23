import { useMemo } from 'react';
import { CombinedFamilyInfo } from '../GeneratedClient';
import { IndividualVolunteerContext } from '../Requirements/RequirementContext';
import { buildApprovalLedgerRows } from './approvalLedgerViewModel';
import {
  buildRemovedRoleSummaries,
  buildRoleSummaryCards,
} from './roleSummaryViewModel';

type UseFamilyApprovalViewModelParameters = {
  family?: CombinedFamilyInfo;
  familyId: string;
  selectedRemovedRoleId: string | null;
  selectedRoleSummaryCardId: string | null;
};

export function useFamilyApprovalViewModel({
  family,
  familyId,
  selectedRemovedRoleId,
  selectedRoleSummaryCardId,
}: UseFamilyApprovalViewModelParameters) {
  const volunteerFamilyInfo = family?.volunteerFamilyInfo;

  const activeAdultApprovalSources = useMemo(() => {
    const activeAdultIds = new Set(
      (family?.family?.adults ?? []).flatMap((adult) =>
        adult.item1?.id && adult.item1.active ? [adult.item1.id] : []
      )
    );
    const adultApprovalSources = Object.entries(
      volunteerFamilyInfo?.individualVolunteers ?? {}
    )
      .filter(([personId]) => activeAdultIds.has(personId))
      .map(([personId, volunteerInfo]) => {
        const adult = family?.family?.adults?.find(
          (familyAdult) => familyAdult.item1?.id === personId
        );
        const person = adult?.item1;

        const label =
          [person?.firstName, person?.lastName].filter(Boolean).join(' ') ||
          'Adult';
        const context: IndividualVolunteerContext = {
          kind: 'Individual Volunteer',
          volunteerFamilyId: familyId,
          personId,
        };

        return {
          id: personId,
          label,
          context,
          subject: {
            scope: 'person' as const,
            id: personId,
            label,
          },
          approvalStatusByRole: volunteerInfo.approvalStatusByRole ?? {},
          roleRemovals: volunteerInfo.roleRemovals ?? [],
          completedRequirements: volunteerInfo.completedRequirements ?? [],
          exemptedRequirements: volunteerInfo.exemptedRequirements ?? [],
          missingRequirements: volunteerInfo.missingRequirements ?? [],
          availableApplications: volunteerInfo.availableApplications ?? [],
        };
      });

    return adultApprovalSources;
  }, [
    family?.family?.adults,
    familyId,
    volunteerFamilyInfo?.individualVolunteers,
  ]);

  const approvalLedgerRows = useMemo(() => {
    return buildApprovalLedgerRows({
      family: {
        context: {
          kind: 'Volunteer Family',
          volunteerFamilyId: familyId,
        },
        completedRequirements: volunteerFamilyInfo?.completedRequirements ?? [],
        exemptedRequirements: volunteerFamilyInfo?.exemptedRequirements ?? [],
        missingRequirements: volunteerFamilyInfo?.missingRequirements ?? [],
        availableApplications: volunteerFamilyInfo?.availableApplications ?? [],
        familyRoleApprovals: volunteerFamilyInfo?.familyRoleApprovals ?? {},
        roleRemovals: volunteerFamilyInfo?.roleRemovals ?? [],
      },
      individuals: activeAdultApprovalSources,
    });
  }, [
    activeAdultApprovalSources,
    familyId,
    volunteerFamilyInfo?.availableApplications,
    volunteerFamilyInfo?.completedRequirements,
    volunteerFamilyInfo?.exemptedRequirements,
    volunteerFamilyInfo?.familyRoleApprovals,
    volunteerFamilyInfo?.missingRequirements,
    volunteerFamilyInfo?.roleRemovals,
  ]);

  const roleSummaryCards = useMemo(
    () =>
      buildRoleSummaryCards({
        family: {
          context: {
            kind: 'Volunteer Family',
            volunteerFamilyId: familyId,
          },
          completedRequirements:
            volunteerFamilyInfo?.completedRequirements ?? [],
          exemptedRequirements: volunteerFamilyInfo?.exemptedRequirements ?? [],
          missingRequirements: volunteerFamilyInfo?.missingRequirements ?? [],
          availableApplications:
            volunteerFamilyInfo?.availableApplications ?? [],
          familyRoleApprovals: volunteerFamilyInfo?.familyRoleApprovals ?? {},
          roleRemovals: volunteerFamilyInfo?.roleRemovals ?? [],
        },
        individuals: activeAdultApprovalSources,
        approvalLedgerRows,
      }),
    [
      activeAdultApprovalSources,
      approvalLedgerRows,
      familyId,
      volunteerFamilyInfo?.availableApplications,
      volunteerFamilyInfo?.completedRequirements,
      volunteerFamilyInfo?.exemptedRequirements,
      volunteerFamilyInfo?.familyRoleApprovals,
      volunteerFamilyInfo?.missingRequirements,
      volunteerFamilyInfo?.roleRemovals,
    ]
  );

  const selectedRoleSummaryCard = useMemo(
    () =>
      roleSummaryCards.find((card) => card.id === selectedRoleSummaryCardId) ??
      null,
    [roleSummaryCards, selectedRoleSummaryCardId]
  );

  const removedRoleSummaries = useMemo(
    () =>
      buildRemovedRoleSummaries({
        family: {
          context: {
            kind: 'Volunteer Family',
            volunteerFamilyId: familyId,
          },
          roleRemovals: volunteerFamilyInfo?.roleRemovals ?? [],
        },
        individuals: activeAdultApprovalSources,
      }),
    [activeAdultApprovalSources, familyId, volunteerFamilyInfo?.roleRemovals]
  );

  const selectedRemovedRole = useMemo(
    () =>
      removedRoleSummaries.find(
        (removedRole) => removedRole.id === selectedRemovedRoleId
      ) ?? null,
    [removedRoleSummaries, selectedRemovedRoleId]
  );

  const approvalAttentionCounts = useMemo(
    () =>
      approvalLedgerRows.reduce(
        (counts, row) => {
          if (row.status === 'missing') {
            return { ...counts, missing: counts.missing + 1 };
          }

          if (row.status === 'expired') {
            return { ...counts, expired: counts.expired + 1 };
          }

          return counts;
        },
        { missing: 0, expired: 0 }
      ),
    [approvalLedgerRows]
  );

  return {
    approvalAttentionCounts,
    approvalLedgerRows,
    removedRoleSummaries,
    roleSummaryCards,
    selectedRemovedRole,
    selectedRoleSummaryCard,
  };
}
