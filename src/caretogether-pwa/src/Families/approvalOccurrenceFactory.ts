import type { RequirementContext } from '../Requirements/RequirementContext';
import type {
  ApprovalLedgerOccurrence,
  ApprovalLedgerSubject,
} from './approvalLedgerViewModel';

export function createSyntheticApprovalOccurrence({
  requirementName,
  subject,
  context,
}: {
  requirementName: string;
  subject: ApprovalLedgerSubject;
  context: RequirementContext;
}): ApprovalLedgerOccurrence {
  return {
    id: ['synthetic', subject.scope, subject.id, requirementName].join('|'),
    status: 'missing',
    subject,
    context,
    requirement: requirementName,
  };
}
