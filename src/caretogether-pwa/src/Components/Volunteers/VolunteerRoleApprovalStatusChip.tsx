import { Chip } from "@mui/material";
import { format } from "date-fns";
import { RoleApprovalStatus, RoleVersionApproval } from "../../GeneratedClient";

type VolunteerRoleApprovalStatusChipProps = {
  roleName: string;
  roleVersionApprovals: RoleVersionApproval[];
};

export function VolunteerRoleApprovalStatusChip({ roleName, roleVersionApprovals }: VolunteerRoleApprovalStatusChipProps) {
  const determination =
    roleVersionApprovals.some(x => x.approvalStatus === RoleApprovalStatus.Onboarded)
    ? RoleApprovalStatus.Onboarded
    : roleVersionApprovals.some(x => x.approvalStatus === RoleApprovalStatus.Approved)
    ? RoleApprovalStatus.Approved
    : roleVersionApprovals.some(x => x.approvalStatus === RoleApprovalStatus.Prospective)
    ? RoleApprovalStatus.Prospective
    : null;

  const expiration = determination
    ? roleVersionApprovals.reduce((earliestExpiration, rva) =>
      rva.expiresAt && (!earliestExpiration || rva.expiresAt < earliestExpiration)
      ? rva.expiresAt : earliestExpiration, null as Date | null)
    : null;
  
  return determination
    ? <Chip size="small"
        color={determination === RoleApprovalStatus.Onboarded
          ? "primary" : "secondary"}
        label={expiration
          ? `${RoleApprovalStatus[determination]} ${roleName} until ${format(expiration, "M/d/yy")}`
          : `${RoleApprovalStatus[determination]} ${roleName}`} />
    : <></>;
  return determination === RoleApprovalStatus.Onboarded
    ? <Chip size="small" color="primary" label={"Onboarded " + roleName} />
    : determination === RoleApprovalStatus.Approved
      ? <Chip size="small" color="secondary" label={"Approved " + roleName} />
      : determination === RoleApprovalStatus.Prospective
        ? <Chip size="small" color="secondary" label={"Prospective " + roleName} />
        : <></>;
}
