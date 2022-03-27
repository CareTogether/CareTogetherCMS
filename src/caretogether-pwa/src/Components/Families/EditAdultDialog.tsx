import { useState } from 'react';
import { Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, FormGroup, FormLabel, Grid, InputAdornment, InputLabel, MenuItem, Radio, RadioGroup, Select, TextField } from '@mui/material';
import { Age, ExactAge, AgeInYears, Gender, EmailAddressType, PhoneNumberType, Person, ValueTupleOfPersonAndFamilyAdultRelationshipInfo } from '../../GeneratedClient';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import WarningIcon from '@mui/icons-material/Warning';
import { DatePicker } from '@mui/lab';
import { useRecoilValue } from 'recoil';
import { adultFamilyRelationshipsData, ethnicitiesData } from '../../Model/ConfigurationModel';
import { useParams } from 'react-router-dom';
import { useBackdrop } from '../../useBackdrop';
import { subYears } from 'date-fns';
import { DialogHandle } from '../../useDialogHandle';
import { useInlineEditor } from '../../useInlineEditor';
import { PersonName } from './PersonName';

type PersonEditorProps = {
  familyId: string
  person: Person
}

function NameEditor({ familyId, person }: PersonEditorProps) {
  const directoryModel = useDirectoryModel();

  const editor = useInlineEditor(async ({ firstName, lastName }) =>
    await directoryModel.updatePersonName(familyId!, person.id!, firstName, lastName),
    { firstName: person.firstName!, lastName: person.lastName! });

  return (editor.editing
    ? <>
        <Grid item xs={12} sm={6}>
          <TextField required id="first-name" label="First Name" fullWidth size="small"
            value={editor.value!.firstName}
            onChange={e => editor.setValue({ firstName: e.target.value, lastName: editor.value!.lastName })} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField required id="last-name" label="Last Name" fullWidth size="small"
            value={editor.value!.lastName}
            onChange={e => editor.setValue({ firstName: editor.value!.firstName, lastName: e.target.value })} />
        </Grid>
        <Grid item xs={12}>
          {editor.cancelButton}
          {editor.saveButton}
        </Grid>
      </>
    : <Grid item xs={12}>
        <PersonName person={person} />
        {editor.editButton}
      </Grid>);
}

interface EditAdultDialogProps {
  handle: DialogHandle
  adult: ValueTupleOfPersonAndFamilyAdultRelationshipInfo
}

function optional(arg: string) {
  return arg.length > 0 ? arg : null;
}

export function EditAdultDialog({ handle, adult }: EditAdultDialogProps) {
  const { familyId } = useParams<{ familyId: string }>();

  const person = adult.item1!;

  // const genderEditor = useInlineEditor(async gender =>
  //   await directoryModel.updatePersonGender(familyId!, person.id!, gender),
  //   person.gender);
  
  // const ageEditor = useInlineEditor(async age =>
  //   await directoryModel.updatePersonAge(familyId!, person.id!, age),
  //   person.age);
  
  // const ethnicityEditor = useInlineEditor(async ethnicity =>
  //   await directoryModel.updatePersonEthnicity(familyId!, person.id!, ethnicity),
  //   person.ethnicity);
  
  //TODO: isInHousehold
  //TODO: relationshipToFamily
  //TODO: address(es)
  //TODO: phone number(s)
  //TODO: email address(es)
  //TODO: notes
  //TODO: concerns

  const directoryModel = useDirectoryModel();

  const relationshipTypes = useRecoilValue(adultFamilyRelationshipsData);
  const ethnicities = useRecoilValue(ethnicitiesData);

  // if (firstName.length <= 0 || lastName.length <= 0) {
  //   alert("First and last name are required. Try again.");
  // } else if (gender == null) {
  //   alert("Gender was not selected. Try again.");
  // } else if (ageType === 'exact' && dateOfBirth == null) {
  //   alert("Date of birth was not specified. Try again.");
  // } else if (ageType === 'inYears' && ageInYears == null) {
  //   alert("Age in years was not specified. Try again.");
  // } else if (ageType === 'inYears' && ageInYears != null && ageInYears < 16) {
  //   alert("Age in years must be at least 16. Try again.");
  // } else if (ethnicity === '') {
  //   alert("Ethnicity was not selected. Try again.");
  // } else if (relationshipToFamily === '') { //TODO: Actual validation!
  //   alert("Family relationship was not selected. Try again.");

  return (
    <Dialog open={handle.open} onClose={handle.closeDialog}
      scroll='body' aria-labelledby="edit-adult-title">
      <DialogTitle id="edit-adult-title">
        Edit Adult
      </DialogTitle>
      <DialogContent>
        <form noValidate autoComplete="off">
          <Grid container spacing={2}>
            <NameEditor familyId={familyId!} person={person} />
          </Grid>
        </form>
        {/* <form noValidate autoComplete="off">
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
                  value={dateOfBirth} maxDate={subYears(new Date(), 16)} openTo="year"
                  disabled={ageType !== 'exact'} inputFormat="MM/dd/yyyy"
                  onChange={(date) => date && setFields({...fields, dateOfBirth: date})}
                  renderInput={(params) => <TextField size="small" required {...params} />} />
              </Grid>
              <Grid item>
                <TextField
                  id="age-years" label="Age" size="small"
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
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth size="small">
                <InputLabel id="family-relationship-label">Relationship to Family</InputLabel>
                <Select
                  labelId="family-relationship-label" id="family-relationship"
                  value={relationshipToFamily}
                  onChange={e => setFields({...fields, relationshipToFamily: e.target.value as string})}>
                    <MenuItem key="placeholder" value="" disabled>
                      Select a relationship type
                    </MenuItem>
                    {relationshipTypes.map(relationshipType =>
                      <MenuItem key={relationshipType} value={relationshipType}>{relationshipType}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormGroup row>
                <FormControlLabel
                  control={<Checkbox checked={isInHousehold} onChange={e => setFields({...fields, isInHousehold: e.target.checked})}
                    name="isInHousehold" color="primary" size="small" />}
                  label="In Household"
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField id="phone-number" label="Phone Number" fullWidth size="small" type="tel"
                value={phoneNumber} onChange={e => setFields({...fields, phoneNumber: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Phone Type:</FormLabel>
                <RadioGroup aria-label="phoneType" name="phoneType" row
                  value={PhoneNumberType[phoneType]} onChange={e => setFields({...fields, phoneType: PhoneNumberType[e.target.value as keyof typeof PhoneNumberType]})}>
                  <FormControlLabel value={PhoneNumberType[PhoneNumberType.Mobile]} control={<Radio size="small" />} label="Mobile" />
                  <FormControlLabel value={PhoneNumberType[PhoneNumberType.Home]} control={<Radio size="small" />} label="Home" />
                  <FormControlLabel value={PhoneNumberType[PhoneNumberType.Work]} control={<Radio size="small" />} label="Work" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField id="email-address" label="Email Address" fullWidth size="small" type="email"
                value={emailAddress} onChange={e => setFields({...fields, emailAddress: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Email Type:</FormLabel>
                <RadioGroup aria-label="emailType" name="emailType" row
                  value={EmailAddressType[emailType]} onChange={e => setFields({...fields, emailType: EmailAddressType[e.target.value as keyof typeof EmailAddressType]})}>
                  <FormControlLabel value={EmailAddressType[EmailAddressType.Personal]} control={<Radio size="small" />} label="Personal" />
                  <FormControlLabel value={EmailAddressType[EmailAddressType.Work]} control={<Radio size="small" />} label="Work" />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField id="address-line1" label="Address Line 1" fullWidth size="small"
                value={addressLine1} onChange={e => setFields({...fields, addressLine1: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField id="address-line2" label="Address Line 2" fullWidth size="small"
                value={addressLine2} onChange={e => setFields({...fields, addressLine2: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField id="address-city" label="City" fullWidth size="small"
                value={city} onChange={e => setFields({...fields, city: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField id="address-state" label="State" fullWidth size="small"
                value={state} onChange={e => setFields({...fields, state: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField id="address-postalcode" label="ZIP/Postal Code" fullWidth size="small"
                value={postalCode} onChange={e => setFields({...fields, postalCode: e.target.value})} />
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
        </form> */}
        {/*
        {(renamePersonParameter && <RenamePersonDialog familyId={partneringFamilyId} person={renamePersonParameter.person}
          onClose={() => setRenamePersonParameter(null)} />) || null}
        {(deleteParameter && <DeletePersonDialog familyId={deleteParameter.familyId} person={deleteParameter.person}
          onClose={() => setDeleteParameter(null)} />) || null}
        {(updateConcernsParameter && <UpdateConcernsDialog familyId={partneringFamilyId} person={updateConcernsParameter.person}
          onClose={() => setUpdateConcernsParameter(null)} />) || null}
        {(updateNotesParameter && <UpdateNotesDialog familyId={partneringFamilyId} person={updateNotesParameter.person}
          onClose={() => setUpdateNotesParameter(null)} />) || null}
        {(updatePhoneParameter && <UpdatePhoneDialog familyId={partneringFamilyId} person={updatePhoneParameter.person}
          onClose={() => setUpdatePhoneParameter(null)} />) || null}
        {(updateEmailParameter && <UpdateEmailDialog familyId={partneringFamilyId} person={updateEmailParameter.person}
          onClose={() => setUpdateEmailParameter(null)} />) || null}
        {(updateAddressParameter && <UpdateAddressDialog familyId={partneringFamilyId} person={updateAddressParameter.person}
          onClose={() => setUpdateAddressParameter(null)} />) || null}
          */}
      </DialogContent>
      <DialogActions>
        {/* <Button onClick={handle.closeDialog} color="secondary">
          Cancel
        </Button> */}
        <Button onClick={handle.closeDialog} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
