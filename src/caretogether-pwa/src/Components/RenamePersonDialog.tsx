import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, TextField } from '@material-ui/core';
import { Person } from '../GeneratedClient';
import { useVolunteerFamiliesModel } from '../Model/VolunteerFamiliesModel';

const useStyles = makeStyles((theme) => ({
  form: {
    '& .MuiFormControl-root': {
    }
  },
  ageYears: {
    width: '20ch'
  }
}));

interface RenamePersonProps {
  volunteerFamilyId: string,
  person: Person,
  onClose: () => void
}

export function RenamePersonDialog({volunteerFamilyId, person, onClose}: RenamePersonProps) {
  const classes = useStyles();

  const [fields, setFields] = useState({
    firstName: person.firstName as string,
    lastName: person.lastName as string
  });
  const {
    firstName, lastName } = fields;
  const volunteerFamiliesModel = useVolunteerFamiliesModel();

  async function renamePerson() {
    if (firstName.length <= 0 || lastName.length <= 0) {
      alert("First and last name are required. Try again.");
    } else {
      await volunteerFamiliesModel.updatePersonName(volunteerFamilyId, person.id as string,
        firstName, lastName);
      //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
      onClose();
    }
  }

  return (
    <Dialog open={true} onClose={onClose} scroll='body' aria-labelledby="rename-person-title">
      <DialogTitle id="rename-person-title">
        Rename Person
      </DialogTitle>
      <DialogContent>
        <form className={classes.form} noValidate autoComplete="off">
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={renamePerson} variant="contained" color="primary"
          disabled={firstName===person.firstName && lastName === person.lastName}>
          Rename
        </Button>
      </DialogActions>
    </Dialog>
  );
}
