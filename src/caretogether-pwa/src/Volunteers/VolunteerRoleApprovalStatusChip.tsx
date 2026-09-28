import { Chip, SxProps, Theme } from '@mui/material';
import { format } from 'date-fns';
import {
  DateOnlyTimelineOfRoleApprovalStatus,
  RoleApprovalStatus,
} from '../GeneratedClient';
import {
  roleApprovalStatusChipColor,
  roleApprovalStatusLabel,
} from './roleApprovalStatusPresentation';

type VolunteerRoleApprovalStatusChipProps = {
  currentStatus?: RoleApprovalStatus;
  roleName: string;
  status?: DateOnlyTimelineOfRoleApprovalStatus;
  sx?: SxProps<Theme> | undefined;
};

const FUTURE_CUTOFF = new Date(3000, 0, 1);

export function VolunteerRoleApprovalStatusChip({
  currentStatus,
  roleName,
  status,
  sx,
}: VolunteerRoleApprovalStatusChipProps) {
  const now = new Date();
  const currentStatusRange = status?.ranges?.find(
    (r) => r.start && r.start <= now && (!r.end || r.end >= now)
  );
  const currentStatusValue = currentStatus ?? currentStatusRange?.tag;
  const expiresAt = currentStatusRange?.end;

  return currentStatusValue != null ? (
    <Chip
      size="small"
      color={roleApprovalStatusChipColor(currentStatusValue)}
      sx={sx}
      label={
        expiresAt && expiresAt < FUTURE_CUTOFF
          ? `${roleApprovalStatusLabel(currentStatusValue)} ${roleName} until ${format(expiresAt, 'M/d/yy')}`
          : `${roleApprovalStatusLabel(currentStatusValue)} ${roleName}`
      }
    />
  ) : (
    <></>
  );
}
