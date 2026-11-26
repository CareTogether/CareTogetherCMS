import type { AppNavigate } from '../Hooks/useAppNavigate';
import type { ApprovalNavigationTarget } from '../Hooks/workResolutionTarget';
import type { ApprovalExpirationWorkItem } from './approvalExpirationWorkQueue';
import type { ArrangementWorkQueueItem } from './arrangementWorkQueue';

export function openDashboardApproval(
  navigate: Pick<AppNavigate, 'family' | 'organization'>,
  target: ApprovalExpirationWorkItem['target'],
  approval: Pick<ApprovalNavigationTarget, 'kind' | 'name'>,
  flags: { familyV2: boolean; organizationApprovals: boolean }
) {
  if (target.kind === 'organization') {
    navigate.organization(
      target.communityId,
      flags.organizationApprovals ? approval : undefined
    );
    return;
  }
  if (!flags.familyV2) {
    navigate.family(target.familyId);
    return;
  }
  navigate.family(target.familyId, {
    approval: {
      ...approval,
      personId:
        target.kind === 'individual' ? target.familyMemberId : undefined,
    },
  });
}

export function openDashboardArrangement(
  navigate: Pick<AppNavigate, 'family'>,
  item: ArrangementWorkQueueItem,
  familyV2: boolean
) {
  const { familyId, v1CaseId, arrangementId } = item.target;
  navigate.family(
    familyId,
    familyV2
      ? {
          v1CaseId,
          arrangementId,
          arrangementRequirement: {
            actionName: item.requirementName,
            date: item.occurrenceDate,
            ...item.assignment,
          },
        }
      : { v1CaseId }
  );
}
