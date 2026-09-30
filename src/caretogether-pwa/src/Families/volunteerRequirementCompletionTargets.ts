import type { ApprovalLedgerOccurrence } from '../Approvals/approvalLedgerViewModel';
import type { VolunteerInfo } from '../GeneratedClient';

type VolunteerRequirementCompletionTargetInput = {
  individualVolunteers: Record<string, VolunteerInfo>;
  occurrence: ApprovalLedgerOccurrence;
  relatedOccurrences: ApprovalLedgerOccurrence[];
  requirementName: string;
};

export function volunteerRequirementCompletionPersonIds({
  individualVolunteers,
  occurrence,
  relatedOccurrences,
  requirementName,
}: VolunteerRequirementCompletionTargetInput) {
  const occurrences = relatedOccurrences.length
    ? relatedOccurrences
    : [occurrence];
  const targetIds = new Set<string>();

  occurrences.forEach((relatedOccurrence) => {
    if (
      relatedOccurrence.context.kind === 'Individual Volunteer' &&
      (relatedOccurrence.status === 'missing' ||
        relatedOccurrence.status === 'optional')
    ) {
      targetIds.add(relatedOccurrence.context.personId);
    }
  });

  Object.entries(individualVolunteers).forEach(([personId, volunteer]) => {
    const missingRequirements = [
      ...(volunteer.missingRequirements ?? []),
      ...(volunteer.missingOptionalRequirements ?? []),
    ];

    if (
      missingRequirements.some(
        (requirement) => requirement.item1 === requirementName
      )
    ) {
      targetIds.add(personId);
    }
  });

  return [...targetIds];
}
