import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import { useContext, useEffect, useRef, useSyncExternalStore } from 'react';
import { UNSAFE_NavigationContext } from 'react-router-dom';
import { policyConfirmationFor } from './policyConfirmationStore';

export function PolicyNavigationConfirmation() {
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const confirmation = policyConfirmationFor(navigator);
  const keepEditing = useRef<HTMLButtonElement>(null);
  const kind = useSyncExternalStore(
    confirmation.subscribe,
    confirmation.getSnapshot
  );
  useEffect(() => () => confirmation.resolve(false), [confirmation]);
  return (
    <Dialog
      open={kind !== null}
      onClose={() => confirmation.resolve(false)}
      aria-labelledby="policy-navigation-title"
      aria-describedby="policy-navigation-description"
      fullWidth
      maxWidth="xs"
      slotProps={{
        transition: { onEntered: () => keepEditing.current?.focus() },
      }}
    >
      <DialogTitle id="policy-navigation-title">
        {kind === 'saving' ? 'Save in progress' : 'Unsaved changes'}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="policy-navigation-description">
          {kind === 'saving'
            ? 'A policy save is in progress. Wait for it to finish before leaving.'
            : 'You have unsaved changes. If you leave this page, your changes will be lost.'}
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap' }}>
        <Button
          ref={keepEditing}
          autoFocus
          onClick={() => confirmation.resolve(false)}
        >
          Keep Editing
        </Button>
        {kind === 'discard' && (
          <Button
            variant="contained"
            onClick={() => confirmation.resolve(true)}
          >
            Discard &amp; Leave
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
