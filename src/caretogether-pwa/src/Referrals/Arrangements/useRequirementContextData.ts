import {
  Arrangement,
  CombinedFamilyInfo,
  FunctionRequirement,
  ArrangementPolicy,
} from '../../GeneratedClient';
import { RequirementContext } from '../../Requirements/RequirementContext';

export function useRequirementContextData(
  arrangement: Arrangement,
  arrangementPolicy: ArrangementPolicy | undefined,
  partneringFamily: CombinedFamilyInfo,
  referralId: string
) {
  const partneringFamilyId = partneringFamily.family!.id!;

  const arrangementRequirementContext: RequirementContext = {
    kind: 'Arrangement',
    partneringFamilyId,
    referralId,
    arrangementId: arrangement.id!,
  };

  const missingAssignmentFunctions =
    arrangementPolicy?.arrangementFunctions?.filter(
      (functionPolicy) =>
        (functionPolicy.requirement === FunctionRequirement.ExactlyOne ||
          functionPolicy.requirement === FunctionRequirement.OneOrMore) &&
        !arrangement.familyVolunteerAssignments?.some(
          (x) => x.arrangementFunction === functionPolicy.functionName
        ) &&
        !arrangement.individualVolunteerAssignments?.some(
          (x) => x.arrangementFunction === functionPolicy.functionName
        )
    )?.length || 0;

  const assignmentsMissingVariants =
    arrangementPolicy?.arrangementFunctions
      ?.filter(
        (functionPolicy) =>
          functionPolicy.variants && functionPolicy.variants.length > 0
      )
      .map(
        (functionPolicy) =>
          (arrangement.familyVolunteerAssignments?.filter(
            (fva) =>
              fva.arrangementFunction === functionPolicy.functionName &&
              !fva.arrangementFunctionVariant
          )?.length || 0) +
          (arrangement.individualVolunteerAssignments?.filter(
            (iva) =>
              iva.arrangementFunction === functionPolicy.functionName &&
              !iva.arrangementFunctionVariant
          )?.length || 0)
      )
      .reduce((prev, curr) => prev + curr, 0) || 0;

  const completedRequirementsWithContext = (
    arrangement.completedRequirements || []
  )
    .map((cr) => ({
      completed: cr,
      context: arrangementRequirementContext as RequirementContext,
    }))
    .concat(
      (arrangement.familyVolunteerAssignments || []).flatMap((fva) =>
        (fva.completedRequirements || []).map((cr) => ({
          completed: cr,
          context: {
            kind: 'Family Volunteer Assignment',
            partneringFamilyId: partneringFamily.family!.id!,
            referralId: referralId,
            arrangementId: arrangement.id!,
            assignment: fva,
          } as RequirementContext,
        }))
      )
    )
    .concat(
      (arrangement.individualVolunteerAssignments || []).flatMap((iva) =>
        (iva.completedRequirements || []).map((cr) => ({
          completed: cr,
          context: {
            kind: 'Individual Volunteer Assignment',
            partneringFamilyId: partneringFamily.family!.id!,
            referralId: referralId,
            arrangementId: arrangement.id!,
            assignment: iva,
          },
        }))
      )
    );

  const exemptedRequirementsWithContext = (
    arrangement.exemptedRequirements || []
  )
    .map((er) => ({
      exempted: er,
      context: arrangementRequirementContext as RequirementContext,
    }))
    .concat(
      (arrangement.familyVolunteerAssignments || []).flatMap((fva) =>
        (fva.exemptedRequirements || []).map((er) => ({
          exempted: er,
          context: {
            kind: 'Family Volunteer Assignment',
            partneringFamilyId: partneringFamily.family!.id!,
            referralId: referralId,
            arrangementId: arrangement.id!,
            assignment: fva,
          } as RequirementContext,
        }))
      )
    )
    .concat(
      (arrangement.individualVolunteerAssignments || []).flatMap((iva) =>
        (iva.exemptedRequirements || []).map((er) => ({
          exempted: er,
          context: {
            kind: 'Individual Volunteer Assignment',
            partneringFamilyId: partneringFamily.family!.id!,
            referralId: referralId,
            arrangementId: arrangement.id!,
            assignment: iva,
          },
        }))
      )
    );

  const missingRequirementsWithContext =
    // arrangement.missingRequirements || []
    [
      ...arrangement.missingRequirements!,
      ...arrangement.missingOptionalRequirements!,
    ].map((requirement) => {
      if (requirement.personId) {
        return {
          missing: requirement,
          context: {
            kind: 'Individual Volunteer Assignment',
            partneringFamilyId: partneringFamily.family!.id!,
            referralId: referralId,
            arrangementId: arrangement.id!,
            assignment: arrangement.individualVolunteerAssignments!.find(
              (iva) =>
                iva.arrangementFunction === requirement.arrangementFunction &&
                iva.arrangementFunctionVariant ===
                  requirement.arrangementFunctionVariant &&
                iva.familyId === requirement.volunteerFamilyId &&
                iva.personId === requirement.personId
            )!,
          } as RequirementContext,
        };
      } else if (requirement.volunteerFamilyId) {
        return {
          missing: requirement,
          context: {
            kind: 'Family Volunteer Assignment',
            partneringFamilyId: partneringFamily.family!.id!,
            referralId: referralId,
            arrangementId: arrangement.id!,
            assignment: arrangement.familyVolunteerAssignments!.find(
              (iva) =>
                iva.arrangementFunction === requirement.arrangementFunction &&
                iva.arrangementFunctionVariant ===
                  requirement.arrangementFunctionVariant &&
                iva.familyId === requirement.volunteerFamilyId
            )!,
          } as RequirementContext,
        };
      } else {
        return { missing: requirement, context: arrangementRequirementContext };
      }
    });

  // Sort the missing requirements so that all the items with due dates are shown after
  // the items without due dates, and so that all items with due dates are shown in
  // chronological order by due date.

  const itemsWithoutDueDates = missingRequirementsWithContext.filter(
    (item) => !item.missing.dueBy && !item.missing.pastDueSince
  );

  const itemsWithDueDates = missingRequirementsWithContext.filter(
    (item) => item.missing.dueBy || item.missing.pastDueSince
  );

  itemsWithDueDates.sort((a, b) => {
    const dateA =
      a.missing.pastDueSince || a.missing.dueBy || '2000-01-01T00:00:00Z';
    const dateB =
      b.missing.pastDueSince || b.missing.dueBy || '2000-01-01T00:00:00Z';
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  const mergedArray = [...itemsWithoutDueDates, ...itemsWithDueDates];

  const upcomingRequirementsCount =
    arrangement.missingRequirements?.filter(
      (missingRequirement) =>
        missingRequirement.dueBy /* Determine if this is an "upcoming" requirement */
    ).length || 0;

  return {
    missingAssignmentFunctions,
    assignmentsMissingVariants,
    completedRequirementsWithContext,
    exemptedRequirementsWithContext,
    missingRequirementsWithContext,
    mergedArray,
    upcomingRequirementsCount,
  };
}
