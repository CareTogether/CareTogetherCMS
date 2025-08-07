import { selector } from 'recoil';
import {
  V1CaseCommand,
  ArrangementsCommand,
  ActionRequirement,
  CompleteReferralRequirement as CompleteV1CaseRequirement,
  CreateArrangement,
  CompleteArrangementRequirement,
  StartArrangements,
  EndArrangements,
  AssignVolunteerFamily,
  AssignIndividualVolunteer,
  V1CaseCloseReason,
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
      const command = new CompleteV1CaseRequirement({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
      });
      command.completedRequirementId = crypto.randomUUID();
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null) command.uploadedDocumentId = documentId;
      if (noteId != null) command.noteId = noteId;
      return command;
    }
  );
  const markV1CaseRequirementIncomplete = useV1CaseCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      completedRequirement: CompletedRequirementInfo
    ) => {
      const command = new MarkV1CaseRequirementIncomplete({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
      });
      command.requirementName = completedRequirement.requirementName;
      command.completedRequirementId =
        completedRequirement.completedRequirementId;
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
      const command = new ExemptV1CaseRequirement({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
      });
      command.requirementName = requirementName;
      command.additionalComments = additionalComments;
      command.exemptionExpiresAtUtc = exemptionExpiresAtLocal ?? undefined;
      return command;
    }
  );
  const unexemptV1CaseRequirement = useV1CaseCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      exemptedRequirement: ExemptedRequirementInfo
    ) => {
      const command = new UnexemptV1CaseRequirement({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
      });
      command.requirementName = exemptedRequirement.requirementName;
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
      const command = new UpdateCustomV1CaseField({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
      });
      command.completedCustomFieldId = crypto.randomUUID();
      command.customFieldName = customField.name;
      command.customFieldType = customField.type;
      command.value = value;
      return command;
    }
  );
  const updateV1CaseComments = useV1CaseCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      comments: string | undefined
    ) => {
      const command = new UpdateV1CaseComments({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
      });
      command.comments = comments;
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
        const command = new CompleteArrangementRequirement({
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: arrangementIds,
        });
        command.completedRequirementId = crypto.randomUUID();
        command.requirementName = requirementName;
        command.completedAtUtc = completedAtLocal;
        if (documentId != null) command.uploadedDocumentId = documentId;
        if (noteId != null) command.noteId = noteId;
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
        const command = new MarkArrangementRequirementIncomplete({
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: [arrangementId],
        });
        command.requirementName = completedRequirement.requirementName;
        command.completedRequirementId =
          completedRequirement.completedRequirementId;
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

        const command = new ExemptArrangementRequirement({
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: arrangementIds,
        });
        command.requirementName = requirement.actionName;
        command.dueDate = exemptAll
          ? undefined
          : dueDateUtc && convertUtcDateToLocalDate(dueDateUtc);
        command.additionalComments = additionalComments;
        command.exemptionExpiresAtUtc = exemptionExpiresAtLocal ?? undefined;
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
        const command = new UnexemptArrangementRequirement({
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: [arrangementId],
        });
        command.requirementName = exemptedRequirement.requirementName;
        command.dueDate = exemptedRequirement.dueDate;
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
        const command = new CompleteVolunteerFamilyAssignmentRequirement({
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: arrangementIds,
        });
        command.arrangementFunction = assignment.arrangementFunction;
        command.arrangementFunctionVariant =
          assignment.arrangementFunctionVariant;
        command.volunteerFamilyId = assignment.familyId;
        command.requirementName = requirementName;
        command.completedAtUtc = completedAtLocal;
        if (documentId != null) command.uploadedDocumentId = documentId;
        if (noteId != null) command.noteId = noteId;
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
        const command = new MarkVolunteerFamilyAssignmentRequirementIncomplete({
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: [arrangementId],
        });
        command.arrangementFunction = assignment.arrangementFunction;
        command.arrangementFunctionVariant =
          assignment.arrangementFunctionVariant;
        command.volunteerFamilyId = assignment.familyId;
        command.requirementName = completedRequirement.requirementName;
        command.completedRequirementId =
          completedRequirement.completedRequirementId;
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

        const command = new ExemptVolunteerFamilyAssignmentRequirement({
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: arrangementIds,
        });
        command.arrangementFunction = assignment.arrangementFunction;
        command.arrangementFunctionVariant =
          assignment.arrangementFunctionVariant;
        command.volunteerFamilyId = assignment.familyId;
        command.requirementName = requirement.actionName;
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
        v1CaseId: string,
        arrangementId: string,
        assignment: FamilyVolunteerAssignment,
        exemptedRequirement: ExemptedRequirementInfo
      ) => {
        const command = new UnexemptVolunteerFamilyAssignmentRequirement({
          familyId: partneringFamilyId,
          referralId: v1CaseId,
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
        v1CaseId: string,
        arrangementIds: string[],
        assignment: IndividualVolunteerAssignment,
        requirementName: string,
        _requirement: ActionRequirement,
        completedAtLocal: Date,
        documentId: string | null,
        noteId: string | null
      ) => {
        const command = new CompleteIndividualVolunteerAssignmentRequirement({
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: arrangementIds,
        });
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
        v1CaseId: string,
        arrangementId: string,
        assignment: IndividualVolunteerAssignment,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command =
          new MarkIndividualVolunteerAssignmentRequirementIncomplete({
            familyId: partneringFamilyId,
            referralId: v1CaseId,
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
        v1CaseId: string,
        arrangementIds: string[],
        assignment: IndividualVolunteerAssignment,
        requirement: MissingArrangementRequirement,
        exemptAll: boolean,
        additionalComments: string,
        exemptionExpiresAtLocal: Date | null
      ) => {
        const command = new ExemptIndividualVolunteerAssignmentRequirement({
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: arrangementIds,
        });
        command.arrangementFunction = assignment.arrangementFunction;
        command.arrangementFunctionVariant =
          assignment.arrangementFunctionVariant;
        command.volunteerFamilyId = assignment.familyId;
        command.personId = assignment.personId;
        command.requirementName = requirement.actionName;
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
        v1CaseId: string,
        arrangementId: string,
        assignment: IndividualVolunteerAssignment,
        exemptedRequirement: ExemptedRequirementInfo
      ) => {
        const command = new UnexemptIndividualVolunteerAssignmentRequirement({
          familyId: partneringFamilyId,
          referralId: v1CaseId,
          arrangementIds: [arrangementId],
        });
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
      v1CaseId: string,
      arrangementType: string,
      requestedAtLocal: Date,
      partneringFamilyPersonId: string,
      reason: string | null
    ) => {
      const command = new CreateArrangement({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [],
      });
      command.arrangementIds = [crypto.randomUUID()];
      command.arrangementType = arrangementType;
      command.requestedAtUtc = requestedAtLocal;
      command.partneringFamilyPersonId = partneringFamilyPersonId;
      command.reason = reason || undefined;
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
      const command = new PlanArrangementStart({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      command.plannedStartUtc = plannedStartLocal || undefined;
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
      const command = new StartArrangements({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      command.startedAtUtc = startedAtLocal;
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
      const command = new EditArrangementStartTime({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      command.startedAtUtc = startedAtLocal;
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
      const command = new EditArrangementEndTime({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      command.endedAtUtc = endedAtLocal;
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
      const command = new EditArrangementRequestedAt({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      command.requestedAtUtc = requestedAtLocal;
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
      const command = new EditArrangementCancelledAt({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      command.cancelledAtUtc = cancelledAtLocal;
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
      const command = new PlanArrangementEnd({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      command.plannedEndUtc = plannedEndLocal || undefined;
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
      const command = new EndArrangements({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      command.endedAtUtc = endedAtLocal;
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
      const command = new ReopenArrangements({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      if (noteId != null) command.noteId = noteId;
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
      const command = new CancelArrangementsSetup({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      command.cancelledAtUtc = cancelledAtLocal;
      return command;
    }
  );
  const deleteArrangement = useArrangementsCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      v1CaseId: string,
      arrangementId: string
    ) => {
      const command = new DeleteArrangements({
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
      const command = new AssignVolunteerFamily({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
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
      v1CaseId: string,
      arrangementId: string,
      volunteerFamilyId: string,
      personId: string,
      arrangementFunction: string,
      arrangementFunctionVariant?: string
    ) => {
      const command = new AssignIndividualVolunteer({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
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
      v1CaseId: string,
      arrangementId: string,
      volunteerFamilyId: string,
      arrangementFunction: string,
      arrangementFunctionVariant?: string
    ) => {
      const command = new UnassignVolunteerFamily({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
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
        v1CaseId: string,
        arrangementId: string,
        volunteerFamilyId: string,
        personId: string,
        arrangementFunction: string,
        arrangementFunctionVariant?: string
      ) => {
        const command = new UnassignIndividualVolunteer({
          familyId: partneringFamilyId,
          referralId: v1CaseId,
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
      v1CaseId: string,
      arrangementId: string,
      childLocationFamilyId: string,
      childLocationAdultId: string,
      changedAtLocal: Date,
      childLocationPlan: ChildLocationPlan,
      noteId: string | null
    ) => {
      const command = new TrackChildLocationChange({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
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
      v1CaseId: string,
      arrangementId: string,
      childLocationFamilyId: string,
      childLocationAdultId: string,
      changedAtLocal: Date,
      noteId: string | null
    ) => {
      const command = new DeleteChildLocationChange({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
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
      v1CaseId: string,
      arrangementId: string,
      childLocationFamilyId: string,
      childLocationAdultId: string,
      changedAtLocal: Date,
      childLocationPlan: ChildLocationPlan
    ) => {
      const command = new PlanChildLocationChange({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
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
      v1CaseId: string,
      arrangementId: string,
      childLocationFamilyId: string,
      childLocationAdultId: string,
      changedAtLocal: Date
    ) => {
      const command = new DeletePlannedChildLocationChange({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
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
      v1CaseId: string,
      arrangementId: string,
      comments: string | undefined
    ) => {
      const command = new UpdateArrangementComments({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      command.comments = comments;
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
      const command = new EditArrangementReason({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
        arrangementIds: [arrangementId],
      });
      command.reason = reason || undefined;
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
      const command = new CloseV1Case({
        familyId: partneringFamilyId,
        referralId: v1CaseId,
      });
      command.closeReason = reason;
      command.closedAtUtc = closedAtLocal;
      return command;
    }
  );
  const openV1Case = useV1CaseCommandCallbackWithLocation(
    async (partneringFamilyId: string, openedAtLocal: Date) => {
      const command = new CreateV1Case({
        familyId: partneringFamilyId,
      });
      command.referralId = crypto.randomUUID();
      command.openedAtUtc = openedAtLocal;
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
