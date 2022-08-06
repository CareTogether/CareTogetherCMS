import { useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormLabel, Grid, InputAdornment, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField } from '@mui/material';
import { CombinedFamilyInfo, Age, ExactAge, AgeInYears, Gender, CustodialRelationshipType, CustodialRelationship } from '../../GeneratedClient';
import { visibleFamiliesData } from '../../Model/ModelLoader';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import WarningIcon from '@mui/icons-material/Warning';
import { DatePicker } from '@mui/lab';
import { useRecoilValue } from 'recoil';
import { ethnicitiesData } from '../../Model/ConfigurationModel';
import { useParams } from 'react-router-dom';
import { useBackdrop } from '../../useBackdrop';
import { subYears, addDays } from 'date-fns';

const useStyles = makeStyles((theme) => ({
  form: {
    '& .MuiFormControl-root': {
    }
  },
  ageYears: {
    width: '20ch'
  }
}));

interface AddChildDialogProps {
  onClose: () => void
}

export function AddChildDialog({onClose}: AddChildDialogProps) {
  const classes = useStyles();
  const { familyId } = useParams<{ familyId: string }>();
  const visibleFamilies = useRecoilValue(visibleFamiliesData);
  const family = visibleFamilies.find(x => x.family?.id === familyId) as CombinedFamilyInfo;

  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    gender: null as Gender | null,
    dateOfBirth: null as Date | null,
    ageInYears: null as number | null,
    ethnicity: '',
    custodialRelationships: family.family!.adults!.filter(adult => adult.item1!.active).map(adult =>
      ({ adult: adult.item1!, relationship: CustodialRelationshipType.ParentWithCustody as CustodialRelationshipType | -1 })),
    notes: null as string | null,
    concerns: null as string | null
  });
  const {
    firstName, lastName, gender, dateOfBirth, ageInYears, ethnicity,
    custodialRelationships,
    notes, concerns } = fields;
  const [ageType, setAgeType] = useState<'exact' | 'inYears'>('exact');
  const directoryModel = useDirectoryModel();

  const ethnicities = useRecoilValue(ethnicitiesData);
  
  const withBackdrop = useBackdrop();

  async function addChild() {
    await withBackdrop(async () => {
      if (firstName.length <= 0 || lastName.length <= 0) {
        alert("First and last name are required. Try again.");
      } else if (gender == null) {
        alert("Gender was not selected. Try again.");
      } else if (ageType === 'exact' && dateOfBirth == null) {
        alert("Date of birth was not specified. Try again.");
      } else if (ageType === 'inYears' && ageInYears == null) {
        alert("Age in years was not specified. Try again.");
      } else if (ageType === 'inYears' && ageInYears != null && ageInYears >= 18) {
        alert("Age in years must be less than 18. Try again.");
      } else if (ethnicity === '') {
        alert("Ethnicity was not selected. Try again.");
      } else {
        let age: Age;
        if (ageType === 'exact') {
          age = new ExactAge();
          (age as ExactAge).dateOfBirth = (dateOfBirth == null ? undefined : dateOfBirth);
        } else {
          age = new AgeInYears();
          (age as AgeInYears).years = (ageInYears == null ? undefined : ageInYears);
          (age as AgeInYears).asOf = new Date();
        }
        await directoryModel.addChild(family.family?.id as string,
          firstName, lastName, gender as Gender, age, ethnicity,
          custodialRelationships.filter(cr => cr.relationship !== -1).map(cr => {
            const result = new CustodialRelationship();
            result.personId = cr.adult.id;
            result.type = cr.relationship as CustodialRelationshipType;
            return result;
          }),
          (notes == null ? undefined : notes), (concerns == null ? undefined : concerns));
        //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
        onClose();
      }
    });
  }

  return (
    <Dialog open={true} onClose={onClose} scroll='body' aria-labelledby="add-child-title">
      <DialogTitle id="add-child-title">
        Add Child to {family.family?.adults?.filter(adult => adult.item1?.id === family.family?.primaryFamilyContactPersonId)[0]?.item1?.lastName} Family
      </DialogTitle>
      <DialogContent>
        {/* <DialogContentText>
          Provide the basic information needed for this child.
        </DialogContentText> */}
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
            <Grid item xs={12}>
              <FormControl required component="fieldset">
                <FormLabel component="legend">Gender:</FormLabel>
                <RadioGroup aria-label="genderType" name="genderType" row
                  value={gender == null ? null : Gender[gender]} onChange={e => setFields({...fields, gender: Gender[e.target.value as keyof typeof Gender]})}>
                  <FormControlLabel value={Gender[Gender.Male]} control={<Radio size="small" />} label="Male" />
                  <FormControlLabel value={Gender[Gender.Female]} control={<Radio size="small" />} label="Female" />
                  <FormControlLabel value={Gender[Gender.SeeNotes]} control={<Radio size="small" />} label="See Notes" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl required component="fieldset">
                <FormLabel component="legend">Specify age as:</FormLabel>
                <RadioGroup aria-label="ageType" name="ageType"
                  value={ageType} onChange={e => setAgeType(e.target.value as 'exact' | 'inYears')}>
                  <FormControlLabel value="exact" control={<Radio size="small" />} label="Date of birth:" />
                  <FormControlLabel value="inYears" control={<Radio size="small" />} label="Years old today:" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={8} container direction="column" spacing={0}>
              <Grid item>
                <DatePicker
                  label="Date of birth"
                  value={dateOfBirth} minDate={addDays(subYears(new Date(), 18), 1)} maxDate={new Date()} openTo="year"
                  disabled={ageType !== 'exact'} inputFormat="MM/dd/yyyy"
                  onChange={(date: any) => date && setFields({...fields, dateOfBirth: date})}
                  renderInput={(params: any) => <TextField size="small" required {...params} />} />
              </Grid>
              <Grid item>
                <TextField
                  id="age-years" label="Age" className={classes.ageYears} size="small"
                  required type="number" disabled={ageType !== 'inYears'}
                  value={ageInYears == null ? "" : ageInYears} onChange={e => setFields({...fields, ageInYears: Number.parseInt(e.target.value)})}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">years</InputAdornment>,
                  }} />
                </Grid>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth size="small">
                <InputLabel id="ethnicity-label">Ethnicity</InputLabel>
                <Select
                  labelId="ethnicity-label" id="ethnicity"
                  value={ethnicity}
                  onChange={e => setFields({...fields, ethnicity: e.target.value as string})}>
                    <MenuItem key="placeholder" value="" disabled>
                      Select an ethnicity
                    </MenuItem>
                    {ethnicities.map(ethnicity =>
                      <MenuItem key={ethnicity} value={ethnicity}>{ethnicity}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <table>
                <thead>
                  <tr>
                    <td>Adult</td>
                    <td>Custodial Relationship</td>
                  </tr>
                </thead>
                <tbody>
                  {custodialRelationships.map(custodialRelationship => (
                    <tr key={custodialRelationship.adult.id}>
                      <td>{custodialRelationship.adult.firstName + " " + custodialRelationship.adult.lastName}</td>
                      <td>
                        <FormControl required fullWidth size="small">
                          <Select
                            id={"custodial-relationship-"+custodialRelationship.adult.id}
                            value={custodialRelationship.relationship}
                            onChange={e => setFields({...fields, custodialRelationships: custodialRelationships.map(cr => cr.adult.id === custodialRelationship.adult.id
                              ? { adult: custodialRelationship.adult, relationship: e.target.value as CustodialRelationshipType | -1 }
                              : cr) })}>
                              <MenuItem key="none" value={-1}>None</MenuItem>
                              <MenuItem key='ParentWithCustody' value={CustodialRelationshipType.ParentWithCustody}>Parent with custody</MenuItem>
                              <MenuItem key='ParentWithCourtAppointedCustody' value={CustodialRelationshipType.ParentWithCourtAppointedCustody}>Parent with court-appointed custody</MenuItem>
                              <MenuItem key='LegalGuardian' value={CustodialRelationshipType.LegalGuardian}>Legal guardian</MenuItem>
                          </Select>
                        </FormControl>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Grid>
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
                value={concerns == null ? "" : concerns} onChange={e => setFields({...fields, concerns: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="notes"
                label="Notes" placeholder="Space for any general notes"
                multiline fullWidth variant="outlined" minRows={2} maxRows={5} size="small"
                value={notes == null ? "" : notes} onChange={e => setFields({...fields, notes: e.target.value})}
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">
          Cancel
        </Button>
        <Button onClick={addChild} variant="contained" color="primary">
          Add to Family
        </Button>
      </DialogActions>
    </Dialog>
  );
}
