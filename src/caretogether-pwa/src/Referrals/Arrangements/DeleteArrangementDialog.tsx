import { useParams } from 'react-router';
import { Arrangement, Person } from '../../GeneratedClient';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { useReferralsModel } from '../../Model/ReferralsModel';
import { UpdateDialog } from '../../Generic/UpdateDialog';

interface DeleteArrangementDialogProps {
  referralId: string;
  arrangement: Arrangement;
  onClose: () => void;
}

export function DeleteArrangementDialog({
  referralId,
  arrangement,
  onClose,
}: DeleteArrangementDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const referralsModel = useReferralsModel();
  const personLookup = usePersonLookup();

  const person = personLookup(
    familyId,
    arrangement.partneringFamilyPersonId
  ) as Person;

  async function save() {
    await referralsModel.deleteArrangement(
      familyId,
      referralId,
      arrangement.id!
    );
  }

  return (
    <UpdateDialog
      title={`🛑 Are you sure you want to delete this ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`}
      onClose={onClose}
      onSave={save}
    ></UpdateDialog>
  );
}
