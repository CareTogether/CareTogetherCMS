import { Chip, SxProps, Theme } from "@mui/material";
import { format } from "date-fns";
import { DateOnlyTimelineOfRoleApprovalStatus, RoleApprovalStatus } from "../GeneratedClient";

type VolunteerRoleApprovalStatusChipProps = {
  roleName: string;
  status?: DateOnlyTimelineOfRoleApprovalStatus;
  sx?: SxProps<Theme> | undefined;
};

// Date ranges may use either 'null' or the C# DateOnly.MaxValue to indicate an open-ended range.
const FUTURE_CUTOFF = new Date(3000, 0, 1);

type ThemeColors = 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
function RoleApprovalStatusColor(status: RoleApprovalStatus): ThemeColors {
  switch (status) {
    case RoleApprovalStatus.Prospective:
      return "secondary";
    case RoleApprovalStatus.Approved:
      return "success";
    case RoleApprovalStatus.Onboarded:
      return "primary";
    case RoleApprovalStatus.Expired:
      return "warning";
    case RoleApprovalStatus.Denied:
      return "error";
    case RoleApprovalStatus.Inactive:
      return "default";
    default:
      return "default";
  }
}

export function VolunteerRoleApprovalStatusChip({ roleName, status, sx }: VolunteerRoleApprovalStatusChipProps) {
  const now = new Date();
  const currentStatusRange = status?.ranges?.find(r => r.start && r.start <= now && (!r.end || r.end >= now));
  const currentStatusValue = currentStatusRange?.tag;
  //TODO: Actually select the next range that has a value of 'expired'?
  const expiresAt = currentStatusRange?.end;

  return currentStatusValue != null
    ? <Chip size="small"
		color={RoleApprovalStatusColor(currentStatusValue)}
		sx={sx}
		label={(expiresAt && expiresAt < FUTURE_CUTOFF)
			? `${RoleApprovalStatus[currentStatusValue]} ${roleName} until ${format(expiresAt, "M/d/yy")}`
			: `${RoleApprovalStatus[currentStatusValue]} ${roleName}`} />
		: <></>;
}
