import { UploadedDocumentInfo } from '../GeneratedClient';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { UpdateDialog } from '../Generic/UpdateDialog';

interface DeleteDocumentDialogProps {
  familyId: string,
  document: UploadedDocumentInfo,
  onClose: () => void
}

export function DeleteDocumentDialog({familyId, document, onClose}: DeleteDocumentDialogProps) {
  const directoryModel = useDirectoryModel();

  async function save() {
    await directoryModel.deleteUploadedFamilyDocument(familyId, document.uploadedDocumentId!);
  }

  return (
    <UpdateDialog title={`Are you sure you want to delete '${document.uploadedFileName}'?`} onClose={onClose}
      onSave={save}>
    </UpdateDialog>
  );
}
