import { useState } from 'react';
import { Grid, InputAdornment, TextField } from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';
import { Person } from '../../GeneratedClient';
import { useVolunteersModel } from '../../Model/VolunteersModel';
import { UpdateDialog } from '../UpdateDialog';

interface UpdateConcernsDialogProps {
  volunteerFamilyId: string,
  person: Person,
  onClose: () => void
}

export function UpdateConcernsDialog({volunteerFamilyId, person, onClose}: UpdateConcernsDialogProps) {
  const [fields, setFields] = useState({
    concerns: person.concerns || ''
  });
  const { concerns } = fields;
  const volunteerFamiliesModel = useVolunteersModel();

  async function save() {
    await volunteerFamiliesModel.updatePersonConcerns(volunteerFamilyId, person.id as string,
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
