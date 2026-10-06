import { useSyncExternalStore } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import {
  continueWithPopupSignIn,
  getInteractiveSignInRecoverySnapshot,
  redirectForSignIn,
  retryPopupSignIn,
  subscribeToInteractiveSignInRecovery,
} from './InteractiveSignInRecovery';

function getStatusMessage(status: string) {
  switch (status) {
    case 'popup_failed':
      return 'Sign-in did not finish. You can try again or continue in this tab.';
    case 'redirect_failed':
      return 'Sign-in could not continue in this tab. Please try again.';
    case 'signing_in':
      return 'Waiting for sign-in to finish…';
    case 'redirecting':
      return 'Opening sign-in in this tab…';
    default:
      return 'Your session needs sign-in. Continue to resume your work.';
  }
}

export function InteractiveSignInRecoveryDialog() {
  const state = useSyncExternalStore(
    subscribeToInteractiveSignInRecovery,
    getInteractiveSignInRecoverySnapshot,
    getInteractiveSignInRecoverySnapshot
  );
  const busy = state.status === 'signing_in' || state.status === 'redirecting';
  const message = getStatusMessage(state.status);

  return (
    <Dialog
      open={state.open}
      sx={{ zIndex: 10001 }}
      aria-labelledby="interactive-sign-in-recovery-title"
      onClose={() => undefined}
    >
      <DialogTitle id="interactive-sign-in-recovery-title">
        <span className="ph-unmask">Sign-in needed</span>
      </DialogTitle>
      <DialogContent>
        <Typography>
          <span className="ph-unmask">{message}</span>
        </Typography>
        <Typography sx={{ mt: 1 }}>
          <span className="ph-unmask">
            Continuing with the same account preserves your unsaved work.
            Switching accounts reloads this page and discards unsaved changes.
          </span>
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={redirectForSignIn} disabled={busy} color="inherit">
          <span className="ph-unmask">Sign in in this tab</span>
        </Button>
        <Button
          onClick={
            state.status === 'popup_failed'
              ? retryPopupSignIn
              : continueWithPopupSignIn
          }
          disabled={busy}
          variant="contained"
        >
          <span className="ph-unmask">
            {state.status === 'popup_failed' ? 'Try again' : 'Continue'}
          </span>
        </Button>
      </DialogActions>
      <Typography variant="caption" sx={{ px: 3, pb: 2 }}>
        <span className="ph-unmask">
          Signing in in this tab may discard unsaved changes.
        </span>
      </Typography>
    </Dialog>
  );
}
