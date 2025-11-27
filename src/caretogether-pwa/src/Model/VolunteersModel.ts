import { selector } from 'recoil';
import {
  ActionRequirement,
  CompleteVolunteerFamilyRequirement,
  CompleteVolunteerRequirement,
  VolunteerCommand,
  VolunteerFamilyCommand,
  RoleRemovalReason,
  RemoveVolunteerRole,
  ResetVolunteerRole,
  RemoveVolunteerFamilyRole,
  ResetVolunteerFamilyRole,
  MarkVolunteerFamilyRequirementIncomplete,
  CompletedRequirementInfo,
  MarkVolunteerRequirementIncomplete,
  ExemptVolunteerRequirement,
  UnexemptVolunteerRequirement,
  ExemptVolunteerFamilyRequirement,
  UnexemptVolunteerFamilyRequirement,
  ExemptedRequirementInfo,
  FamilyApprovalRecordsCommand,
  IndividualApprovalRecordsCommand,
} from '../GeneratedClient';
import { useAtomicRecordsCommandCallback } from './DirectoryModel';
import { visibleFamiliesQuery } from './Data';
import { commandFactory } from './CommandFactory';

export const volunteerFamiliesData = selector({
  key: 'volunteerFamiliesData',
  get: ({ get }) => {
    const visibleFamilies = get(visibleFamiliesQuery);
    return visibleFamilies.filter((f) => f.volunteerFamilyInfo);
  },
});

function useVolunteerFamilyCommandCallbackWithLocation<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<VolunteerFamilyCommand>
) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    const command = new FamilyApprovalRecordsCommand();
    command.command = await callback(familyId, ...args);
    return command;
  });
}

function useVolunteerCommandCallbackWithLocation<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<VolunteerCommand>
) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    const command = new IndividualApprovalRecordsCommand();
    command.command = await callback(familyId, ...args);
    return command;
  });
}

export function useVolunteersModel() {
  const completeFamilyRequirement =
    useVolunteerFamilyCommandCallbackWithLocation(
      async (
        volunteerFamilyId,
        requirementName: string,
        _requirement: ActionRequirement,
        completedAtLocal: Date,
        documentId: string | null,
        noteId: string | null
      ) => {
        const command = commandFactory(CompleteVolunteerFamilyRequirement, {
          familyId: volunteerFamilyId,
          completedRequirementId: crypto.randomUUID(),
          requirementName: requirementName,
          completedAtUtc: completedAtLocal,
          uploadedDocumentId: documentId ?? undefined,
          noteId: noteId ?? undefined,
        });
        return command;
      }
    );
  const markFamilyRequirementIncomplete =
    useVolunteerFamilyCommandCallbackWithLocation(
      async (
        volunteerFamilyId,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command = commandFactory(
          MarkVolunteerFamilyRequirementIncomplete,
          {
            familyId: volunteerFamilyId,
            requirementName: completedRequirement.requirementName,
            completedRequirementId: completedRequirement.completedRequirementId,
          }
        );
        return command;
      }
    );
  const exemptVolunteerFamilyRequirement =
    useVolunteerFamilyCommandCallbackWithLocation(
      async (
        volunteerFamilyId,
        requirementName: string,
        additionalComments: string,
        exemptionExpiresAtLocal: Date | null
      ) => {
        const command = commandFactory(ExemptVolunteerFamilyRequirement, {
          familyId: volunteerFamilyId,
          requirementName: requirementName,
          additionalComments: additionalComments,
          exemptionExpiresAtUtc: exemptionExpiresAtLocal ?? undefined,
        });
        return command;
      }
    );
  const unexemptVolunteerFamilyRequirement =
    useVolunteerFamilyCommandCallbackWithLocation(
      async (
        volunteerFamilyId,
        exemptedRequirement: ExemptedRequirementInfo
      ) => {
        const command = commandFactory(UnexemptVolunteerFamilyRequirement, {
          familyId: volunteerFamilyId,
          requirementName: exemptedRequirement.requirementName,
        });
        return command;
      }
    );
  const removeFamilyRole = useVolunteerFamilyCommandCallbackWithLocation(
    async (
      volunteerFamilyId,
      role: string,
      reason: RoleRemovalReason,
      additionalComments: string,
      effectiveSince: Date | null,
      effectiveThrough: Date | null
    ) => {
      const command = commandFactory(RemoveVolunteerFamilyRole, {
        familyId: volunteerFamilyId,
        roleName: role,
        reason: reason,
        additionalComments: additionalComments,
        effectiveSince: effectiveSince ?? undefined,
        effectiveThrough: effectiveThrough ?? undefined,
      });
      return command;
    }
  );
  const resetFamilyRole = useVolunteerFamilyCommandCallbackWithLocation(
    async (
      volunteerFamilyId,
      role: string,
      forRemovalEffectiveSince: Date | null,
      effectiveThrough: Date | null
    ) => {
      const command = commandFactory(ResetVolunteerFamilyRole, {
        familyId: volunteerFamilyId,
        roleName: role,
        forRemovalEffectiveSince: forRemovalEffectiveSince ?? undefined,
        effectiveThrough: effectiveThrough ?? undefined,
      });
      return command;
    }
  );
  const completeIndividualRequirement = useVolunteerCommandCallbackWithLocation(
    async (
      volunteerFamilyId,
      personId: string,
      requirementName: string,
      _requirement: ActionRequirement,
      completedAtLocal: Date,
      documentId: string | null,
      noteId: string | null
    ) => {
      const command = commandFactory(CompleteVolunteerRequirement, {
        familyId: volunteerFamilyId,
        personId: personId,
        completedRequirementId: crypto.randomUUID(),
        requirementName: requirementName,
        completedAtUtc: completedAtLocal,
        uploadedDocumentId: documentId ?? undefined,
        noteId: noteId ?? undefined,
      });
      return command;
    }
  );
  const markIndividualRequirementIncomplete =
    useVolunteerCommandCallbackWithLocation(
      async (
        volunteerFamilyId,
        personId: string,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command = commandFactory(MarkVolunteerRequirementIncomplete, {
          familyId: volunteerFamilyId,
          personId: personId,
          requirementName: completedRequirement.requirementName,
          completedRequirementId: completedRequirement.completedRequirementId,
        });
        return command;
      }
    );
  const exemptVolunteerRequirement = useVolunteerCommandCallbackWithLocation(
    async (
      volunteerFamilyId,
      personId: string,
      requirementName: string,
      additionalComments: string,
      exemptionExpiresAtLocal: Date | null
    ) => {
      const command = commandFactory(ExemptVolunteerRequirement, {
        familyId: volunteerFamilyId,
        personId: personId,
        requirementName: requirementName,
        additionalComments: additionalComments,
        exemptionExpiresAtUtc: exemptionExpiresAtLocal ?? undefined,
      });
      return command;
    }
  );
  const unexemptVolunteerRequirement = useVolunteerCommandCallbackWithLocation(
    async (
      volunteerFamilyId,
      personId: string,
      exemptedRequirement: ExemptedRequirementInfo
    ) => {
      const command = commandFactory(UnexemptVolunteerRequirement, {
        familyId: volunteerFamilyId,
        personId: personId,
        requirementName: exemptedRequirement.requirementName,
      });
      return command;
    }
  );
  const removeIndividualRole = useVolunteerCommandCallbackWithLocation(
    async (
      volunteerFamilyId,
      personId: string,
      role: string,
      reason: RoleRemovalReason,
      additionalComments: string,
      effectiveSince: Date | null,
      effectiveThrough: Date | null
    ) => {
      const command = commandFactory(RemoveVolunteerRole, {
        familyId: volunteerFamilyId,
        personId: personId,
        roleName: role,
        reason: reason,
        additionalComments: additionalComments,
        effectiveSince: effectiveSince ?? undefined,
        effectiveThrough: effectiveThrough ?? undefined,
      });
      return command;
    }
  );
  const resetIndividualRole = useVolunteerCommandCallbackWithLocation(
    async (
      volunteerFamilyId,
      personId: string,
      role: string,
      forRemovalEffectiveSince: Date | null,
      effectiveThrough: Date | null
    ) => {
      const command = commandFactory(ResetVolunteerRole, {
        familyId: volunteerFamilyId,
        personId: personId,
        roleName: role,
        forRemovalEffectiveSince: forRemovalEffectiveSince ?? undefined,
        effectiveThrough: effectiveThrough ?? undefined,
      });
      return command;
    }
  );

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
    resetIndividualRole,
  };
}
