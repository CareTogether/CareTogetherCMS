import { useState } from 'react';
import { Grid, TextField } from '@material-ui/core';
import { Person } from '../GeneratedClient';
import { useVolunteersModel } from '../Model/VolunteersModel';
import { UpdateDialog } from './UpdateDialog';

interface RenamePersonProps {
  volunteerFamilyId: string,
  person: Person,
  onClose: () => void
}

export function RenamePersonDialog({volunteerFamilyId, person, onClose}: RenamePersonProps) {
  const [fields, setFields] = useState({
    firstName: person.firstName as string,
    lastName: person.lastName as string
  });
  const {
    firstName, lastName } = fields;
  const volunteerFamiliesModel = useVolunteersModel();

  async function renamePerson() {
    if (firstName.length <= 0 || lastName.length <= 0) {
      alert("First and last name are required. Try again.");
    } else {
      await volunteerFamiliesModel.updatePersonName(volunteerFamilyId, person.id as string,
        firstName, lastName);
    }
  }

  return (
    <UpdateDialog title="Rename Person" onClose={onClose}
      onSave={renamePerson} enableSave={() => firstName!==person.firstName || lastName !== person.lastName}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField required id="first-name" label="First Name" fullWidth size="small"
              value={firstName} onChange={e => setFields({...fields, firstName: e.target.value})} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField required id="last-name" label="Last Name" fullWidth size="small"
              value={lastName} onChange={e => setFields({...fields, lastName: e.target.value})} />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}
