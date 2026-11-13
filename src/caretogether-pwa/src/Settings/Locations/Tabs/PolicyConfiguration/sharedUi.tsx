import {
  Add as AddIcon,
  ControlPointDuplicate as DuplicateIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Stack,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { createContext, ReactNode, useContext, useState } from 'react';
import { listText } from './policyUtils';
import { useAdministrationSidePanel } from './usePolicyAdministrationPanels';

const StandalonePolicyHeadingContext = createContext<string | undefined>(
  undefined
);

export function StandalonePolicyContent({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <StandalonePolicyHeadingContext.Provider value={title}>
      <Stack component="section" aria-label={title} sx={{ minWidth: 0 }}>
        {children}
      </Stack>
    </StandalonePolicyHeadingContext.Provider>
  );
}

export function ValuesText({ values }: { values?: string[] }) {
  return <Typography variant="body2">{listText(values)}</Typography>;
}

export function EditableActions({
  onAdd,
  disabled = false,
}: {
  onAdd: () => void;
  disabled?: boolean;
}) {
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
      <Button
        size="small"
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAdd}
        disabled={disabled}
      >
        Add
      </Button>
    </Stack>
  );
}

export function SectionHeader({
  title,
  children,
  actions,
}: {
  title: string;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  const standaloneHeading = useContext(StandalonePolicyHeadingContext);
  const hideTitle = title === standaloneHeading;
  if (hideTitle && !actions && !children) return null;
  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      {(!hideTitle || actions) && (
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1}
          sx={{
            alignItems: { xs: 'stretch', sm: 'center' },
            justifyContent: hideTitle ? 'flex-end' : 'space-between',
          }}
        >
          {!hideTitle && <Typography variant="h6">{title}</Typography>}
          {actions}
        </Stack>
      )}
      {children}
    </Stack>
  );
}

export function EmptyRow({
  colSpan,
  label,
}: {
  colSpan: number;
  label: string;
}) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </TableCell>
    </TableRow>
  );
}

export function ConfirmedRowAction({
  label,
  action,
  icon,
  title,
  message,
  onClick,
}: {
  label: string;
  action: string;
  icon: ReactNode;
  title: string;
  message: string;
  onClick: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const panel = useAdministrationSidePanel();

  function closeDialog() {
    if (panel.coordinated) {
      panel.closeSidePanel();
      return;
    }
    setConfirming(false);
  }

  function confirmDuplicate() {
    onClick();
    closeDialog();
  }

  return (
    <>
      <Tooltip title={action}>
        <IconButton
          size="small"
          aria-label={`${action} ${label}`}
          onClick={(event) => {
            event.stopPropagation();
            if (panel.coordinated) panel.openSidePanel();
            else setConfirming(true);
          }}
        >
          {icon}
        </IconButton>
      </Tooltip>

      {panel.coordinated ? (
        <panel.SidePanel>
          <Stack spacing={2} onClick={(event) => event.stopPropagation()}>
            <Typography variant="h6">{title}</Typography>
            <Typography>{message}</Typography>
            <Stack direction="row" spacing={1}>
              <Button onClick={closeDialog}>No</Button>
              <Button variant="contained" onClick={confirmDuplicate}>
                Yes
              </Button>
            </Stack>
          </Stack>
        </panel.SidePanel>
      ) : (
        <Dialog
          className="ph-unmask"
          open={confirming}
          onClose={closeDialog}
          onClick={(event) => event.stopPropagation()}
        >
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <DialogContentText>{message}</DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>No</Button>
            <Button variant="contained" onClick={confirmDuplicate}>
              Yes
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

export function DuplicateRowAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <ConfirmedRowAction
      label={label}
      action="Duplicate"
      icon={<DuplicateIcon fontSize="small" />}
      title={`Duplicate ${label}?`}
      message={`Are you sure you want to duplicate ${label}?`}
      onClick={onClick}
    />
  );
}

export function DeleteRowAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <ConfirmedRowAction
      label={label}
      action="Delete"
      icon={<DeleteIcon fontSize="small" />}
      title={`Delete ${label}?`}
      message={`Are you sure you want to delete ${label}?`}
      onClick={onClick}
    />
  );
}
