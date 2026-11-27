import type { ApprovalExpirationWorkItem } from './approvalExpirationWorkQueue';
import type { RequirementWindowDays } from './dashboardPreferences';

export function selectDashboardApprovalExpirations(
  items: readonly ApprovalExpirationWorkItem[],
  evaluationTime: Date,
  days: RequirementWindowDays
) {
  const { today, lastDay } = approvalExpirationWindow(evaluationTime, days);
  return items.filter(
    ({ expirationDate, status }) =>
      status === 'expiring' &&
      expirationDate > today &&
      expirationDate <= lastDay
  );
}

export function approvalExpirationWindow(
  evaluationTime: Date,
  days: RequirementWindowDays
) {
  const today = evaluationTime.toISOString().slice(0, 10);
  const cutoff = new Date(today);
  cutoff.setUTCDate(cutoff.getUTCDate() + days);
  const lastDay = cutoff.toISOString().slice(0, 10);

  return { today, lastDay };
}
