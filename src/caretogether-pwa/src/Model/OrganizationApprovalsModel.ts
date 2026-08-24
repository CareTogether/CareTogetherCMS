import {
  ActivateOrganizationApprovals,
  CompleteOrganizationRequirement,
  CompletedRequirementInfo,
  ExemptOrganizationRequirement,
  ExemptedRequirementInfo,
  MarkOrganizationRequirementIncomplete,
  OrganizationApprovalCommand,
  OrganizationApprovalRecordsCommand,
  RemoveOrganizationRole,
  ResetOrganizationRole,
  RoleRemovalReason,
  UnexemptOrganizationRequirement,
} from '../GeneratedClient';
import { commandFactory } from './CommandFactory';
import { useAtomicRecordsCommandCallback } from './Data';

function useOrganizationApprovalCommand<T extends unknown[]>(
  createCommand: (
    organizationId: string,
    ...args: T
  ) => OrganizationApprovalCommand
) {
  return useAtomicRecordsCommandCallback(async (organizationId, ...args: T) => {
    const recordsCommand = new OrganizationApprovalRecordsCommand();
    recordsCommand.command = createCommand(organizationId, ...args);
    return recordsCommand;
  });
}

export function useOrganizationApprovalsModel() {
  const activate = useOrganizationApprovalCommand((organizationId) =>
    commandFactory(ActivateOrganizationApprovals, { organizationId })
  );
  const completeRequirement = useOrganizationApprovalCommand(
    (
      organizationId,
      requirementName: string,
      completedAtUtc: Date,
      uploadedDocumentId?: string
    ) =>
      commandFactory(CompleteOrganizationRequirement, {
        organizationId,
        completedRequirementId: crypto.randomUUID(),
        requirementName,
        completedAtUtc,
        uploadedDocumentId,
      })
  );
  const markRequirementIncomplete = useOrganizationApprovalCommand(
    (organizationId, completion: CompletedRequirementInfo) =>
      commandFactory(MarkOrganizationRequirementIncomplete, {
        organizationId,
        completedRequirementId: completion.completedRequirementId,
        requirementName: completion.requirementName,
      })
  );
  const exemptRequirement = useOrganizationApprovalCommand(
    (
      organizationId,
      requirementName: string,
      additionalComments: string,
      exemptionExpiresAtUtc?: Date
    ) =>
      commandFactory(ExemptOrganizationRequirement, {
        organizationId,
        requirementName,
        additionalComments,
        exemptionExpiresAtUtc,
      })
  );
  const unexemptRequirement = useOrganizationApprovalCommand(
    (organizationId, exemption: ExemptedRequirementInfo) =>
      commandFactory(UnexemptOrganizationRequirement, {
        organizationId,
        requirementName: exemption.requirementName,
      })
  );
  const removeRole = useOrganizationApprovalCommand(
    (
      organizationId,
      roleName: string,
      reason: RoleRemovalReason,
      additionalComments?: string
    ) =>
      commandFactory(RemoveOrganizationRole, {
        organizationId,
        roleName,
        reason,
        additionalComments,
      })
  );
  const resetRole = useOrganizationApprovalCommand(
    (organizationId, roleName: string) =>
      commandFactory(ResetOrganizationRole, {
        organizationId,
        roleName,
      })
  );

  return {
    activate,
    completeRequirement,
    markRequirementIncomplete,
    exemptRequirement,
    unexemptRequirement,
    removeRole,
    resetRole,
  };
}
