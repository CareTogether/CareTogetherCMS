import { Add as AddIcon, ControlPointDuplicate as DuplicateIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Stack, TableCell, TableRow, Tooltip, Typography } from '@mui/material';
import { ReactNode, useState } from 'react';
import { listText } from './policyUtils';

export function ValuesText({ values }: { values?: string[] }) {
  return <Typography variant="body2">{listText(values)}</Typography>;
}

export function EditableActions({ onAdd }: { onAdd: () => void }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      useFlexGap
      sx={{ flexWrap: 'wrap' }}
    >
      <Button
        size="small"
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAdd}
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
  return (
    <Stack spacing={1.5} sx={{ mb: 2 }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        sx={{
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: 'space-between',
        }}
      >
        <Typography variant="h6">{title}</Typography>
        {actions}
      </Stack>
      {children}
    </Stack>
  );
}

export function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
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

  function closeDialog() {
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
            setConfirming(true);
          }}
        >
          {icon}
        </IconButton>
      </Tooltip>

      <Dialog
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
