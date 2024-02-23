import { Chip } from "@mui/material";
import { format } from "date-fns";
import { DateOnlyTimelineOfRoleApprovalStatus, RoleApprovalStatus } from "../GeneratedClient";

type VolunteerRoleApprovalStatusChipProps = {
  roleName: string;
  status?: DateOnlyTimelineOfRoleApprovalStatus;
};

// Date ranges may use either 'null' or the C# DateOnly.MaxValue to indicate an open-ended range.
const FUTURE_CUTOFF = new Date(3000, 0, 1);

export function VolunteerRoleApprovalStatusChip({ roleName, status }: VolunteerRoleApprovalStatusChipProps) {
  const now = new Date();
  const currentStatusRange = status?.ranges?.find(r => r.start && r.start <= now && (!r.end || r.end >= now));
  const currentStatusValue = currentStatusRange?.tag;
  //TODO: Actually select the next range that has a value of 'expired'?
  const expiresAt = currentStatusRange?.end;

  return currentStatusValue != null
    ? <Chip size="small"
      color={currentStatusValue === RoleApprovalStatus.Onboarded
        ? "primary" : "secondary"}
      label={(expiresAt && expiresAt < FUTURE_CUTOFF)
        ? `${RoleApprovalStatus[currentStatusValue]} ${roleName} until ${format(expiresAt, "M/d/yy")}`
        : `${RoleApprovalStatus[currentStatusValue]} ${roleName}`} />
    : <></>;
}
