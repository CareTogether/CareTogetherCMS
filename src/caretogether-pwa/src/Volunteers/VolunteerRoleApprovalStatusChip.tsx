import { Chip } from "@mui/material";
import { format } from "date-fns";
import { RoleApprovalStatus, RoleVersionApproval } from "../GeneratedClient";

type VolunteerRoleApprovalStatusChipProps = {
  roleName: string;
  roleVersionApproval: RoleVersionApproval;
};

export function VolunteerRoleApprovalStatusChip({ roleName, roleVersionApproval }: VolunteerRoleApprovalStatusChipProps) {
  const { approvalStatus, expiresAt } = roleVersionApproval;

  return approvalStatus != null
    ? <Chip size="small"
        color={approvalStatus === RoleApprovalStatus.Onboarded
          ? "primary" : "secondary"}
        label={expiresAt
          ? `${RoleApprovalStatus[approvalStatus]} ${roleName} until ${format(expiresAt, "M/d/yy")}`
          : `${RoleApprovalStatus[approvalStatus]} ${roleName}`} />
    : <></>;
}
