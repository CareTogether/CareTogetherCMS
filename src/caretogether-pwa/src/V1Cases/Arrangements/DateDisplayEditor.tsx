import { Edit as EditIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { IconButton, Typography } from '@mui/material';
import { useState } from 'react';
import { EditDateDialog } from './EditDateDialog';

type DateDisplayEditorCommonProps = {
  initialValue: Date | undefined;
  disablePast?: boolean;
  disableFuture?: boolean;
  label: string;
  hideDisplayLabel?: boolean;
  canEdit: boolean;
  availableInCurrentPhase: boolean;
  unavailableTooltip?: string;
};

type RequiredDateDisplayEditorProps = DateDisplayEditorCommonProps & {
  allowClear?: false;
  onChange: (value: Date) => Promise<void>;
};

type ClearableDateDisplayEditorProps = DateDisplayEditorCommonProps & {
  allowClear: true;
  onChange: (value: Date | null) => Promise<void>;
};

type DateDisplayEditorProps =
  | RequiredDateDisplayEditorProps
  | ClearableDateDisplayEditorProps;

export function DateDisplayEditor(props: DateDisplayEditorProps) {
  const {
    initialValue,
    disablePast = false,
    disableFuture = true,
    label,
    hideDisplayLabel = false,
    canEdit,
    availableInCurrentPhase,
    unavailableTooltip,
  } = props;
  const allowClear = props.allowClear === true;
  const [editing, setEditing] = useState(false);

  return (
    <div
      title={unavailableTooltip}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
      }}
    >
      <Typography sx={{ opacity: !availableInCurrentPhase ? 0.5 : 1 }}>
        {!hideDisplayLabel && (
          <>
            {label}:<br />
          </>
        )}
        {initialValue ? format(initialValue, 'M/d/yyyy') : '-'}
      </Typography>

      {canEdit && (
        <IconButton
          onClick={() => setEditing(true)}
          size="small"
          sx={{ margin: 1 }}
          color="primary"
          disabled={!availableInCurrentPhase}
        >
          <EditIcon fontSize="inherit" />
        </IconButton>
      )}

      {editing && (
        <EditDateDialog
          initialDate={initialValue}
          disablePast={disablePast}
          disableFuture={disableFuture}
          label={label}
          allowClear={allowClear}
          onClose={() => setEditing(false)}
          onSave={async (date: Date | null) => {
            if (props.allowClear === true) {
              await props.onChange(date);
              return;
            }

            if (date !== null) {
              await props.onChange(date);
            }
          }}
        />
      )}
    </div>
  );
}
