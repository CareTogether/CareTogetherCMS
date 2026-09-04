import { useState } from 'react';
import type { useReferralDetailsViewModel } from './useReferralDetailsViewModel';

type UseReferralFamilyCaseWorkflowParameters = Pick<
  ReturnType<typeof useReferralDetailsViewModel>,
  'buildCaseOptionsForFamily' | 'family' | 'referralAlreadyLinkedToCase'
>;

export function useReferralFamilyCaseWorkflow({
  buildCaseOptionsForFamily,
  family,
  referralAlreadyLinkedToCase,
}: UseReferralFamilyCaseWorkflowParameters) {
  const [openCreateFamily, setOpenCreateFamily] = useState(false);
  const [openSelectFamilyDrawer, setOpenSelectFamilyDrawer] = useState(false);
  const [openLinkCaseDialog, setOpenLinkCaseDialog] = useState(false);
  const [selectedFamilyCaseOptions, setSelectedFamilyCaseOptions] = useState<
    ReturnType<typeof buildCaseOptionsForFamily>
  >([]);
  const [selectedCaseIdToLink, setSelectedCaseIdToLink] = useState<string>('');

  function closeCreateFamilyWorkflow() {
    setOpenCreateFamily(false);
  }

  function openCreateFamilyWorkflow() {
    setOpenCreateFamily(true);
  }

  function closeSelectFamilyWorkflow() {
    setOpenSelectFamilyDrawer(false);
  }

  function openSelectFamilyWorkflow() {
    setOpenSelectFamilyDrawer(true);
  }

  function resetLinkCaseDialogState() {
    setOpenLinkCaseDialog(false);
    setSelectedFamilyCaseOptions([]);
    setSelectedCaseIdToLink('');
  }

  function continueAfterFamilySelected(familyId: string) {
    setOpenSelectFamilyDrawer(false);

    const caseOptions = buildCaseOptionsForFamily(familyId);

    if (caseOptions.length > 0) {
      setSelectedFamilyCaseOptions(caseOptions);
      setSelectedCaseIdToLink(caseOptions[0].id);
      setOpenLinkCaseDialog(true);
    }
  }

  function openLinkExistingCaseDialog() {
    if (!family || referralAlreadyLinkedToCase) return;

    const caseOptions = buildCaseOptionsForFamily(family.family.id);

    if (caseOptions.length === 0) return;

    setSelectedFamilyCaseOptions(caseOptions);
    setSelectedCaseIdToLink(caseOptions[0].id);
    setOpenLinkCaseDialog(true);
  }

  return {
    closeCreateFamilyWorkflow,
    closeSelectFamilyWorkflow,
    continueAfterFamilySelected,
    openCreateFamily,
    openCreateFamilyWorkflow,
    openLinkCaseDialog,
    openLinkExistingCaseDialog,
    openSelectFamilyDrawer,
    openSelectFamilyWorkflow,
    resetLinkCaseDialogState,
    selectedCaseIdToLink,
    selectedFamilyCaseOptions,
    setSelectedCaseIdToLink,
  };
}
