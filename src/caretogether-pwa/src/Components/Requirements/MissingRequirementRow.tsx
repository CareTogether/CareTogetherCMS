import { useState } from "react";
import { useRecoilValue } from "recoil";
import { Permission } from "../../GeneratedClient";
import { policyData } from "../../Model/ConfigurationModel";
import { usePermissions } from "../../Model/SessionModel";
import { IconRow } from "../IconRow";
import { MissingRequirementDialog } from "./MissingRequirementDialog";
import { RequirementContext } from "./RequirementContext";

type MissingRequirementRowProps = {
  requirement: string;
  context: RequirementContext;
  isAvailableApplication?: boolean;
};

export function MissingRequirementRow({ requirement, context, isAvailableApplication }: MissingRequirementRowProps) {
  const policy = useRecoilValue(policyData);
  const permissions = usePermissions();

  const requirementPolicy = policy.actionDefinitions![requirement];

  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);

  const canComplete = context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementCompletion);

  return (
    <>
      <IconRow icon={isAvailableApplication ? "💤" : "❌"}
        onClick={canComplete ? openDialog : undefined}>{requirement}</IconRow>
      <MissingRequirementDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        requirement={requirement} context={context} policy={requirementPolicy} />
    </>
  );
}
