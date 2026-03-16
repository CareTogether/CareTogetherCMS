import { UpdateDialog } from '../Generic/UpdateDialog';

type ConfirmCloseV1CaseDialogProps = {
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
};

export function ConfirmCloseV1CaseDialog({
  onClose,
  onConfirm,
}: ConfirmCloseV1CaseDialogProps) {
  return (
    <UpdateDialog
      title="Are you sure you want to close this case?"
      onClose={onClose}
      onSave={async () => {
        await onConfirm();
      }}
      saveLabel="Yes"
      noAutoClose={false}
    />
  );
}
