import { Tooltip } from "@mui/material";
import { format } from "date-fns";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import { ActionRequirement, CompletedRequirementInfo, ExemptedRequirementInfo, MissingArrangementRequirement } from "../../GeneratedClient";
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

type CompletedRequirementDialogProps = {
  open: boolean
  onClose: () => void
  requirement: CompletedRequirementInfo
  context: RequirementContext
  policy: ActionRequirement
}

function CompletedRequirementDialog({
  open, onClose, requirement, context, policy
}: CompletedRequirementDialogProps) {
  return (
    <UpdateDialog open={open} onClose={onClose}
      title={`${context.kind} Requirement: ${requirement.requirementName}`}
      enableSave={() => false}
      onSave={() => Promise.resolve()}>
      <p>MARK ME INCOMPLETE</p>
    </UpdateDialog>
  );
}

type ExemptedRequirementDialogProps = {
  open: boolean
  onClose: () => void
  requirement: ExemptedRequirementInfo
  context: RequirementContext
  policy: ActionRequirement
}

function ExemptedRequirementDialog({
  open, onClose, requirement, context, policy
}: ExemptedRequirementDialogProps) {
  return (
    <UpdateDialog open={open} onClose={onClose}
      title={`${context.kind} Requirement: ${requirement.requirementName}`}
      enableSave={() => false}
      onSave={() => Promise.resolve()}>
      <p>UNEXEMPT ME</p>
    </UpdateDialog>
  );
}

type MissingRequirementDialogProps = {
  open: boolean
  onClose: () => void
  requirement: MissingArrangementRequirement | string
  context: RequirementContext
  policy: ActionRequirement
}

function MissingRequirementDialog({
  open, onClose, requirement, context, policy
}: MissingRequirementDialogProps) {
  return (
    <UpdateDialog open={open} onClose={onClose}
      title={`${context.kind} Requirement: ${typeof requirement === 'string' ? requirement : requirement.actionName}`}
      enableSave={() => false}
      onSave={() => Promise.resolve()}>
      <p>COMPLETE ME</p>
      <p>or... EXEMPT ME</p>
    </UpdateDialog>
  );
}

type RequirementDialogProps = {
  open: boolean;
  onClose: () => void;
  requirement: CompletedRequirementInfo | ExemptedRequirementInfo | MissingArrangementRequirement | string
  context: RequirementContext
}

function RequirementDialog({
  requirement, ...rest
}: RequirementDialogProps) {
  const policy = useRecoilValue(policyData);

  return requirement instanceof CompletedRequirementInfo
    ? <CompletedRequirementDialog
        requirement={requirement} policy={policy.actionDefinitions![requirement.requirementName!]} {...rest} />
    : requirement instanceof ExemptedRequirementInfo
    ? <ExemptedRequirementDialog
        requirement={requirement} policy={policy.actionDefinitions![requirement.requirementName!]} {...rest} />
    : requirement instanceof MissingArrangementRequirement
    ? <MissingRequirementDialog
        requirement={requirement} policy={policy.actionDefinitions![requirement.actionName!]} {...rest} />
    : <MissingRequirementDialog
        requirement={requirement} policy={policy.actionDefinitions![requirement]} {...rest} />;
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
