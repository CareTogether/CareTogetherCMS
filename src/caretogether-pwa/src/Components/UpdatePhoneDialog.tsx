import { useState } from 'react';
import { Grid, TextField } from '@material-ui/core';
import { Person } from '../GeneratedClient';
import { useVolunteerFamiliesModel } from '../Model/VolunteerFamiliesModel';
import { UpdateDialog } from './UpdateDialog';

interface UpdatePhoneDialogProps {
  volunteerFamilyId: string,
  person: Person,
  onClose: () => void
}

export function UpdatePhoneDialog({volunteerFamilyId, person, onClose}: UpdatePhoneDialogProps) {
  const [fields, setFields] = useState({
    notes: person.notes || ''
  });
  const { notes } = fields;
  const volunteerFamiliesModel = useVolunteerFamiliesModel();

  async function save() {
    await volunteerFamiliesModel.updatePersonNotes(volunteerFamilyId, person.id as string,
      notes.length > 0 ? notes : null);
  }

  return (
    <UpdateDialog title={`Update Phone for ${person.firstName} ${person.lastName}`} onClose={onClose}
      onSave={save} enableSave={() => notes !== person.notes}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}
