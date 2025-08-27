import { selector } from 'recoil';
import {
  ReferralCommand,
  ArrangementsCommand,
  ActionRequirement,
  CompleteReferralRequirement,
  CreateArrangement,
  CompleteArrangementRequirement,
  StartArrangements,
  EndArrangements,
  AssignVolunteerFamily,
  AssignIndividualVolunteer,
  ReferralCloseReason,
  CloseReferral,
  CreateReferral,
  TrackChildLocationChange,
  ChildLocationPlan,
  UpdateCustomReferralField,
  CustomField,
  ExemptReferralRequirement,
  UnexemptReferralRequirement,
  ExemptArrangementRequirement,
  UnexemptArrangementRequirement,
  MissingArrangementRequirement,
  ExemptedRequirementInfo,
  MarkReferralRequirementIncomplete,
  CompletedRequirementInfo,
  MarkArrangementRequirementIncomplete,
  CancelArrangementsSetup,
  UpdateReferralComments,
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
  ReferralRecordsCommand,
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

function useReferralCommandCallbackWithLocation<T extends unknown[]>(
  callback: (familyId: string, ...args: T) => Promise<ReferralCommand>
) {
  return useAtomicRecordsCommandCallback(async (familyId, ...args: T) => {
    const command = new ReferralRecordsCommand();
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

export function useReferralsModel() {
  const completeReferralRequirement = useReferralCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      requirementName: string,
      _requirement: ActionRequirement,
      completedAtLocal: Date,
      documentId: string | null,
      noteId: string | null
    ) => {
      const command = commandFactory(CompleteReferralRequirement, {
        familyId: partneringFamilyId,
        referralId: referralId,
        completedRequirementId: crypto.randomUUID(),
        requirementName: requirementName,
        completedAtUtc: completedAtLocal,
        uploadedDocumentId: documentId ?? undefined,
        noteId: noteId ?? undefined,
      });
      return command;
    }
  );
  const markReferralRequirementIncomplete =
    useReferralCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        referralId: string,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command = commandFactory(MarkReferralRequirementIncomplete, {
          familyId: partneringFamilyId,
          referralId: referralId,
          requirementName: completedRequirement.requirementName,
          completedRequirementId: completedRequirement.completedRequirementId,
        });
        return command;
      }
    );
  const exemptReferralRequirement = useReferralCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      requirementName: string,
      additionalComments: string,
      exemptionExpiresAtLocal: Date | null
    ) => {
      const command = commandFactory(ExemptReferralRequirement, {
        familyId: partneringFamilyId,
        referralId: referralId,
        requirementName: requirementName,
        additionalComments: additionalComments,
        exemptionExpiresAtUtc: exemptionExpiresAtLocal ?? undefined,
      });
      return command;
    }
  );
  const unexemptReferralRequirement = useReferralCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      exemptedRequirement: ExemptedRequirementInfo
    ) => {
      const command = commandFactory(UnexemptReferralRequirement, {
        familyId: partneringFamilyId,
        referralId: referralId,
        requirementName: exemptedRequirement.requirementName,
      });
      return command;
    }
  );
  const updateCustomReferralField = useReferralCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      customField: CustomField,
      value: boolean | string | null
    ) => {
      const command = commandFactory(UpdateCustomReferralField, {
        familyId: partneringFamilyId,
        referralId: referralId,
        completedCustomFieldId: crypto.randomUUID(),
        customFieldName: customField.name,
        customFieldType: customField.type,
        value: value,
      });
      return command;
    }
  );
  const updateReferralComments = useReferralCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      comments: string | undefined
    ) => {
      const command = commandFactory(UpdateReferralComments, {
        familyId: partneringFamilyId,
        referralId: referralId,
        comments: comments,
      });
      return command;
    }
  );
  const completeArrangementRequirement =
    useArrangementsCommandCallbackWithLocation(
      async (
        partneringFamilyId: string,
        referralId: string,
        arrangementIds: string[],
        requirementName: string,
        _requirement: ActionRequirement,
        completedAtLocal: Date,
        documentId: string | null,
        noteId: string | null
      ) => {
        const command = commandFactory(CompleteArrangementRequirement, {
          familyId: partneringFamilyId,
          referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command = commandFactory(MarkArrangementRequirementIncomplete, {
          familyId: partneringFamilyId,
          referralId: referralId,
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
        referralId: string,
        arrangementIds: string[],
        requirement: MissingArrangementRequirement,
        exemptAll: boolean,
        additionalComments: string,
        exemptionExpiresAtLocal: Date | null
      ) => {
        const dueDateUtc = requirement.dueBy || requirement.pastDueSince;

        const command = commandFactory(ExemptArrangementRequirement, {
          familyId: partneringFamilyId,
          referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        exemptedRequirement: ExemptedRequirementInfo
      ) => {
        const command = commandFactory(UnexemptArrangementRequirement, {
          familyId: partneringFamilyId,
          referralId: referralId,
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
        referralId: string,
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
            referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        assignment: FamilyVolunteerAssignment,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command = commandFactory(
          MarkVolunteerFamilyAssignmentRequirementIncomplete,
          {
            familyId: partneringFamilyId,
            referralId: referralId,
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
        referralId: string,
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
            referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        assignment: FamilyVolunteerAssignment,
        exemptedRequirement: ExemptedRequirementInfo
      ) => {
        const command = commandFactory(
          UnexemptVolunteerFamilyAssignmentRequirement,
          {
            familyId: partneringFamilyId,
            referralId: referralId,
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
        referralId: string,
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
            referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        assignment: IndividualVolunteerAssignment,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command = commandFactory(
          MarkIndividualVolunteerAssignmentRequirementIncomplete,
          {
            familyId: partneringFamilyId,
            referralId: referralId,
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
        referralId: string,
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
            referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        assignment: IndividualVolunteerAssignment,
        exemptedRequirement: ExemptedRequirementInfo
      ) => {
        const command = commandFactory(
          UnexemptIndividualVolunteerAssignmentRequirement,
          {
            familyId: partneringFamilyId,
            referralId: referralId,
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
      referralId: string,
      arrangementType: string,
      requestedAtLocal: Date,
      partneringFamilyPersonId: string,
      reason: string | null
    ) => {
      const command = commandFactory(CreateArrangement, {
        familyId: partneringFamilyId,
        referralId: referralId,
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
      referralId: string,
      arrangementId: string,
      plannedStartLocal: Date | null
    ) => {
      const command = commandFactory(PlanArrangementStart, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
        plannedStartUtc: plannedStartLocal || undefined,
      });
      return command;
    }
  );
  const startArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string,
      startedAtLocal: Date
    ) => {
      const command = commandFactory(StartArrangements, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
        startedAtUtc: startedAtLocal,
      });
      return command;
    }
  );
  const editArrangementStartTime = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string,
      startedAtLocal: Date
    ) => {
      const command = commandFactory(EditArrangementStartTime, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
        startedAtUtc: startedAtLocal,
      });
      return command;
    }
  );
  const editArrangementEndTime = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string,
      endedAtLocal: Date
    ) => {
      const command = commandFactory(EditArrangementEndTime, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
        endedAtUtc: endedAtLocal,
      });
      return command;
    }
  );
  const editArrangementRequestedAt = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string,
      requestedAtLocal: Date
    ) => {
      const command = commandFactory(EditArrangementRequestedAt, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
        requestedAtUtc: requestedAtLocal,
      });
      return command;
    }
  );
  const editArrangementCancelledAt = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string,
      cancelledAtLocal: Date
    ) => {
      const command = commandFactory(EditArrangementCancelledAt, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
        cancelledAtUtc: cancelledAtLocal,
      });
      return command;
    }
  );
  const planArrangementEnd = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string,
      plannedEndLocal: Date | null
    ) => {
      const command = commandFactory(PlanArrangementEnd, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],

        plannedEndUtc: plannedEndLocal || undefined,
      });
      return command;
    }
  );
  const endArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string,
      endedAtLocal: Date
    ) => {
      const command = commandFactory(EndArrangements, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
        endedAtUtc: endedAtLocal,
      });
      return command;
    }
  );
  const reopenArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string,
      noteId: string | null
    ) => {
      const command = commandFactory(ReopenArrangements, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
        noteId: noteId ?? undefined,
      });
      return command;
    }
  );
  const cancelArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string,
      cancelledAtLocal: Date
    ) => {
      const command = commandFactory(CancelArrangementsSetup, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
        cancelledAtUtc: cancelledAtLocal,
      });
      return command;
    }
  );
  const deleteArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string
    ) => {
      const command = commandFactory(DeleteArrangements, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      return command;
    }
  );
  const assignVolunteerFamily = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string,
      volunteerFamilyId: string,
      arrangementFunction: string,
      arrangementFunctionVariant?: string
    ) => {
      const command = commandFactory(AssignVolunteerFamily, {
        familyId: partneringFamilyId,
        referralId: referralId,
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
      referralId: string,
      arrangementId: string,
      volunteerFamilyId: string,
      personId: string,
      arrangementFunction: string,
      arrangementFunctionVariant?: string
    ) => {
      const command = commandFactory(AssignIndividualVolunteer, {
        familyId: partneringFamilyId,
        referralId: referralId,
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
      referralId: string,
      arrangementId: string,
      volunteerFamilyId: string,
      arrangementFunction: string,
      arrangementFunctionVariant?: string
    ) => {
      const command = commandFactory(UnassignVolunteerFamily, {
        familyId: partneringFamilyId,
        referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        volunteerFamilyId: string,
        personId: string,
        arrangementFunction: string,
        arrangementFunctionVariant?: string
      ) => {
        const command = commandFactory(UnassignIndividualVolunteer, {
          familyId: partneringFamilyId,
          referralId: referralId,
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
      referralId: string,
      arrangementId: string,
      childLocationFamilyId: string,
      childLocationAdultId: string,
      changedAtLocal: Date,
      childLocationPlan: ChildLocationPlan,
      noteId: string | null
    ) => {
      const command = commandFactory(TrackChildLocationChange, {
        familyId: partneringFamilyId,
        referralId: referralId,
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
      referralId: string,
      arrangementId: string,
      childLocationFamilyId: string,
      childLocationAdultId: string,
      changedAtLocal: Date,
      noteId: string | null
    ) => {
      const command = commandFactory(DeleteChildLocationChange, {
        familyId: partneringFamilyId,
        referralId: referralId,
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
      referralId: string,
      arrangementId: string,
      childLocationFamilyId: string,
      childLocationAdultId: string,
      changedAtLocal: Date,
      childLocationPlan: ChildLocationPlan
    ) => {
      const command = commandFactory(PlanChildLocationChange, {
        familyId: partneringFamilyId,
        referralId: referralId,
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
      referralId: string,
      arrangementId: string,
      childLocationFamilyId: string,
      childLocationAdultId: string,
      changedAtLocal: Date
    ) => {
      const command = commandFactory(DeletePlannedChildLocationChange, {
        familyId: partneringFamilyId,
        referralId: referralId,
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
      referralId: string,
      arrangementId: string,
      comments: string | undefined
    ) => {
      const command = commandFactory(UpdateArrangementComments, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
        comments: comments,
      });
      return command;
    }
  );
  const editArrangementReason = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string,
      reason: string | null
    ) => {
      const command = commandFactory(EditArrangementReason, {
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
        reason: reason || undefined,
      });
      return command;
    }
  );
  const closeReferral = useReferralCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      reason: ReferralCloseReason,
      closedAtLocal: Date
    ) => {
      const command = commandFactory(CloseReferral, {
        familyId: partneringFamilyId,
        referralId: referralId,
        closeReason: reason,
        closedAtUtc: closedAtLocal,
      });
      return command;
    }
  );
  const openReferral = useReferralCommandCallbackWithLocation(
    async (partneringFamilyId: string, openedAtLocal: Date) => {
      const command = commandFactory(CreateReferral, {
        familyId: partneringFamilyId,
        referralId: crypto.randomUUID(),
        openedAtUtc: openedAtLocal,
      });
      return command;
    }
  );

  return {
    completeReferralRequirement,
    markReferralRequirementIncomplete,
    exemptReferralRequirement,
    unexemptReferralRequirement,
    updateCustomReferralField,
    updateReferralComments,
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
    closeReferral,
    openReferral,
  };
}
