import { Button } from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import UndoIcon from '@mui/icons-material/Undo';
import { useState } from "react";
import { useBackdrop } from "./Components/RequestBackdrop";

export function useInlineEditor<T>(onSave: (value: T) => Promise<void>, savedValue?: T) {
  const withBackdrop = useBackdrop();

  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(savedValue);

  async function saveChanges() {
    await withBackdrop(async () => {
      await onSave(value as T); //TODO: Ensure 'value' is always defined at this point
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
    editButton: !editing &&
      <Button
        onClick={() => setEditing(true)}
        variant="text"
        size="small"
        startIcon={<EditIcon />}
        sx={{margin: 1}}>
        Edit
      </Button>,
    cancelButton: editing &&
      <Button
        onClick={() => cancelEditing()}
        variant="contained"
        size="small"
        startIcon={<UndoIcon />}
        color="secondary"
        sx={{margin: 1}}>
        Cancel
      </Button>,
    saveButton: editing &&
      <Button
        disabled={value === savedValue}
        onClick={saveChanges}
        variant="contained"
        size="small"
        startIcon={<SaveIcon />}
        sx={{margin: 1}}>
        Save
      </Button>
  }
}
