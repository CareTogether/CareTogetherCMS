import { selector } from 'recoil';
import {
  ReferralCommand as V1CaseCommand,
  ArrangementsCommand,
  ActionRequirement,
  CompleteReferralRequirement as CompleteV1CaseRequirement,
  CreateArrangement,
  CompleteArrangementRequirement,
  StartArrangements,
  EndArrangements,
  AssignVolunteerFamily,
  AssignIndividualVolunteer,
  ReferralCloseReason as V1CaseCloseReason,
  CloseReferral as CloseV1Case,
  CreateReferral as CreateV1Case,
  TrackChildLocationChange,
  ChildLocationPlan,
  UpdateCustomReferralField as UpdateCustomV1CaseField,
  CustomField,
  ExemptReferralRequirement as ExemptV1CaseRequirement,
  UnexemptReferralRequirement as UnexemptV1CaseRequirement,
  ExemptArrangementRequirement,
  UnexemptArrangementRequirement,
  MissingArrangementRequirement,
  ExemptedRequirementInfo,
  MarkReferralRequirementIncomplete as MarkV1CaseRequirementIncomplete,
  CompletedRequirementInfo,
  MarkArrangementRequirementIncomplete,
  CancelArrangementsSetup,
  UpdateReferralComments as UpdateV1CaseComments,
  UnassignVolunteerFamily,
  UnassignIndividualVolunteer,
  CompleteVolunteerFamilyAssignmentRequirement,
  CompleteIndividualVolunteerAssignmentRequirement,
  FamilyVolunteerAssignment,
  IndividualVolunteerAssignment,
  ExemptIndividualVolunteerAssignmentRequirement,
  ExemptVolunteerFamilyAssignmentRequirement,
  MarkIndividualVolunteerAssignmentRequirementIncomplete,
  MarkVolunteerFamilyAssignmentRequirementIncomplete,
  UnexemptIndividualVolunteerAssignmentRequirement,
  UnexemptVolunteerFamilyAssignmentRequirement,
  UpdateArrangementComments,
  ReopenArrangements,
  EditArrangementStartTime,
  DeleteChildLocationChange,
  PlanArrangementStart,
  PlanArrangementEnd,
  PlanChildLocationChange,
  DeletePlannedChildLocationChange,
  DeleteArrangements,
  ReferralRecordsCommand as V1CaseRecordsCommand,
  ArrangementRecordsCommand,
  EditArrangementReason,
  EditArrangementRequestedAt,
  EditArrangementEndTime,
  EditArrangementCancelledAt,
} from '../GeneratedClient';
import { useAtomicRecordsCommandCallback } from './DirectoryModel';
import { visibleFamiliesQuery } from './Data';
import { convertUtcDateToLocalDate } from '../Utilities/dateUtils';
import { commandFactory } from './CommandFactory';

export const partneringFamiliesData = selector({
  key: 'partneringFamiliesData',
  get: ({ get }) => {
    const visibleFamilies = get(visibleFamiliesQuery);
    return visibleFamilies.filter((f) => f.partneringFamilyInfo);
  },
});

function useV1CaseCommandCallbackWithLocation<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<V1CaseCommand>
) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    const command = new V1CaseRecordsCommand();
    command.command = await callback(familyId, ...args);
    return command;
  });
}

function useArrangementsCommandCallbackWithLocation<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<ArrangementsCommand>
) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    const command = new ArrangementRecordsCommand();
    command.command = await callback(familyId, ...args);
    return command;
  });
}

export function useV1CasesModel() {
  const completeV1CaseRequirement = useV1CaseCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      requirementName: string,
      _requirement: ActionRequirement,
      completedAtLocal: Date,
      documentId: string | null,
      noteId: string | null
    ) => {
      const command = commandFactory(CompleteV1CaseRequirement, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        completedRequirementId: crypto.randomUUID(),
        requirementName: requirementName,
        completedAtUtc: completedAtLocal,
        uploadedDocumentId: documentId ?? undefined,
        noteId: noteId ?? undefined,
      });
      return command;
    }
  );
  const markV1CaseRequirementIncomplete = useV1CaseCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      completedRequirement: CompletedRequirementInfo
    ) => {
      const command = commandFactory(MarkV1CaseRequirementIncomplete, {
        familyId: partneringFamilyId,
        referralId: referralId,
        requirementName: completedRequirement.requirementName,
        completedRequirementId: completedRequirement.completedRequirementId,
      });
      return command;
    }
  );
  const exemptV1CaseRequirement = useV1CaseCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      requirementName: string,
      additionalComments: string,
      exemptionExpiresAtLocal: Date | null
    ) => {
      const command = commandFactory(ExemptV1CaseRequirement, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        requirementName: requirementName,
        additionalComments: additionalComments,
        exemptionExpiresAtUtc: exemptionExpiresAtLocal ?? undefined,
      });
      return command;
    }
  );
  const unexemptV1CaseRequirement = useV1CaseCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      exemptedRequirement: ExemptedRequirementInfo
    ) => {
      const command = commandFactory(UnexemptV1CaseRequirement, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        requirementName: exemptedRequirement.requirementName,
      });
      return command;
    }
  );
  const updateCustomV1CaseField = useV1CaseCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      customField: CustomField,
      value: boolean | string | null
    ) => {
      const command = commandFactory(UpdateCustomV1CaseField, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        completedCustomFieldId: crypto.randomUUID(),
        customFieldName: customField.name,
        customFieldType: customField.type,
        value: value,
      });
      return command;
    }
  );
  const updateV1CaseComments = useV1CaseCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      comments: string | undefined
    ) => {
      const command = commandFactory(UpdateV1CaseComments, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        comments: comments,
      });
      return command;
    }
  );
  const completeArrangementRequirement =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementIds: string[],
        requirementName: string,
        _requirement: ActionRequirement,
        completedAtLocal: Date,
        documentId: string | null,
        noteId: string | null
      ) => {
        const command = commandFactory(CompleteArrangementRequirement, {
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: arrangementIds,
          completedRequirementId: crypto.randomUUID(),
          requirementName: requirementName,
          completedAtUtc: completedAtLocal,
          uploadedDocumentId: documentId ?? undefined,
          noteId: noteId ?? undefined,
        });
        return command;
      }
    );
  const markArrangementRequirementIncomplete =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementId: string,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command = commandFactory(MarkArrangementRequirementIncomplete, {
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: [arrangementId],
          requirementName: completedRequirement.requirementName,
          completedRequirementId: completedRequirement.completedRequirementId,
        });
        return command;
      }
    );
  const exemptArrangementRequirement =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementIds: string[],
        requirement: MissingArrangementRequirement,
        exemptAll: boolean,
        additionalComments: string,
        exemptionExpiresAtLocal: Date | null
      ) => {
        const dueDateUtc = requirement.dueBy || requirement.pastDueSince;

        const command = commandFactory(ExemptArrangementRequirement, {
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: arrangementIds,
          requirementName: requirement.action?.actionName,
          dueDate: exemptAll
            ? undefined
            : dueDateUtc && convertUtcDateToLocalDate(dueDateUtc),
          additionalComments: additionalComments,
          exemptionExpiresAtUtc: exemptionExpiresAtLocal ?? undefined,
        });
        return command;
      }
    );
  const unexemptArrangementRequirement =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementId: string,
        exemptedRequirement: ExemptedRequirementInfo
      ) => {
        const command = commandFactory(UnexemptArrangementRequirement, {
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: [arrangementId],
          requirementName: exemptedRequirement.requirementName,
          dueDate: exemptedRequirement.dueDate,
        });
        return command;
      }
    );

  const completeVolunteerFamilyAssignmentRequirement =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementIds: string[],
        assignment: FamilyVolunteerAssignment,
        requirementName: string,
        _requirement: ActionRequirement,
        completedAtLocal: Date,
        documentId: string | null,
        noteId: string | null
      ) => {
        const command = commandFactory(
          CompleteVolunteerFamilyAssignmentRequirement,
          {
            familyId: partneringFamilyId,
            referralId: v1CaseId,
            arrangementIds: arrangementIds,
            arrangementFunction: assignment.arrangementFunction,
            arrangementFunctionVariant: assignment.arrangementFunctionVariant,
            volunteerFamilyId: assignment.familyId,
            completedRequirementId: crypto.randomUUID(),
            requirementName: requirementName,
            completedAtUtc: completedAtLocal,
            uploadedDocumentId: documentId ?? undefined,
            noteId: noteId ?? undefined,
          }
        );
        return command;
      }
    );
  const markVolunteerFamilyAssignmentRequirementIncomplete =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementId: string,
        assignment: FamilyVolunteerAssignment,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command = commandFactory(
          MarkVolunteerFamilyAssignmentRequirementIncomplete,
          {
            familyId: partneringFamilyId,
            referralId: v1CaseId,
            arrangementIds: [arrangementId],
            arrangementFunction: assignment.arrangementFunction,
            arrangementFunctionVariant: assignment.arrangementFunctionVariant,
            volunteerFamilyId: assignment.familyId,
            requirementName: completedRequirement.requirementName,
            completedRequirementId: completedRequirement.completedRequirementId,
          }
        );
        return command;
      }
    );
  const exemptVolunteerFamilyAssignmentRequirement =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementIds: string[],
        assignment: FamilyVolunteerAssignment,
        requirement: MissingArrangementRequirement,
        exemptAll: boolean,
        additionalComments: string,
        exemptionExpiresAtLocal: Date | null
      ) => {
        const dueDateUtc = requirement.dueBy || requirement.pastDueSince;

        const command = commandFactory(
          ExemptVolunteerFamilyAssignmentRequirement,
          {
            familyId: partneringFamilyId,
            referralId: v1CaseId,
            arrangementIds: arrangementIds,
            arrangementFunction: assignment.arrangementFunction,
            arrangementFunctionVariant: assignment.arrangementFunctionVariant,
            volunteerFamilyId: assignment.familyId,
            requirementName: requirement.action?.actionName,
            dueDate: exemptAll
              ? undefined
              : dueDateUtc && convertUtcDateToLocalDate(dueDateUtc),
            additionalComments: additionalComments,
            exemptionExpiresAtUtc: exemptionExpiresAtLocal ?? undefined,
          }
        );

        return command;
      }
    );
  const unexemptVolunteerFamilyAssignmentRequirement =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementId: string,
        assignment: FamilyVolunteerAssignment,
        exemptedRequirement: ExemptedRequirementInfo
      ) => {
        const command = commandFactory(
          UnexemptVolunteerFamilyAssignmentRequirement,
          {
            familyId: partneringFamilyId,
            referralId: v1CaseId,
            arrangementIds: [arrangementId],
            arrangementFunction: assignment.arrangementFunction,
            arrangementFunctionVariant: assignment.arrangementFunctionVariant,
            volunteerFamilyId: assignment.familyId,
            requirementName: exemptedRequirement.requirementName,
            dueDate: exemptedRequirement.dueDate,
          }
        );
        return command;
      }
    );

  const completeIndividualVolunteerAssignmentRequirement =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementIds: string[],
        assignment: IndividualVolunteerAssignment,
        requirementName: string,
        _requirement: ActionRequirement,
        completedAtLocal: Date,
        documentId: string | null,
        noteId: string | null
      ) => {
        const command = commandFactory(
          CompleteIndividualVolunteerAssignmentRequirement,
          {
            familyId: partneringFamilyId,
            referralId: v1CaseId,
            arrangementIds: arrangementIds,
            arrangementFunction: assignment.arrangementFunction,
            arrangementFunctionVariant: assignment.arrangementFunctionVariant,
            volunteerFamilyId: assignment.familyId,
            personId: assignment.personId,
            completedRequirementId: crypto.randomUUID(),
            requirementName: requirementName,
            completedAtUtc: completedAtLocal,
            uploadedDocumentId: documentId ?? undefined,
            noteId: noteId ?? undefined,
          }
        );
        return command;
      }
    );
  const markIndividualVolunteerAssignmentRequirementIncomplete =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementId: string,
        assignment: IndividualVolunteerAssignment,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command = commandFactory(
          MarkIndividualVolunteerAssignmentRequirementIncomplete,
          {
            familyId: partneringFamilyId,
            referralId: v1CaseId,
            arrangementIds: [arrangementId],
            arrangementFunction: assignment.arrangementFunction,
            arrangementFunctionVariant: assignment.arrangementFunctionVariant,
            volunteerFamilyId: assignment.familyId,
            personId: assignment.personId,
            requirementName: completedRequirement.requirementName,
            completedRequirementId: completedRequirement.completedRequirementId,
          }
        );
        return command;
      }
    );
  const exemptIndividualVolunteerAssignmentRequirement =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementIds: string[],
        assignment: IndividualVolunteerAssignment,
        requirement: MissingArrangementRequirement,
        exemptAll: boolean,
        additionalComments: string,
        exemptionExpiresAtLocal: Date | null
      ) => {
        const command = commandFactory(
          ExemptIndividualVolunteerAssignmentRequirement,
          {
            familyId: partneringFamilyId,
            referralId: v1CaseId,
            arrangementIds: arrangementIds,
            arrangementFunction: assignment.arrangementFunction,
            arrangementFunctionVariant: assignment.arrangementFunctionVariant,
            volunteerFamilyId: assignment.familyId,
            personId: assignment.personId,
            requirementName: requirement.action?.actionName,
            dueDate: exemptAll
              ? undefined
              : requirement.dueBy || requirement.pastDueSince,
            additionalComments: additionalComments,
            exemptionExpiresAtUtc: exemptionExpiresAtLocal ?? undefined,
          }
        );
        return command;
      }
    );
  const unexemptIndividualVolunteerAssignmentRequirement =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementId: string,
        assignment: IndividualVolunteerAssignment,
        exemptedRequirement: ExemptedRequirementInfo
      ) => {
        const command = commandFactory(
          UnexemptIndividualVolunteerAssignmentRequirement,
          {
            familyId: partneringFamilyId,
            referralId: v1CaseId,
            arrangementIds: [arrangementId],
            arrangementFunction: assignment.arrangementFunction,
            arrangementFunctionVariant: assignment.arrangementFunctionVariant,
            volunteerFamilyId: assignment.familyId,
            personId: assignment.personId,
            requirementName: exemptedRequirement.requirementName,
            dueDate: exemptedRequirement.dueDate,
          }
        );
        return command;
      }
    );

  const createArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementType: string,
      requestedAtLocal: Date,
      partneringFamilyPersonId: string,
      reason: string | null
    ) => {
      const command = commandFactory(CreateArrangement, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [crypto.randomUUID()],
        arrangementType: arrangementType,
        requestedAtUtc: requestedAtLocal,
        partneringFamilyPersonId: partneringFamilyPersonId,
        reason: reason || undefined,
      });
      return command;
    }
  );

  const planArrangementStart = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      plannedStartLocal: Date | null
    ) => {
      const command = commandFactory(PlanArrangementStart, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        plannedStartUtc: plannedStartLocal || undefined,
      });
      return command;
    }
  );
  const startArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      startedAtLocal: Date
    ) => {
      const command = commandFactory(StartArrangements, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        startedAtUtc: startedAtLocal,
      });
      return command;
    }
  );
  const editArrangementStartTime = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      startedAtLocal: Date
    ) => {
      const command = commandFactory(EditArrangementStartTime, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        startedAtUtc: startedAtLocal,
      });
      return command;
    }
  );
  const editArrangementEndTime = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      endedAtLocal: Date
    ) => {
      const command = commandFactory(EditArrangementEndTime, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        endedAtUtc: endedAtLocal,
      });
      return command;
    }
  );
  const editArrangementRequestedAt = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      requestedAtLocal: Date
    ) => {
      const command = commandFactory(EditArrangementRequestedAt, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        requestedAtUtc: requestedAtLocal,
      });
      return command;
    }
  );
  const editArrangementCancelledAt = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      cancelledAtLocal: Date
    ) => {
      const command = commandFactory(EditArrangementCancelledAt, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        cancelledAtUtc: cancelledAtLocal,
      });
      return command;
    }
  );
  const planArrangementEnd = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      plannedEndLocal: Date | null
    ) => {
      const command = commandFactory(PlanArrangementEnd, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],

        plannedEndUtc: plannedEndLocal || undefined,
      });
      return command;
    }
  );
  const endArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      endedAtLocal: Date
    ) => {
      const command = commandFactory(EndArrangements, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        endedAtUtc: endedAtLocal,
      });
      return command;
    }
  );
  const reopenArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      noteId: string | null
    ) => {
      const command = commandFactory(ReopenArrangements, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        noteId: noteId ?? undefined,
      });
      return command;
    }
  );
  const cancelArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      cancelledAtLocal: Date
    ) => {
      const command = commandFactory(CancelArrangementsSetup, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        cancelledAtUtc: cancelledAtLocal,
      });
      return command;
    }
  );
  const deleteArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string
    ) => {
      const command = commandFactory(DeleteArrangements, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      return command;
    }
  );
  const assignVolunteerFamily = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      volunteerFamilyId: string,
      arrangementFunction: string,
      arrangementFunctionVariant?: string
    ) => {
      const command = commandFactory(AssignVolunteerFamily, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        volunteerFamilyId: volunteerFamilyId,
        arrangementFunction: arrangementFunction,
        arrangementFunctionVariant: arrangementFunctionVariant,
      });
      return command;
    }
  );
  const assignIndividualVolunteer = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      volunteerFamilyId: string,
      personId: string,
      arrangementFunction: string,
      arrangementFunctionVariant?: string
    ) => {
      const command = commandFactory(AssignIndividualVolunteer, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        volunteerFamilyId: volunteerFamilyId,
        personId: personId,
        arrangementFunction: arrangementFunction,
        arrangementFunctionVariant: arrangementFunctionVariant,
      });
      return command;
    }
  );
  const unassignVolunteerFamily = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      volunteerFamilyId: string,
      arrangementFunction: string,
      arrangementFunctionVariant?: string
    ) => {
      const command = commandFactory(UnassignVolunteerFamily, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        volunteerFamilyId: volunteerFamilyId,
        arrangementFunction: arrangementFunction,
        arrangementFunctionVariant: arrangementFunctionVariant,
      });
      return command;
    }
  );
  const unassignIndividualVolunteer =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        v1CaseId: string,
        arrangementId: string,
        volunteerFamilyId: string,
        personId: string,
        arrangementFunction: string,
        arrangementFunctionVariant?: string
      ) => {
        const command = commandFactory(UnassignIndividualVolunteer, {
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: [arrangementId],
          volunteerFamilyId: volunteerFamilyId,
          personId: personId,
          arrangementFunction: arrangementFunction,
          arrangementFunctionVariant: arrangementFunctionVariant,
        });
        return command;
      }
    );
  const trackChildLocation = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      childLocationFamilyId: string,
      childLocationAdultId: string,
      changedAtLocal: Date,
      childLocationPlan: ChildLocationPlan,
      noteId: string | null
    ) => {
      const command = commandFactory(TrackChildLocationChange, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        childLocationFamilyId: childLocationFamilyId,
        childLocationReceivingAdultId: childLocationAdultId,
        changedAtUtc: changedAtLocal,
        plan: childLocationPlan,
        noteId: noteId ?? undefined,
      });
      return command;
    }
  );
  const deleteChildLocationEntry = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      childLocationFamilyId: string,
      childLocationAdultId: string,
      changedAtLocal: Date,
      noteId: string | null
    ) => {
      const command = commandFactory(DeleteChildLocationChange, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        childLocationFamilyId: childLocationFamilyId,
        childLocationReceivingAdultId: childLocationAdultId,
        changedAtUtc: changedAtLocal,
        noteId: noteId ?? undefined,
      });
      return command;
    }
  );
  const planChildLocation = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      childLocationFamilyId: string,
      childLocationAdultId: string,
      changedAtLocal: Date,
      childLocationPlan: ChildLocationPlan
    ) => {
      const command = commandFactory(PlanChildLocationChange, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        childLocationFamilyId: childLocationFamilyId,
        childLocationReceivingAdultId: childLocationAdultId,
        plannedChangeUtc: changedAtLocal,
        plan: childLocationPlan,
      });
      return command;
    }
  );
  const deleteChildLocationPlan = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      childLocationFamilyId: string,
      childLocationAdultId: string,
      changedAtLocal: Date
    ) => {
      const command = commandFactory(DeletePlannedChildLocationChange, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        childLocationFamilyId: childLocationFamilyId,
        childLocationReceivingAdultId: childLocationAdultId,
        plannedChangeUtc: changedAtLocal,
      });
      return command;
    }
  );
  const updateArrangementComments = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      comments: string | undefined
    ) => {
      const command = commandFactory(UpdateArrangementComments, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        comments: comments,
      });
      return command;
    }
  );
  const editArrangementReason = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string,
      reason: string | null
    ) => {
      const command = commandFactory(EditArrangementReason, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
        reason: reason || undefined,
      });
      return command;
    }
  );
  const closeV1Case = useV1CaseCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      reason: V1CaseCloseReason,
      closedAtLocal: Date
    ) => {
      const command = commandFactory(CloseV1Case, {
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        closeReason: reason,
        closedAtUtc: closedAtLocal,
      });
      return command;
    }
  );
  const openV1Case = useV1CaseCommandCallbackWithLocation(
    async (partneringFamilyId: string, openedAtLocal: Date) => {
      const command = commandFactory(CreateV1Case, {
        familyId: partneringFamilyId,
        referralId: crypto.randomUUID(),
        openedAtUtc: openedAtLocal,
      });
      return command;
    }
  );

  return {
    completeV1CaseRequirement,
    markV1CaseRequirementIncomplete,
    exemptV1CaseRequirement,
    unexemptV1CaseRequirement,
    updateCustomV1CaseField,
    updateV1CaseComments,
    completeArrangementRequirement,
    markArrangementRequirementIncomplete,
    exemptArrangementRequirement,
    unexemptArrangementRequirement,
    completeVolunteerFamilyAssignmentRequirement,
    markVolunteerFamilyAssignmentRequirementIncomplete,
    exemptVolunteerFamilyAssignmentRequirement,
    unexemptVolunteerFamilyAssignmentRequirement,
    completeIndividualVolunteerAssignmentRequirement,
    markIndividualVolunteerAssignmentRequirementIncomplete,
    exemptIndividualVolunteerAssignmentRequirement,
    unexemptIndividualVolunteerAssignmentRequirement,
    createArrangement,
    planArrangementStart,
    startArrangement,
    editArrangementStartTime,
    editArrangementEndTime,
    editArrangementRequestedAt,
    editArrangementCancelledAt,
    planArrangementEnd,
    endArrangement,
    reopenArrangement,
    cancelArrangement,
    deleteArrangement,
    assignVolunteerFamily,
    assignIndividualVolunteer,
    unassignVolunteerFamily,
    unassignIndividualVolunteer,
    trackChildLocation,
    deleteChildLocationEntry,
    planChildLocation,
    deleteChildLocationPlan,
    updateArrangementComments,
    editArrangementReason,
    closeV1Case,
    openV1Case,
  };
}
