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
      const command = CompleteReferralRequirement.fromJS({
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
        const command = MarkReferralRequirementIncomplete.fromJS({
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
      const command = ExemptReferralRequirement.fromJS({
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
      const command = UnexemptReferralRequirement.fromJS({
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
      const command = UpdateCustomReferralField.fromJS({
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
      const command = UpdateReferralComments.fromJS({
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
        const command = CompleteArrangementRequirement.fromJS({
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
        const command = MarkArrangementRequirementIncomplete.fromJS({
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

        const command = ExemptArrangementRequirement.fromJS({
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
        const command = UnexemptArrangementRequirement.fromJS({
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
        const command = CompleteVolunteerFamilyAssignmentRequirement.fromJS({
          familyId: partneringFamilyId,
          referralId: referralId,
          arrangementIds: arrangementIds,
          arrangementFunction: assignment.arrangementFunction,
          arrangementFunctionVariant: assignment.arrangementFunctionVariant,
          volunteerFamilyId: assignment.familyId,
          requirementName: requirementName,
          completedAtUtc: completedAtLocal,
          uploadedDocumentId: documentId ?? undefined,
          noteId: noteId ?? undefined,
        });
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
        const command =
          MarkVolunteerFamilyAssignmentRequirementIncomplete.fromJS({
            familyId: partneringFamilyId,
            referralId: referralId,
            arrangementIds: [arrangementId],
            arrangementFunction: assignment.arrangementFunction,
            arrangementFunctionVariant: assignment.arrangementFunctionVariant,
            volunteerFamilyId: assignment.familyId,
            requirementName: completedRequirement.requirementName,
            completedRequirementId: completedRequirement.completedRequirementId,
          });
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

        const command = ExemptVolunteerFamilyAssignmentRequirement.fromJS({
          familyId: partneringFamilyId,
          referralId: referralId,
          arrangementIds: arrangementIds,
        });
        command.arrangementFunction = assignment.arrangementFunction;
        command.arrangementFunctionVariant =
          assignment.arrangementFunctionVariant;
        command.volunteerFamilyId = assignment.familyId;
        command.requirementName = requirement.action?.actionName;
        command.dueDate = exemptAll
          ? undefined
          : dueDateUtc && convertUtcDateToLocalDate(dueDateUtc);
        command.additionalComments = additionalComments;
        command.exemptionExpiresAtUtc = exemptionExpiresAtLocal ?? undefined;
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
        const command = UnexemptVolunteerFamilyAssignmentRequirement.fromJS({
          familyId: partneringFamilyId,
          referralId: referralId,
          arrangementIds: [arrangementId],
        });
        command.arrangementFunction = assignment.arrangementFunction;
        command.arrangementFunctionVariant =
          assignment.arrangementFunctionVariant;
        command.volunteerFamilyId = assignment.familyId;
        command.requirementName = exemptedRequirement.requirementName;
        command.dueDate = exemptedRequirement.dueDate;
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
        const command = CompleteIndividualVolunteerAssignmentRequirement.fromJS(
          {
            familyId: partneringFamilyId,
            referralId: referralId,
            arrangementIds: arrangementIds,
          }
        );
        command.arrangementFunction = assignment.arrangementFunction;
        command.arrangementFunctionVariant =
          assignment.arrangementFunctionVariant;
        command.volunteerFamilyId = assignment.familyId;
        command.personId = assignment.personId;
        command.requirementName = requirementName;
        command.completedAtUtc = completedAtLocal;
        if (documentId != null) command.uploadedDocumentId = documentId;
        if (noteId != null) command.noteId = noteId;
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
        const command =
          MarkIndividualVolunteerAssignmentRequirementIncomplete.fromJS({
            familyId: partneringFamilyId,
            referralId: referralId,
            arrangementIds: [arrangementId],
          });
        command.arrangementFunction = assignment.arrangementFunction;
        command.arrangementFunctionVariant =
          assignment.arrangementFunctionVariant;
        command.volunteerFamilyId = assignment.familyId;
        command.personId = assignment.personId;
        command.requirementName = completedRequirement.requirementName;
        command.completedRequirementId =
          completedRequirement.completedRequirementId;
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
        const command = ExemptIndividualVolunteerAssignmentRequirement.fromJS({
          familyId: partneringFamilyId,
          referralId: referralId,
          arrangementIds: arrangementIds,
        });
        command.arrangementFunction = assignment.arrangementFunction;
        command.arrangementFunctionVariant =
          assignment.arrangementFunctionVariant;
        command.volunteerFamilyId = assignment.familyId;
        command.personId = assignment.personId;
        command.requirementName = requirement.action?.actionName;
        command.dueDate = exemptAll
          ? undefined
          : requirement.dueBy || requirement.pastDueSince;
        command.additionalComments = additionalComments;
        command.exemptionExpiresAtUtc = exemptionExpiresAtLocal ?? undefined;
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
        const command = UnexemptIndividualVolunteerAssignmentRequirement.fromJS(
          {
            familyId: partneringFamilyId,
            referralId: referralId,
            arrangementIds: [arrangementId],
          }
        );
        command.arrangementFunction = assignment.arrangementFunction;
        command.arrangementFunctionVariant =
          assignment.arrangementFunctionVariant;
        command.volunteerFamilyId = assignment.familyId;
        command.personId = assignment.personId;
        command.requirementName = exemptedRequirement.requirementName;
        command.dueDate = exemptedRequirement.dueDate;
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
      const command = CreateArrangement.fromJS({
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
      const command = PlanArrangementStart.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.plannedStartUtc = plannedStartLocal || undefined;
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
      const command = StartArrangements.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.startedAtUtc = startedAtLocal;
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
      const command = EditArrangementStartTime.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.startedAtUtc = startedAtLocal;
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
      const command = EditArrangementEndTime.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.endedAtUtc = endedAtLocal;
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
      const command = EditArrangementRequestedAt.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.requestedAtUtc = requestedAtLocal;
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
      const command = EditArrangementCancelledAt.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.cancelledAtUtc = cancelledAtLocal;
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
      const command = PlanArrangementEnd.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.plannedEndUtc = plannedEndLocal || undefined;
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
      const command = EndArrangements.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.endedAtUtc = endedAtLocal;
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
      const command = ReopenArrangements.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      if (noteId != null) command.noteId = noteId;
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
      const command = CancelArrangementsSetup.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.cancelledAtUtc = cancelledAtLocal;
      return command;
    }
  );
  const deleteArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      arrangementId: string
    ) => {
      const command = DeleteArrangements.fromJS({
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
      const command = AssignVolunteerFamily.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.volunteerFamilyId = volunteerFamilyId;
      command.arrangementFunction = arrangementFunction;
      command.arrangementFunctionVariant = arrangementFunctionVariant;
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
      const command = AssignIndividualVolunteer.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.volunteerFamilyId = volunteerFamilyId;
      command.personId = personId;
      command.arrangementFunction = arrangementFunction;
      command.arrangementFunctionVariant = arrangementFunctionVariant;
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
      const command = UnassignVolunteerFamily.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.volunteerFamilyId = volunteerFamilyId;
      command.arrangementFunction = arrangementFunction;
      command.arrangementFunctionVariant = arrangementFunctionVariant;
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
        const command = UnassignIndividualVolunteer.fromJS({
          familyId: partneringFamilyId,
          referralId: referralId,
          arrangementIds: [arrangementId],
        });
        command.volunteerFamilyId = volunteerFamilyId;
        command.personId = personId;
        command.arrangementFunction = arrangementFunction;
        command.arrangementFunctionVariant = arrangementFunctionVariant;
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
      const command = TrackChildLocationChange.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.childLocationFamilyId = childLocationFamilyId;
      command.childLocationReceivingAdultId = childLocationAdultId;
      command.changedAtUtc = changedAtLocal;
      command.plan = childLocationPlan;
      if (noteId != null) command.noteId = noteId;
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
      const command = DeleteChildLocationChange.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.childLocationFamilyId = childLocationFamilyId;
      command.childLocationReceivingAdultId = childLocationAdultId;
      command.changedAtUtc = changedAtLocal;
      if (noteId != null) command.noteId = noteId;
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
      const command = PlanChildLocationChange.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.childLocationFamilyId = childLocationFamilyId;
      command.childLocationReceivingAdultId = childLocationAdultId;
      command.plannedChangeUtc = changedAtLocal;
      command.plan = childLocationPlan;
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
      const command = DeletePlannedChildLocationChange.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.childLocationFamilyId = childLocationFamilyId;
      command.childLocationReceivingAdultId = childLocationAdultId;
      command.plannedChangeUtc = changedAtLocal;
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
      const command = UpdateArrangementComments.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.comments = comments;
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
      const command = EditArrangementReason.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
        arrangementIds: [arrangementId],
      });
      command.reason = reason || undefined;
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
      const command = CloseReferral.fromJS({
        familyId: partneringFamilyId,
        referralId: referralId,
      });
      command.closeReason = reason;
      command.closedAtUtc = closedAtLocal;
      return command;
    }
  );
  const openReferral = useReferralCommandCallbackWithLocation(
    async (partneringFamilyId: string, openedAtLocal: Date) => {
      const command = CreateReferral.fromJS({
        familyId: partneringFamilyId,
      });
      command.referralId = crypto.randomUUID();
      command.openedAtUtc = openedAtLocal;
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
