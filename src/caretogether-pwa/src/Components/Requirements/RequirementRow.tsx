import { DialogContentText, Tooltip } from "@mui/material";
import { format } from "date-fns";
import { useState } from "react";
import { useRecoilValue } from "recoil";
import { ActionRequirement, CompletedRequirementInfo, ExemptedRequirementInfo, MissingArrangementRequirement, Permission } from "../../GeneratedClient";
import { policyData } from "../../Model/ConfigurationModel";
import { useUserLookup } from "../../Model/DirectoryModel";
import { useReferralsModel } from "../../Model/ReferralsModel";
import { usePermissions } from "../../Model/SessionModel";
import { useVolunteersModel } from "../../Model/VolunteersModel";
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
}

function CompletedRequirementDialog({
  open, onClose, requirement, context
}: CompletedRequirementDialogProps) {
  const referrals = useReferralsModel();
  const volunteers = useVolunteersModel();

  return (
    <UpdateDialog open={open} onClose={onClose}
      title="Are you sure you want to mark this step as incomplete?"
      saveLabel="Yes, Mark Incomplete"
      onSave={async () => {
        switch (context.kind) {
          case 'Referral':
            return referrals.markReferralRequirementIncomplete(
              context.partneringFamilyId, context.referralId, requirement);
          case 'Arrangement':
            return referrals.markArrangementRequirementIncomplete(
              context.partneringFamilyId, context.referralId, context.arrangementId, requirement);
          case 'Volunteer Family':
            return volunteers.markFamilyRequirementIncomplete(
              context.volunteerFamilyId, requirement);
          case 'Individual Volunteer':
            return volunteers.markIndividualRequirementIncomplete(
              context.volunteerFamilyId, context.personId, requirement);
        }
      }}>
      <DialogContentText>{`${context.kind} Requirement: ${requirement.requirementName}`}</DialogContentText>
    </UpdateDialog>
  );
}

type ExemptedRequirementDialogProps = {
  open: boolean
  onClose: () => void
  requirement: ExemptedRequirementInfo
  context: RequirementContext
}

function ExemptedRequirementDialog({
  open, onClose, requirement, context
}: ExemptedRequirementDialogProps) {
  const referrals = useReferralsModel();
  const volunteers = useVolunteersModel();

  return (
    <UpdateDialog open={open} onClose={onClose}
      title="Are you sure you want to remove the exemption for this requirement?"
      saveLabel="Yes, Remove Exemption"
      onSave={async () => {
        switch (context.kind) {
          case 'Referral':
            return referrals.unexemptReferralRequirement(
              context.partneringFamilyId, context.referralId, requirement);
          case 'Arrangement':
            return referrals.unexemptArrangementRequirement(
              context.partneringFamilyId, context.referralId, context.arrangementId, requirement);
          case 'Volunteer Family':
            return volunteers.unexemptVolunteerFamilyRequirement(
              context.volunteerFamilyId, requirement);
          case 'Individual Volunteer':
            return volunteers.unexemptVolunteerRequirement(
              context.volunteerFamilyId, context.personId, requirement);
        }
      }}>
      <DialogContentText>{`${context.kind} Requirement: ${requirement.requirementName}`}</DialogContentText>
    </UpdateDialog>
  );
}

type MissingRequirementDialogProps = {
  open: boolean
  onClose: () => void
  requirement: string
  context: RequirementContext
  policy: ActionRequirement
}

function MissingRequirementDialog({
  open, onClose, requirement, context, policy
}: MissingRequirementDialogProps) {
  return (
    <UpdateDialog open={open} onClose={onClose}
      title={`${context.kind} Requirement: ${requirement}`}
      enableSave={() => false}
      onSave={() => Promise.resolve()}>
      <p>COMPLETE ME</p>
      <p>or... EXEMPT ME</p>
    </UpdateDialog>
  );
}

type MissingArrangementRequirementDialogProps = {
  open: boolean
  onClose: () => void
  requirement: MissingArrangementRequirement
  context: RequirementContext
  policy: ActionRequirement
}

function MissingArrangementRequirementDialog({
  open, onClose, requirement, context, policy
}: MissingArrangementRequirementDialogProps) {
  return (
    <UpdateDialog open={open} onClose={onClose}
      title={`${context.kind} Requirement: ${requirement.actionName}`}
      enableSave={() => false}
      onSave={() => Promise.resolve()}>
      <p>COMPLETE ME</p>
      <p>or... EXEMPT ME</p>
    </UpdateDialog>
  );
}

type CompletedRequirementRowProps = {
  requirement: CompletedRequirementInfo
  context: RequirementContext
}

function CompletedRequirementRow({ requirement, context }: CompletedRequirementRowProps) {
  const userLookup = useUserLookup();
  const permissions = usePermissions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);
  
  const canMarkIncomplete =
    context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementCompletion);
  
  return (
    <>
      <IconRow icon="✅" onClick={canMarkIncomplete ? openDialog : undefined}>
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
      <CompletedRequirementDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        requirement={requirement} context={context} />
    </>
  );
}

type ExemptedRequirementRowProps = {
  requirement: ExemptedRequirementInfo
  context: RequirementContext
}

function ExemptedRequirementRow({ requirement, context }: ExemptedRequirementRowProps) {
  const userLookup = useUserLookup();
  const permissions = usePermissions();

  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);

  const canExempt =
    context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementExemption);
  
  return (
    <>
      <IconRow icon="🚫" onClick={canExempt ? openDialog : undefined}>
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
      <ExemptedRequirementDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        requirement={requirement} context={context} />
    </>
  );
}

type MissingArrangementRequirementRowProps = {
  requirement: MissingArrangementRequirement
  context: RequirementContext
}

function MissingArrangementRequirementRow({ requirement, context }: MissingArrangementRequirementRowProps) {
  const policy = useRecoilValue(policyData);
  const permissions = usePermissions();

  const requirementPolicy = policy.actionDefinitions![requirement.actionName!];

  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);
  
  const canComplete =
    context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementCompletion);
  
  return (
    <>
      {requirement.dueBy
        ? <IconRow icon='📅' onClick={canComplete ? openDialog : undefined}>
            {requirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <span style={{float:'right'}}>{format(requirement.dueBy, "M/d/yy h:mm a")}</span>
          </IconRow>
        : <IconRow icon='❌' onClick={canComplete ? openDialog : undefined}>
            {requirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {requirement.pastDueSince && <span style={{float:'right'}}>{format(requirement.pastDueSince, "M/d/yy h:mm a")}</span>}
          </IconRow>}
      <MissingArrangementRequirementDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        requirement={requirement} context={context} policy={requirementPolicy} />
    </>
  );
}

type MissingRequirementRowProps = {
  requirement: string
  context: RequirementContext
}

function MissingRequirementRow({ requirement, context }: MissingRequirementRowProps) {
  const policy = useRecoilValue(policyData);
  const permissions = usePermissions();

  const requirementPolicy = policy.actionDefinitions![requirement];

  const [dialogOpen, setDialogOpen] = useState(false);
  const openDialog = () => setDialogOpen(true);
  
  const canComplete =
    context.kind === 'Referral' || context.kind === 'Arrangement'
    ? true //TODO: Implement these permissions!
    : permissions(Permission.EditApprovalRequirementCompletion);
  
  return (
    <>
      <IconRow icon="❌" onClick={canComplete ? openDialog : undefined}>{requirement}</IconRow>
      <MissingRequirementDialog open={dialogOpen} onClose={() => setDialogOpen(false)}
        requirement={requirement} context={context} policy={requirementPolicy} />
    </>
  );
}

type RequirementRowProps = {
  requirement: CompletedRequirementInfo | ExemptedRequirementInfo | MissingArrangementRequirement | string
  context: RequirementContext
}

export function RequirementRow({ requirement, context }: RequirementRowProps) {
  return (
    requirement instanceof CompletedRequirementInfo
    ? <CompletedRequirementRow requirement={requirement} context={context} />
    : requirement instanceof ExemptedRequirementInfo
    ? <ExemptedRequirementRow requirement={requirement} context={context} />
    : requirement instanceof MissingArrangementRequirement
    ? <MissingArrangementRequirementRow requirement={requirement} context={context} />
    : <MissingRequirementRow requirement={requirement} context={context} />
  );
}
