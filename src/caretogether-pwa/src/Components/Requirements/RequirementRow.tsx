import { Tooltip } from "@mui/material";
import { format } from "date-fns";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import { CompletedRequirementInfo, ExemptedRequirementInfo, MissingArrangementRequirement } from "../../GeneratedClient";
import { policyData } from "../../Model/ConfigurationModel";
import { useUserLookup } from "../../Model/DirectoryModel";
import { PersonName } from "../Families/PersonName";
import { IconRow } from "../IconRow";
import { UpdateDialog } from "../UpdateDialog";

export interface ReferralContext {
  kind: "Referral"
  partneringFamilyId: string
  referralId: string
}

export interface ArrangementContext {
  kind: "Arrangement"
  partneringFamilyId: string
  referralId: string
  arrangementId: string
}

export interface VolunteerFamilyContext {
  kind: "Volunteer Family"
  volunteerFamilyId: string
}

export interface IndividualVolunteerContext {
  kind: "Individual Volunteer"
  volunteerFamilyId: string
  personId: string
}

export type RequirementContext = ReferralContext | ArrangementContext | VolunteerFamilyContext | IndividualVolunteerContext;

type RequirementDialogProps = {
  open: boolean;
  onClose: () => void;
  requirement: CompletedRequirementInfo | ExemptedRequirementInfo | MissingArrangementRequirement | string
  context: RequirementContext
}

function RequirementDialog({
  open, onClose, requirement, context,
}: RequirementDialogProps) {
  const policy = useRecoilValue(policyData);

  const requirementName =
    requirement instanceof CompletedRequirementInfo
    ? requirement.requirementName!
    : requirement instanceof ExemptedRequirementInfo
    ? requirement.requirementName!
    : requirement instanceof MissingArrangementRequirement
    ? requirement.actionName!
    : requirement;
  const requirementPolicy = policy.actionDefinitions![requirementName];

  const dialogTitle = `${context.kind} Requirement: ${requirementName}`;

  return (
    <UpdateDialog open={open} onClose={onClose}
      title={dialogTitle}
      enableSave={() => false}
      onSave={() => Promise.resolve()}>
      <p>{JSON.stringify(requirement)}</p>
      <p>{JSON.stringify(requirementPolicy)}</p>
      <p>{JSON.stringify(context)}</p>
    </UpdateDialog>
  );
}

type RequirementRowProps = {
  requirement: CompletedRequirementInfo | ExemptedRequirementInfo | MissingArrangementRequirement | string
  context: RequirementContext
}

export function RequirementRow({ requirement, context }: RequirementRowProps) {
  const userLookup = useUserLookup();

  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);
  
  return (
    <>
      {requirement instanceof CompletedRequirementInfo
      ? <IconRow icon="✅" onClick={openDialog}>
          <Tooltip title={
            <>
              Completed by <PersonName person={userLookup(requirement.userId)} />
            </>}>
            <span>
              {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {requirement.completedAtUtc &&
                <span style={{float:'right'}}>
                  {format(requirement.completedAtUtc, "M/d/yy h:mm a")}
                </span>}
            </span>
          </Tooltip>
        </IconRow>
      : requirement instanceof ExemptedRequirementInfo
      ? <IconRow icon="🚫" onClick={openDialog}>
          <Tooltip title={
            <>
              Granted by <PersonName person={userLookup(requirement.userId)} /> {format(requirement.timestampUtc!, "M/d/yy h:mm a")}
            </>}>
            <span>
              {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {requirement.exemptionExpiresAtUtc &&
                <span style={{float:'right'}}>
                  until {format(requirement.exemptionExpiresAtUtc, "M/d/yy")}
                </span>}
              <br />
              <span style={{lineHeight: '1.5em', paddingLeft: 30, fontStyle: 'italic'}}>
                {requirement.additionalComments}
              </span>
            </span>
          </Tooltip>
        </IconRow>
      : requirement instanceof MissingArrangementRequirement
      ? requirement.dueBy
        ? <IconRow icon='📅' onClick={openDialog}>
            {requirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <span style={{float:'right'}}>{format(requirement.dueBy, "M/d/yy h:mm a")}</span>
          </IconRow>
        : <IconRow icon='❌' onClick={openDialog}>
            {requirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {requirement.pastDueSince && <span style={{float:'right'}}>{format(requirement.pastDueSince, "M/d/yy h:mm a")}</span>}
          </IconRow>
      : <IconRow icon="❌" onClick={openDialog}>{requirement}</IconRow>}
      <RequirementDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        requirement={requirement} context={context} />
    </>
  );
}
