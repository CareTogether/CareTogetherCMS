import {
  ActionRequirement,
  CompletedRequirementInfo,
  ExemptedRequirementInfo,
  MissingArrangementRequirement,
} from '../GeneratedClient';
import { useV1CasesModel } from '../Model/V1CasesModel';
import { useV1ReferralsModel } from '../Model/V1ReferralsModel';
import { useVolunteersModel } from '../Model/VolunteersModel';
import { RequirementContext } from './RequirementContext';
import {
  familyIdFromRequirementContext,
  isArrangementRequirementContext,
} from './requirementWorkflowModel';

type CompleteRequirementInput = {
  completedAtLocal: Date;
  context: RequirementContext;
  document: string | null;
  noteId: string | null;
  policy: ActionRequirement;
  requirementName: string;
  selectedArrangementIds: string[];
};

type ExemptRequirementInput = {
  additionalComments: string;
  context: RequirementContext;
  exemptAll: boolean;
  exemptionExpiresAtLocal: Date | null;
  requirement: MissingArrangementRequirement;
  requirementName: string;
  selectedArrangementIds: string[];
};

type MarkRequirementIncompleteInput = {
  completedRequirement: CompletedRequirementInfo;
  context: RequirementContext;
};

type RemoveRequirementExemptionInput = {
  context: RequirementContext;
  exemptedRequirement: ExemptedRequirementInfo;
};

function requireFamilyId(context: RequirementContext): string {
  const familyId = familyIdFromRequirementContext(context);
  if (!familyId) throw new Error('Missing familyId for this operation.');
  return familyId;
}

function requireArrangementRequirementContext(context: RequirementContext) {
  if (!isArrangementRequirementContext(context)) {
    throw new Error(`Invalid requirement context '${context.kind}'.`);
  }

  return context;
}

export function useRequirementCommands() {
  const v1Cases = useV1CasesModel();
  const referrals = useV1ReferralsModel();
  const volunteers = useVolunteersModel();

  async function completeRequirement({
    completedAtLocal,
    context,
    document,
    noteId,
    policy,
    requirementName,
    selectedArrangementIds,
  }: CompleteRequirementInput) {
    switch (context.kind) {
      case 'V1Case': {
        const familyId = requireFamilyId(context);

        await v1Cases.completeV1CaseRequirement(
          familyId,
          context.v1CaseId,
          requirementName,
          policy,
          completedAtLocal,
          document,
          noteId
        );
        break;
      }

      case 'V1Referral':
        await referrals.completeReferralRequirement(
          context.referralId,
          requirementName,
          policy,
          completedAtLocal,
          document,
          noteId
        );
        break;

      case 'Arrangement': {
        const familyId = requireFamilyId(context);

        await v1Cases.completeArrangementRequirement(
          familyId,
          context.v1CaseId,
          selectedArrangementIds,
          requirementName,
          policy,
          completedAtLocal,
          document,
          noteId
        );
        break;
      }

      case 'Family Volunteer Assignment': {
        const familyId = requireFamilyId(context);

        await v1Cases.completeVolunteerFamilyAssignmentRequirement(
          familyId,
          context.v1CaseId,
          selectedArrangementIds,
          context.assignment,
          requirementName,
          policy,
          completedAtLocal,
          document,
          noteId
        );
        break;
      }

      case 'Individual Volunteer Assignment': {
        const familyId = requireFamilyId(context);

        await v1Cases.completeIndividualVolunteerAssignmentRequirement(
          familyId,
          context.v1CaseId,
          selectedArrangementIds,
          context.assignment,
          requirementName,
          policy,
          completedAtLocal,
          document,
          noteId
        );
        break;
      }

      case 'Volunteer Family': {
        const familyId = requireFamilyId(context);

        await volunteers.completeFamilyRequirement(
          familyId,
          requirementName,
          policy,
          completedAtLocal,
          document,
          noteId
        );
        break;
      }

      case 'Individual Volunteer': {
        const familyId = requireFamilyId(context);

        await volunteers.completeIndividualRequirement(
          familyId,
          context.personId,
          requirementName,
          policy,
          completedAtLocal,
          document,
          noteId
        );
        break;
      }
    }
  }

  async function exemptRequirement({
    additionalComments,
    context,
    exemptAll,
    exemptionExpiresAtLocal,
    requirement,
    requirementName,
    selectedArrangementIds,
  }: ExemptRequirementInput) {
    switch (context.kind) {
      case 'V1Case': {
        const familyId = requireFamilyId(context);

        await v1Cases.exemptV1CaseRequirement(
          familyId,
          context.v1CaseId,
          requirementName,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;
      }

      case 'V1Referral':
        await referrals.exemptReferralRequirement(
          context.referralId,
          requirementName,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;

      case 'Arrangement': {
        const familyId = requireFamilyId(context);

        await v1Cases.exemptArrangementRequirement(
          familyId,
          context.v1CaseId,
          selectedArrangementIds,
          requirement,
          exemptAll,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;
      }

      case 'Family Volunteer Assignment': {
        const familyId = requireFamilyId(context);

        await v1Cases.exemptVolunteerFamilyAssignmentRequirement(
          familyId,
          context.v1CaseId,
          selectedArrangementIds,
          context.assignment,
          requirement,
          exemptAll,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;
      }

      case 'Individual Volunteer Assignment': {
        const familyId = requireFamilyId(context);

        await v1Cases.exemptIndividualVolunteerAssignmentRequirement(
          familyId,
          context.v1CaseId,
          selectedArrangementIds,
          context.assignment,
          requirement,
          exemptAll,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;
      }

      case 'Volunteer Family': {
        const familyId = requireFamilyId(context);

        await volunteers.exemptVolunteerFamilyRequirement(
          familyId,
          requirementName,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;
      }

      case 'Individual Volunteer': {
        const familyId = requireFamilyId(context);

        await volunteers.exemptVolunteerRequirement(
          familyId,
          context.personId,
          requirementName,
          additionalComments,
          exemptionExpiresAtLocal
        );
        break;
      }
    }
  }

  async function markRequirementIncomplete({
    completedRequirement,
    context,
  }: MarkRequirementIncompleteInput) {
    const arrangementContext = requireArrangementRequirementContext(context);
    const familyId = requireFamilyId(arrangementContext);

    if (arrangementContext.kind === 'Arrangement') {
      await v1Cases.markArrangementRequirementIncomplete(
        familyId,
        arrangementContext.v1CaseId,
        arrangementContext.arrangementId,
        completedRequirement
      );
      return;
    }

    if (arrangementContext.kind === 'Family Volunteer Assignment') {
      await v1Cases.markVolunteerFamilyAssignmentRequirementIncomplete(
        familyId,
        arrangementContext.v1CaseId,
        arrangementContext.arrangementId,
        arrangementContext.assignment,
        completedRequirement
      );
      return;
    }

    await v1Cases.markIndividualVolunteerAssignmentRequirementIncomplete(
      familyId,
      arrangementContext.v1CaseId,
      arrangementContext.arrangementId,
      arrangementContext.assignment,
      completedRequirement
    );
  }

  async function removeRequirementExemption({
    context,
    exemptedRequirement,
  }: RemoveRequirementExemptionInput) {
    const arrangementContext = requireArrangementRequirementContext(context);
    const familyId = requireFamilyId(arrangementContext);

    if (arrangementContext.kind === 'Arrangement') {
      await v1Cases.unexemptArrangementRequirement(
        familyId,
        arrangementContext.v1CaseId,
        arrangementContext.arrangementId,
        exemptedRequirement
      );
      return;
    }

    if (arrangementContext.kind === 'Family Volunteer Assignment') {
      await v1Cases.unexemptVolunteerFamilyAssignmentRequirement(
        familyId,
        arrangementContext.v1CaseId,
        arrangementContext.arrangementId,
        arrangementContext.assignment,
        exemptedRequirement
      );
      return;
    }

    await v1Cases.unexemptIndividualVolunteerAssignmentRequirement(
      familyId,
      arrangementContext.v1CaseId,
      arrangementContext.arrangementId,
      arrangementContext.assignment,
      exemptedRequirement
    );
  }

  return {
    completeRequirement,
    exemptRequirement,
    markRequirementIncomplete,
    removeRequirementExemption,
  };
}
