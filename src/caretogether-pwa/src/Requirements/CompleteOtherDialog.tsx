import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
} from '@mui/material';
import { useState, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { policyData } from '../Model/ConfigurationModel';

type CompleteOtherDialogProps = {
  open: boolean;
  onClose: () => void;
  onSelectAction: (actionName: string) => void;
};

export function CompleteOtherDialog({
  open,
  onClose,
  onSelectAction,
}: CompleteOtherDialogProps) {
  const policy = useRecoilValue(policyData);

  const [selectedRequirement, setSelectedRequirement] = useState<string | null>(
    null
  );

  const allActionNames = useMemo(() => {
    const list: string[] = [];

    for (const [actionName, actionDef] of Object.entries(
      policy.actionDefinitions
    )) {
      list.push(actionName);
      if (actionDef.alternateNames) {
        list.push(...actionDef.alternateNames);
      }
    }

    return Array.from(new Set(list)).sort();
  }, [policy]);

  function handleCompleteClick() {
    if (!selectedRequirement) return;

    onSelectAction(selectedRequirement);
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Complete other...</DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        <Autocomplete
          options={allActionNames}
          getOptionLabel={(opt) => opt}
          value={selectedRequirement}
          onChange={(_, value) => setSelectedRequirement(value)}
          renderInput={(params) => (
            <TextField {...params} label="Search any action" fullWidth />
          )}
        />
      </DialogContent>

      <DialogActions>
        <Button variant="contained" color="secondary" onClick={onClose}>
          Cancel
        </Button>

        <Button
          variant="contained"
          color="primary"
          disabled={!selectedRequirement}
          onClick={handleCompleteClick}
        >
          Complete / Exempt
        </Button>
      </DialogActions>
    </Dialog>
  );
}
