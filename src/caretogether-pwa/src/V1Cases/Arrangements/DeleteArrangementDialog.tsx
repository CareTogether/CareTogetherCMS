import { useParams } from 'react-router';
import { Arrangement, Person } from '../../GeneratedClient';
import { usePersonLookup } from '../../Model/DirectoryModel';
import { useV1CasesModel } from '../../Model/V1CasesModel';
import { UpdateDialog } from '../../Generic/UpdateDialog';

interface DeleteArrangementDialogProps {
  v1CaseId: string;
  arrangement: Arrangement;
  onClose: () => void;
}

export function DeleteArrangementDialog({
  v1CaseId,
  arrangement,
  onClose,
}: DeleteArrangementDialogProps) {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const v1CasesModel = useV1CasesModel();
  const personLookup = usePersonLookup();

  const person = personLookup(
    familyId,
    arrangement.partneringFamilyPersonId
  ) as Person;

  async function save() {
    await v1CasesModel.deleteArrangement(familyId, v1CaseId, arrangement.id!);
  }

  return (
    <UpdateDialog
      title={`🛑 Are you sure you want to delete this ${arrangement.arrangementType} arrangement for ${person.firstName} ${person.lastName}?`}
      onClose={onClose}
      onSave={save}
    ></UpdateDialog>
  );
}
