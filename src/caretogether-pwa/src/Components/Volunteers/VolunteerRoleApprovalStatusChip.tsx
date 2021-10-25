import { Chip } from "@material-ui/core";
import { RoleApprovalStatus, RoleVersionApproval } from "../../GeneratedClient";

type VolunteerRoleApprovalStatusChipProps = {
  roleName: string;
  roleVersionApprovals: RoleVersionApproval[];
};

export function VolunteerRoleApprovalStatusChip({ roleName, roleVersionApprovals }: VolunteerRoleApprovalStatusChipProps) {
  return roleVersionApprovals.some(x => x.approvalStatus === RoleApprovalStatus.Onboarded)
    ? <Chip size="small" color="primary" label={"Onboarded " + roleName} />
    : roleVersionApprovals.some(x => x.approvalStatus === RoleApprovalStatus.Approved)
      ? <Chip size="small" color="secondary" label={"Approved " + roleName} />
      : roleVersionApprovals.some(x => x.approvalStatus === RoleApprovalStatus.Prospective)
        ? <Chip size="small" color="secondary" label={"Prospective " + roleName} />
        : <></>;
}
