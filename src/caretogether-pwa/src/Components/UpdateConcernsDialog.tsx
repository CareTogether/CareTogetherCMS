import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, InputAdornment, TextField } from '@material-ui/core';
import WarningIcon from '@material-ui/icons/Warning';
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

interface UpdateConcernsDialogProps {
  volunteerFamilyId: string,
  person: Person,
  onClose: () => void
}

export function UpdateConcernsDialog({volunteerFamilyId, person, onClose}: UpdateConcernsDialogProps) {
  const classes = useStyles();

  const [fields, setFields] = useState({
    concerns: person.concerns || ''
  });
  const { concerns } = fields;
  const volunteerFamiliesModel = useVolunteerFamiliesModel();

  async function save() {
    await volunteerFamiliesModel.updatePersonConcerns(volunteerFamilyId, person.id as string,
      concerns.length > 0 ? concerns : null);
      //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
      onClose();
  }

  return (
    <Dialog open={true} onClose={onClose} scroll='body' aria-labelledby="update-person-concerns-title">
      <DialogTitle id="update-person-concerns-title">
        Update Concerns for {person.firstName} {person.lastName}
      </DialogTitle>
      <DialogContent>
        <form className={classes.form} noValidate autoComplete="off">
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={save} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
