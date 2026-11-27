import type { AppNavigate } from '../Hooks/useAppNavigate';
import type { ArrangementWorkQueueItem } from './arrangementWorkQueue';

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
