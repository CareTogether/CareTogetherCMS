import { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, FormGroup, FormLabel, Link, Radio, RadioGroup, TextField } from '@material-ui/core';
import { VolunteerFamily, FormUploadRequirement, ActionRequirement, ActivityRequirement, Person, Age, ExactAge, FamilyAdultRelationshipType } from '../GeneratedClient';
import { DateTimePicker } from '@material-ui/pickers';
import { useVolunteerFamiliesModel } from '../Model/VolunteerFamiliesModel';

const useStyles = makeStyles((theme) => ({
  form: {
    '& .MuiTextField-root': {
    }
  }
}));

interface AddAdultDialogProps {
  volunteerFamily: VolunteerFamily,
  open: boolean,
  onClose: () => void
}

export function AddAdultDialog({volunteerFamily, open, onClose}: AddAdultDialogProps) {
  const classes = useStyles();
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    age: new ExactAge({ dateOfBirth: new Date()}) as Age,
    isInHousehold: true,
    isPrimaryFamilyContact: true,
    relationshipToFamily: null as FamilyAdultRelationshipType | null,
    familyRelationshipNotes: undefined as string | undefined,
    safetyRiskNotes: undefined as string | undefined
  });
  const {
    firstName, lastName, age,
    isInHousehold, isPrimaryFamilyContact, relationshipToFamily,
    familyRelationshipNotes, safetyRiskNotes } = fields;
  const [ageType, setAgeType] = useState<'exact' | 'inYears'>('exact');
  const volunteerFamiliesModel = useVolunteerFamiliesModel();

  async function addAdult() {
    if (relationshipToFamily === null || firstName.length < 0 || lastName.length < 0) { //TODO: Actual validation!
      alert("Family relationship was not selected. Try again.");
    } else {
      await volunteerFamiliesModel.addAdult(volunteerFamily.family?.id as string,
        firstName, lastName, age,
        isInHousehold, isPrimaryFamilyContact, relationshipToFamily,
        familyRelationshipNotes, safetyRiskNotes);
      //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
      onClose();
    }
  }

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="add-adult-title">
      <DialogTitle id="add-adult-title">Add Adult to Family</DialogTitle>
      <DialogContent>
        {/* <DialogContentText>
          Provide the basic information needed for this adult.
        </DialogContentText> */}
        <form className={classes.form} noValidate autoComplete="off">
          <FormGroup row>
            <TextField required id="first-name" label="First Name" value={firstName} onChange={e => setFields({...fields, firstName: e.target.value})} />
            <TextField required id="last-name" label="Last Name" value={lastName} onChange={e => setFields({...fields, lastName: e.target.value})} />
          </FormGroup>
          <FormControl component="fieldset">
            <FormLabel component="legend">Specify age as:</FormLabel>
            <RadioGroup aria-label="ageType" name="ageType" value={ageType} onChange={e => setAgeType(e.target.value)}>
              <FormControlLabel value="exact" control={<Radio />} label="Exact (date of birth)" />
              <FormControlLabel value="inYears" control={<Radio />} label="In years" />
            </RadioGroup>
          </FormControl>
          {ageType === 'exact'
            ? (<p>Exact</p>)
            : (<p>In Years</p>)}
          {/*age: new ExactAge({ dateOfBirth: new Date()}) as Age*/}
          <FormGroup row>
            <FormControlLabel
              control={<Checkbox checked={isInHousehold} onChange={e => setFields({...fields, isInHousehold: e.target.checked})}
                name="isInHousehold" color="primary" />}
              label="In Household"
            />
            <FormControlLabel
              control={<Checkbox checked={isPrimaryFamilyContact} onChange={e => setFields({...fields, isPrimaryFamilyContact: e.target.checked})}
                name="isPrimaryFamilyContact" color="primary" />}
              label="In Household"
            />
          </FormGroup>
    {/*
    relationshipToFamily: null as FamilyAdultRelationshipType | null,
    familyRelationshipNotes: undefined as string | undefined,
    safetyRiskNotes: undefined as string | undefined */}
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={addAdult} color="primary">
          Upload
        </Button>
      </DialogActions>
    </Dialog>
  );
}
