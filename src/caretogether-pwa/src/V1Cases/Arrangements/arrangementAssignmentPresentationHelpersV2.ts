import {
  FunctionRequirement,
  ValueTupleOfPersonAndFamilyAdultRelationshipInfo,
} from '../../GeneratedClient';
import { ArrangementFunctionSummaryV2 } from './arrangementViewModel';

export function getFamilyName(
  person: ValueTupleOfPersonAndFamilyAdultRelationshipInfo | undefined
) {
  return person
    ? `${person.item1!.firstName} ${person.item1!.lastName} Family`
    : 'Missing primary contact Family';
}

export function assignmentSummary(summary: ArrangementFunctionSummaryV2) {
  if (summary.assignmentLabels.length === 0) {
    return 'Not assigned';
  }

  return summary.assignmentLabels.join(', ');
}

export function assignmentMetadataChips(summary: ArrangementFunctionSummaryV2) {
  if (summary.functionPolicy.requirement === FunctionRequirement.ExactlyOne) {
    return [
      { label: 'Required', variant: 'filled' as const },
      { label: 'Exactly one', variant: 'outlined' as const },
    ];
  }

  if (summary.functionPolicy.requirement === FunctionRequirement.OneOrMore) {
    return [
      { label: 'Required', variant: 'filled' as const },
      { label: 'One or more', variant: 'outlined' as const },
    ];
  }

  return [
    { label: 'Optional', variant: 'outlined' as const },
    { label: 'Zero or more', variant: 'outlined' as const },
  ];
}

export function assignmentActionLabel(summary: ArrangementFunctionSummaryV2) {
  if (summary.assignments.length === 0) {
    return 'Assign';
  }

  if (summary.functionPolicy.requirement === FunctionRequirement.ExactlyOne) {
    return 'Change Assignment';
  }

  return 'Add Assignment';
}
