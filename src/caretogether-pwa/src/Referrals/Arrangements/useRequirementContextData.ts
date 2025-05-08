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

  const requirementContext: RequirementContext = {
    kind: 'Arrangement',
    partneringFamilyId,
    referralId,
    arrangementId: arrangement.id!,
  };

  const completedRequirementsWithContext = (
    arrangement.completedRequirements || []
  ).map((cr) => ({
    completed: cr,
    context: requirementContext,
  }));

  const exemptedRequirementsWithContext = (
    arrangement.exemptedRequirements || []
  ).map((er) => ({
    exempted: er,
    context: requirementContext,
  }));

  const missingRequirementsWithContext = (
    arrangement.missingRequirements || []
  ).map((requirement) => ({
    missing: requirement,
    context: requirementContext,
  }));

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
      ?.filter((functionPolicy) => functionPolicy.variants?.length)
      .map(
        (functionPolicy) =>
          (arrangement.familyVolunteerAssignments?.filter(
            (fva) =>
              fva.arrangementFunction === functionPolicy.functionName &&
              !fva.arrangementFunctionVariant
          ).length || 0) +
          (arrangement.individualVolunteerAssignments?.filter(
            (iva) =>
              iva.arrangementFunction === functionPolicy.functionName &&
              !iva.arrangementFunctionVariant
          ).length || 0)
      )
      .reduce((prev, curr) => prev + curr, 0) || 0;

  const upcomingRequirementsCount =
    arrangement.missingRequirements?.filter(
      (missingRequirement) =>
        missingRequirement.dueBy /* Determine if this is an "upcoming" requirement */
    ).length || 0;

  return {
    completedRequirementsWithContext,
    exemptedRequirementsWithContext,
    missingRequirementsWithContext,
    mergedArray,
    missingAssignmentFunctions,
    assignmentsMissingVariants,
    upcomingRequirementsCount,
  };
}
