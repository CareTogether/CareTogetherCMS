import EditIcon from '@mui/icons-material/Edit';
import { format } from 'date-fns';
import { IconButton, Typography } from '@mui/material';
import { useState } from 'react';
import { EditDateDialog } from './EditDateDialog';

interface DateDisplayEditorProps {
  initialValue: Date | undefined;
  label: string;
  canEdit: boolean;
  availableInCurrentPhase: boolean;
  unavailableTooltip?: string;
  onChange: (value: Date) => Promise<void>;
}

export function DateDisplayEditor({
  initialValue,
  label,
  canEdit,
  availableInCurrentPhase,
  unavailableTooltip,
  onChange,
}: DateDisplayEditorProps) {
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
        {label}:<br />
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
          label={label}
          onClose={() => setEditing(false)}
          onSave={async (date) => {
            await onChange(date);
          }}
        />
      )}
    </div>
  );
}
