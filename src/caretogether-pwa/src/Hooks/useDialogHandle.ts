import { useEffect, useRef, useState } from 'react';

export type DialogHandle = {
  open: boolean;
  key: number;
  openDialog: () => void;
  closeDialog: () => void;
};

// This custom hook provides a mechanism to ensure modal dialogs are mounted and unmounted safely
// with regard to their internal state. Credit:
// https://github.com/mui/material-ui/issues/16325#issuecomment-905876236
export function useDialogHandle(): DialogHandle {
  const openId = useRef(1);

  const [dialogOpen, setDialogOpen] = useState(false);

  const openDialog = () => setDialogOpen(true);
  const closeDialog = () => setDialogOpen(false);

  useEffect(() => {
    if (dialogOpen) {
      // Increment id each time modal is opened
      openId.current = openId.current + 1;
    }
  }, [dialogOpen]);

  return {
    open: dialogOpen,
    key: openId.current,
    openDialog: openDialog,
    closeDialog: closeDialog,
  };
}
