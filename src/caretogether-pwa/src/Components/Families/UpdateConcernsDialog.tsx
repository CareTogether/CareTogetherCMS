import { useState } from 'react';
import { Grid, InputAdornment, TextField } from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import { Person } from '../../GeneratedClient';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { UpdateDialog } from '../UpdateDialog';

interface UpdateConcernsDialogProps {
  familyId: string,
  person: Person,
  onClose: () => void
}

export function UpdateConcernsDialog({familyId, person, onClose}: UpdateConcernsDialogProps) {
  const [fields, setFields] = useState({
    concerns: person.concerns || ''
  });
  const { concerns } = fields;
  const directoryModel = useDirectoryModel();

  async function save() {
    await directoryModel.updatePersonConcerns(familyId, person.id as string,
      concerns.length > 0 ? concerns : null);
  }

  return (
    <UpdateDialog title={`Update Concerns for ${person.firstName} ${person.lastName}`} onClose={onClose}
      onSave={save} enableSave={() => concerns !== person.concerns}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              id="concerns"
              label="Concerns" placeholder="Note any safety risks, allergies, etc."
              multiline fullWidth variant="outlined" minRows={2} maxRows={5} size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WarningIcon />
                  </InputAdornment>
                ),
              }}
              value={concerns} onChange={e => setFields({...fields, concerns: e.target.value})}
            />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}
