import { Chip, SxProps, Theme } from '@mui/material';
import { format } from 'date-fns';
import {
  DateOnlyTimelineOfRoleApprovalStatus,
  RoleApprovalStatus,
} from '../GeneratedClient';
import {
  isRoleApprovalStatusVisibleInSummary,
  roleApprovalStatusChipColor,
  roleApprovalStatusLabel,
} from './roleApprovalStatusPresentation';

type VolunteerRoleApprovalStatusChipProps = {
  currentStatus?: RoleApprovalStatus;
  personName?: string;
  roleName: string;
  statusLabel?: string;
  status?: DateOnlyTimelineOfRoleApprovalStatus;
  sx?: SxProps<Theme> | undefined;
};

const FUTURE_CUTOFF = new Date(3000, 0, 1);

export function VolunteerRoleApprovalStatusChip({
  currentStatus,
  personName,
  roleName,
  statusLabel,
  status,
  sx,
}: VolunteerRoleApprovalStatusChipProps) {
  const now = new Date();
  const currentStatusRange = status?.ranges?.find(
    (r) => r.start && r.start <= now && (!r.end || r.end >= now)
  );
  const currentStatusValue = currentStatus ?? currentStatusRange?.tag;
  if (
    currentStatusValue == null ||
    !isRoleApprovalStatusVisibleInSummary(currentStatusValue)
  ) {
    return null;
  }

  const expiresAt = currentStatusRange?.end;
  const label =
    expiresAt && expiresAt < FUTURE_CUTOFF
      ? `${statusLabel ?? `${roleApprovalStatusLabel(currentStatusValue)} ${roleName}`} until ${format(expiresAt, 'M/d/yy')}`
      : (statusLabel ?? `${roleApprovalStatusLabel(currentStatusValue)} ${roleName}`);

  return (
    <Chip
      size="small"
      color={roleApprovalStatusChipColor(currentStatusValue)}
      sx={sx}
      label={personName ? `${personName}: ${label}` : label}
    />
  );
}
