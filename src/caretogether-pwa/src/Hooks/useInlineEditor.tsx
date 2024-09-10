import { Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import { useState } from 'react';
import { useBackdrop } from './useBackdrop';

export interface IInlineEditor<T> {
  value: T | undefined;
  setValue: React.Dispatch<React.SetStateAction<T | undefined>>;
  editing: boolean;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
  editButton: false | JSX.Element;
  cancelButton: false | JSX.Element;
  saveButton: false | JSX.Element;
}

export function useInlineEditor<T, U>(
  onSave: (value: T) => Promise<U>,
  savedValue?: T,
  validate?: (value?: T) => boolean
): IInlineEditor<T> {
  const withBackdrop = useBackdrop();

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(savedValue);

  async function saveChanges() {
    await withBackdrop(async () => {
      await onSave(value as T);
      setEditing(false);
    });
  }
  function cancelEditing() {
    setEditing(false);
    setValue(savedValue);
  }

  return {
    value,
    setValue,
    editing,
    setEditing,
    editButton: !editing && (
      <Button
        onClick={() => setEditing(true)}
        variant="text"
        size="small"
        startIcon={<EditIcon />}
        sx={{ margin: 1 }}
      >
        Edit
      </Button>
    ),
    cancelButton: editing && (
      <Button
        onClick={() => cancelEditing()}
        variant="contained"
        size="small"
        startIcon={<UndoIcon />}
        color="secondary"
        sx={{ margin: 1 }}
      >
        Cancel
      </Button>
    ),
    saveButton: editing && (
      <Button
        disabled={
          value === savedValue ||
          typeof value === 'undefined' ||
          (typeof validate !== 'undefined' && !validate(value))
        }
        onClick={saveChanges}
        variant="contained"
        size="small"
        startIcon={<SaveIcon />}
        sx={{ margin: 1 }}
      >
        Save
      </Button>
    ),
  };
}
