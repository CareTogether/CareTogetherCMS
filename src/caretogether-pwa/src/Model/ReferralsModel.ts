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
      const command = new CompleteReferralRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
      });
      command.completedRequirementId = crypto.randomUUID();
      command.requirementName = requirementName;
      command.completedAtUtc = completedAtLocal;
      if (documentId != null) command.uploadedDocumentId = documentId;
      if (noteId != null) command.noteId = noteId;
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
        const command = new MarkReferralRequirementIncomplete({
          familyId: partneringFamilyId,
          referralId: referralId,
        });
        command.requirementName = completedRequirement.requirementName;
        command.completedRequirementId =
          completedRequirement.completedRequirementId;
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
      const command = new ExemptReferralRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
      });
      command.requirementName = requirementName;
      command.additionalComments = additionalComments;
      command.exemptionExpiresAtUtc = exemptionExpiresAtLocal ?? undefined;
      return command;
    }
  );
  const unexemptReferralRequirement = useReferralCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      exemptedRequirement: ExemptedRequirementInfo
    ) => {
      const command = new UnexemptReferralRequirement({
        familyId: partneringFamilyId,
        referralId: referralId,
      });
      command.requirementName = exemptedRequirement.requirementName;
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
      const command = new UpdateCustomReferralField({
        familyId: partneringFamilyId,
        referralId: referralId,
      });
      command.completedCustomFieldId = crypto.randomUUID();
      command.customFieldName = customField.name;
      command.customFieldType = customField.type;
      command.value = value;
      return command;
    }
  );
  const updateReferralComments = useReferralCommandCallbackWithLocation(
    async (
      partneringFamilyId: string,
      referralId: string,
      comments: string | undefined
    ) => {
      const command = new UpdateReferralComments({
        familyId: partneringFamilyId,
        referralId: referralId,
      });
      command.comments = comments;
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
        const command = new CompleteArrangementRequirement({
          familyId: partneringFamilyId,
          referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command = new MarkArrangementRequirementIncomplete({
          familyId: partneringFamilyId,
          referralId: referralId,
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
        referralId: string,
        arrangementIds: string[],
        requirement: MissingArrangementRequirement,
        exemptAll: boolean,
        additionalComments: string,
        exemptionExpiresAtLocal: Date | null
      ) => {
        const dueDateUtc = requirement.dueBy || requirement.pastDueSince;

        const command = new ExemptArrangementRequirement({
          familyId: partneringFamilyId,
          referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        exemptedRequirement: ExemptedRequirementInfo
      ) => {
        const command = new UnexemptArrangementRequirement({
          familyId: partneringFamilyId,
          referralId: referralId,
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
        referralId: string,
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
          referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        assignment: FamilyVolunteerAssignment,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command = new MarkVolunteerFamilyAssignmentRequirementIncomplete({
          familyId: partneringFamilyId,
          referralId: referralId,
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
        referralId: string,
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
          referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        assignment: FamilyVolunteerAssignment,
        exemptedRequirement: ExemptedRequirementInfo
      ) => {
        const command = new UnexemptVolunteerFamilyAssignmentRequirement({
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
        const command = new CompleteIndividualVolunteerAssignmentRequirement({
          familyId: partneringFamilyId,
          referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        assignment: IndividualVolunteerAssignment,
        completedRequirement: CompletedRequirementInfo
      ) => {
        const command =
          new MarkIndividualVolunteerAssignmentRequirementIncomplete({
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
        const command = new ExemptIndividualVolunteerAssignmentRequirement({
          familyId: partneringFamilyId,
          referralId: referralId,
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
        referralId: string,
        arrangementId: string,
        assignment: IndividualVolunteerAssignment,
        exemptedRequirement: ExemptedRequirementInfo
      ) => {
        const command = new UnexemptIndividualVolunteerAssignmentRequirement({
          familyId: partneringFamilyId,
          referralId: referralId,
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
      referralId: string,
      arrangementType: string,
      requestedAtLocal: Date,
      partneringFamilyPersonId: string,
      reason: string | null
    ) => {
      const command = new CreateArrangement({
        familyId: partneringFamilyId,
        referralId: referralId,
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
      referralId: string,
      arrangementId: string,
      plannedStartLocal: Date | null
    ) => {
      const command = new PlanArrangementStart({
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
      const command = new StartArrangements({
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
      const command = new EditArrangementStartTime({
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
      const command = new EditArrangementEndTime({
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
      const command = new EditArrangementRequestedAt({
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
      const command = new EditArrangementCancelledAt({
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
      const command = new PlanArrangementEnd({
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
      const command = new EndArrangements({
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
      const command = new ReopenArrangements({
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
      const command = new CancelArrangementsSetup({
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
      const command = new DeleteArrangements({
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
      const command = new AssignVolunteerFamily({
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
      const command = new AssignIndividualVolunteer({
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
      const command = new UnassignVolunteerFamily({
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
        const command = new UnassignIndividualVolunteer({
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
      const command = new TrackChildLocationChange({
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
      const command = new DeleteChildLocationChange({
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
      const command = new PlanChildLocationChange({
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
      const command = new DeletePlannedChildLocationChange({
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
      const command = new UpdateArrangementComments({
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
      const command = new EditArrangementReason({
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
      const command = new CloseReferral({
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
      const command = new CreateReferral({
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
