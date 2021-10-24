import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core';

type UpdateDialogProps = {
  title: string,
  onClose: () => void,
  onSave: () => Promise<void>,
  enableSave?: () => boolean
}

export const UpdateDialog: React.FC<UpdateDialogProps> = ({
  title,
  onClose,
  onSave,
  enableSave,
  children,
}) =>(
  <Dialog open={true} onClose={onClose} scroll='body' aria-labelledby="update-dialog-title">
    <DialogTitle id="update-dialog-title">
      {title}
    </DialogTitle>
    <DialogContent>
      {children}
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="secondary">
        Cancel
      </Button>
      <Button onClick={async () => { await onSave(); onClose(); }} variant="contained" color="primary"
        disabled={enableSave && !enableSave()}>
        Save
      </Button>
    </DialogActions>
  </Dialog>
);
