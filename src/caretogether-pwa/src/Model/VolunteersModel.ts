import { selector } from "recoil";
import { ActionRequirement, CompleteVolunteerFamilyRequirement, CompleteVolunteerRequirement, VolunteerCommand, VolunteerFamilyCommand, RoleRemovalReason, RemoveVolunteerRole, ResetVolunteerRole, RemoveVolunteerFamilyRole, ResetVolunteerFamilyRole, MarkVolunteerFamilyRequirementIncomplete, CompletedRequirementInfo, MarkVolunteerRequirementIncomplete, ExemptVolunteerRequirement, UnexemptVolunteerRequirement, ExemptVolunteerFamilyRequirement, UnexemptVolunteerFamilyRequirement, ExemptedRequirementInfo, FamilyApprovalRecordsCommand, IndividualApprovalRecordsCommand } from "../GeneratedClient";
import { useAtomicRecordsCommandCallback } from "./DirectoryModel";
import { visibleFamiliesQuery } from "./Data";

export const volunteerFamiliesData = selector({
  key: 'volunteerFamiliesData',
  get: ({ get }) => {
    const visibleFamilies = get(visibleFamiliesQuery);
    return visibleFamilies.filter(f => f.volunteerFamilyInfo);
  }
});

function useVolunteerFamilyCommandCallbackWithLocation<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<VolunteerFamilyCommand>) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    const command = new FamilyApprovalRecordsCommand();
    command.command = await callback(familyId, ...args);
    return command;
  });
}

function useVolunteerCommandCallbackWithLocation<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<VolunteerCommand>) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    const command = new IndividualApprovalRecordsCommand();
    command.command = await callback(familyId, ...args);
    return command;
  });
}

export function useVolunteersModel() {
  const completeFamilyRequirement = useVolunteerFamilyCommandCallbackWithLocation(
    async (volunteerFamilyId, requirementName: string, _requirement: ActionRequirement,
      completedAtLocal: Date, documentId: string | null, noteId: string | null) => {
      const command = new CompleteVolunteerFamilyRequirement({
        familyId: volunteerFamilyId
      });
      command.completedRequirementId = crypto.randomUUID();
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null)
        command.uploadedDocumentId = documentId;
      if (noteId != null)
        command.noteId = noteId;
      return command;
    });
  const markFamilyRequirementIncomplete = useVolunteerFamilyCommandCallbackWithLocation(
    async (volunteerFamilyId, completedRequirement: CompletedRequirementInfo) => {
      const command = new MarkVolunteerFamilyRequirementIncomplete({
        familyId: volunteerFamilyId
      });
      command.requirementName = completedRequirement.requirementName;
      command.completedRequirementId = completedRequirement.completedRequirementId;
      return command;
    });
  const exemptVolunteerFamilyRequirement = useVolunteerFamilyCommandCallbackWithLocation(
    async (volunteerFamilyId, requirementName: string,
      additionalComments: string, exemptionExpiresAtLocal: Date | null) => {
      const command = new ExemptVolunteerFamilyRequirement({
        familyId: volunteerFamilyId
      });
      command.requirementName = requirementName;
      command.additionalComments = additionalComments;
      command.exemptionExpiresAtUtc = exemptionExpiresAtLocal ?? undefined;
      return command;
    });
  const unexemptVolunteerFamilyRequirement = useVolunteerFamilyCommandCallbackWithLocation(
    async (volunteerFamilyId, exemptedRequirement: ExemptedRequirementInfo) => {
      const command = new UnexemptVolunteerFamilyRequirement({
        familyId: volunteerFamilyId
      });
      command.requirementName = exemptedRequirement.requirementName;
      return command;
    });
  const removeFamilyRole = useVolunteerFamilyCommandCallbackWithLocation(
    async (volunteerFamilyId,
      role: string, reason: RoleRemovalReason, additionalComments: string) => {
      const command = new RemoveVolunteerFamilyRole({
        familyId: volunteerFamilyId
      });
      command.roleName = role;
      command.reason = reason;
      command.additionalComments = additionalComments;
      return command;
    });
  const resetFamilyRole = useVolunteerFamilyCommandCallbackWithLocation(
    async (volunteerFamilyId,
      role: string) => {
      const command = new ResetVolunteerFamilyRole({
        familyId: volunteerFamilyId
      });
      command.roleName = role;
      return command;
    });
  const completeIndividualRequirement = useVolunteerCommandCallbackWithLocation(
    async (volunteerFamilyId, personId: string, requirementName: string, _requirement: ActionRequirement,
      completedAtLocal: Date, documentId: string | null, noteId: string | null) => {
      const command = new CompleteVolunteerRequirement({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.completedRequirementId = crypto.randomUUID();
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null)
        command.uploadedDocumentId = documentId;
      if (noteId != null)
        command.noteId = noteId;
      return command;
    });
  const markIndividualRequirementIncomplete = useVolunteerCommandCallbackWithLocation(
    async (volunteerFamilyId, personId: string, completedRequirement: CompletedRequirementInfo) => {
      const command = new MarkVolunteerRequirementIncomplete({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.requirementName = completedRequirement.requirementName;
      command.completedRequirementId = completedRequirement.completedRequirementId;
      return command;
    });
  const exemptVolunteerRequirement = useVolunteerCommandCallbackWithLocation(
    async (volunteerFamilyId, personId: string, requirementName: string,
      additionalComments: string, exemptionExpiresAtLocal: Date | null) => {
      const command = new ExemptVolunteerRequirement({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.requirementName = requirementName;
      command.additionalComments = additionalComments;
      command.exemptionExpiresAtUtc = exemptionExpiresAtLocal ?? undefined;
      return command;
    });
  const unexemptVolunteerRequirement = useVolunteerCommandCallbackWithLocation(
    async (volunteerFamilyId, personId: string, exemptedRequirement: ExemptedRequirementInfo) => {
      const command = new UnexemptVolunteerRequirement({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.requirementName = exemptedRequirement.requirementName;
      return command;
    });
  const removeIndividualRole = useVolunteerCommandCallbackWithLocation(
    async (volunteerFamilyId, personId: string,
      role: string, reason: RoleRemovalReason, additionalComments: string) => {
      const command = new RemoveVolunteerRole({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.roleName = role;
      command.reason = reason;
      command.additionalComments = additionalComments;
      return command;
    });
  const resetIndividualRole = useVolunteerCommandCallbackWithLocation(
    async (volunteerFamilyId, personId: string,
      role: string) => {
      const command = new ResetVolunteerRole({
        familyId: volunteerFamilyId,
        personId: personId
      });
      command.roleName = role;
      return command;
    });

  return {
    completeFamilyRequirement,
    markFamilyRequirementIncomplete,
    exemptVolunteerFamilyRequirement,
    unexemptVolunteerFamilyRequirement,
    removeFamilyRole,
    resetFamilyRole,
    completeIndividualRequirement,
    markIndividualRequirementIncomplete,
    exemptVolunteerRequirement,
    unexemptVolunteerRequirement,
    removeIndividualRole,
    resetIndividualRole
  };
}
