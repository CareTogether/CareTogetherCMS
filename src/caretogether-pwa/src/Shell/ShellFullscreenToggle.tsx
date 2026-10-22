import { useEffect, useState } from 'react';
import { Fullscreen, FullscreenExit } from '@mui/icons-material';
import { Alert, IconButton, Snackbar, Tooltip } from '@mui/material';

export function ShellFullscreenToggle() {
  const [fullscreen, setFullscreen] = useState(
    Boolean(document.fullscreenElement)
  );
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const synchronize = () =>
      setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', synchronize);
    synchronize();
    return () => document.removeEventListener('fullscreenchange', synchronize);
  }, []);

  if (
    !document.fullscreenEnabled ||
    typeof document.documentElement.requestFullscreen !== 'function' ||
    typeof document.exitFullscreen !== 'function'
  )
    return null;

  async function toggle() {
    setPending(true);
    setFailed(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFailed(true);
    } finally {
      setPending(false);
    }
  }

  const label = fullscreen ? 'Exit fullscreen' : 'Enter fullscreen';
  return (
    <>
      <Tooltip title={label}>
        <span style={{ display: 'inline-flex' }}>
          <IconButton
            color="inherit"
            aria-label={label}
            disabled={pending}
            onClick={toggle}
          >
            {fullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </span>
      </Tooltip>
      <Snackbar
        open={failed}
        autoHideDuration={6000}
        onClose={() => setFailed(false)}
      >
        <Alert severity="error" onClose={() => setFailed(false)}>
          Unable to change fullscreen mode.
        </Alert>
      </Snackbar>
    </>
  );
}
