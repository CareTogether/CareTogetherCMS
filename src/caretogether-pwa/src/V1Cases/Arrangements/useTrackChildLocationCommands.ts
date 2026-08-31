import {
  ChildLocationHistoryEntry,
  ChildLocationPlan,
} from '../../GeneratedClient';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';

type UseTrackChildLocationCommandsParameters = {
  arrangementId: string;
  partneringFamilyId: string;
  v1CaseId: string;
};

type TrackChildLocationCommandParameters = {
  assigneeFamilyId: string;
  assigneePersonId: string;
  changeAtLocal: Date;
  notes: string;
  plan: ChildLocationPlan;
};

type PlanChildLocationChangeCommandParameters = {
  assigneeFamilyId: string;
  assigneePersonId: string;
  changeAtLocal: Date;
  plan: ChildLocationPlan;
};

export function useTrackChildLocationCommands({
  arrangementId,
  partneringFamilyId,
  v1CaseId,
}: UseTrackChildLocationCommandsParameters) {
  const directoryModel = useDirectoryModel();
  const v1CasesModel = useV1CasesModel();

  async function trackChildLocation({
    assigneeFamilyId,
    assigneePersonId,
    changeAtLocal,
    notes,
    plan,
  }: TrackChildLocationCommandParameters) {
    let noteId: string | undefined = undefined;
    if (notes !== '') {
      noteId = crypto.randomUUID();
      await directoryModel.createDraftNote(
        partneringFamilyId,
        noteId,
        notes,
        changeAtLocal
      );
    }
    await v1CasesModel.trackChildLocation(
      partneringFamilyId,
      v1CaseId,
      arrangementId,
      assigneeFamilyId,
      assigneePersonId,
      changeAtLocal,
      plan,
      noteId || null
    );
  }

  async function planChildLocationChange({
    assigneeFamilyId,
    assigneePersonId,
    changeAtLocal,
    plan,
  }: PlanChildLocationChangeCommandParameters) {
    await v1CasesModel.planChildLocation(
      partneringFamilyId,
      v1CaseId,
      arrangementId,
      assigneeFamilyId,
      assigneePersonId,
      changeAtLocal,
      plan
    );
  }

  async function deleteChildLocationEntry(
    historyEntry: ChildLocationHistoryEntry
  ) {
    await v1CasesModel.deleteChildLocationEntry(
      partneringFamilyId,
      v1CaseId,
      arrangementId,
      historyEntry.childLocationFamilyId!,
      historyEntry.childLocationReceivingAdultId!,
      historyEntry.timestampUtc!,
      null
    );
  }

  async function deleteChildLocationPlan(planEntry: ChildLocationHistoryEntry) {
    await v1CasesModel.deleteChildLocationPlan(
      partneringFamilyId,
      v1CaseId,
      arrangementId,
      planEntry.childLocationFamilyId!,
      planEntry.childLocationReceivingAdultId!,
      planEntry.timestampUtc!
    );
  }

  return {
    deleteChildLocationEntry,
    deleteChildLocationPlan,
    planChildLocationChange,
    trackChildLocation,
  };
}
