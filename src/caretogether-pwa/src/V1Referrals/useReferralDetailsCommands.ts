import { useState } from 'react';
import { useV1ReferralsModel } from '../Model/V1ReferralsModel';

type UseReferralDetailsCommandsParameters = {
  onNewFamilySaved: () => void;
  onReferralLinkedToCase: () => void;
  onSelectedExistingFamilySaved: (familyId: string) => void;
};

type LinkReferralToSelectedCaseParameters = {
  familyId?: string | null;
  referralId: string;
  selectedCaseId: string;
};

export function useReferralDetailsCommands({
  onNewFamilySaved,
  onReferralLinkedToCase,
  onSelectedExistingFamilySaved,
}: UseReferralDetailsCommandsParameters) {
  const {
    reopenReferral,
    updateReferralFamily,
    linkReferralToCaseAndAccept,
    assignIndividualVolunteerToReferral,
    unassignIndividualVolunteerFromReferral,
  } = useV1ReferralsModel();
  const [working, setWorking] = useState(false);

  async function reopenCurrentReferral(referralId: string) {
    setWorking(true);
    try {
      await reopenReferral(referralId);
    } finally {
      setWorking(false);
    }
  }

  async function saveSelectedExistingFamily(
    currentReferralId: string,
    familyId: string
  ) {
    if (working) return;

    try {
      setWorking(true);
      await updateReferralFamily(currentReferralId, familyId);
      onSelectedExistingFamilySaved(familyId);
    } finally {
      setWorking(false);
    }
  }

  async function saveNewFamily(currentReferralId: string, familyId: string) {
    if (working) return;

    try {
      setWorking(true);
      await updateReferralFamily(currentReferralId, familyId);
      onNewFamilySaved();
    } finally {
      setWorking(false);
    }
  }

  async function linkReferralToSelectedCase({
    familyId,
    referralId,
    selectedCaseId,
  }: LinkReferralToSelectedCaseParameters) {
    if (!familyId || !selectedCaseId || working) return;

    try {
      setWorking(true);
      await linkReferralToCaseAndAccept(
        familyId,
        selectedCaseId,
        referralId,
        new Date()
      );
      onReferralLinkedToCase();
    } finally {
      setWorking(false);
    }
  }

  return {
    assignIndividualVolunteerToReferral,
    linkReferralToSelectedCase,
    reopenCurrentReferral,
    saveNewFamily,
    saveSelectedExistingFamily,
    unassignIndividualVolunteerFromReferral,
    working,
  };
}
