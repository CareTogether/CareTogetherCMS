import { useState } from 'react';
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
} from '@mui/material';
import {
  ExactAge,
  Gender,
  PhoneNumberType,
  EmailAddressType,
  IAddress,
  Address,
} from '../GeneratedClient';
import { useDirectoryModel } from '../Model/DirectoryModel';
import WarningIcon from '@mui/icons-material/Warning';
import { ValidateDatePicker } from '../Generic/Forms/ValidateDatePicker';
import { useRecoilValue } from 'recoil';
import {
  adultFamilyRelationshipsData,
  ethnicitiesData,
} from '../Model/ConfigurationModel';
import { useBackdrop } from '../Hooks/useBackdrop';
import { subYears } from 'date-fns';
import { AddressFormFields } from '../Families/AddressEditor';
import { isBackdropClick } from '../Utilities/handleBackdropClick';

interface CreatePartneringFamilyDialogProps {
  onClose: (partneringFamilyId?: string) => void;
}

function optional(arg: string) {
  return arg.length > 0 ? arg : null;
}

export function CreatePartneringFamilyDialog({
  onClose,
}: CreatePartneringFamilyDialogProps) {
  const [fields, setFields] = useState({
    referralOpenedAtLocal: new Date(),
    firstName: '',
    lastName: '',
    gender: null as Gender | null,
    dateOfBirth: null as Date | null,
    ethnicity: '',
    isInHousehold: true,
    relationshipToFamily: '',
    address: null as IAddress | null,
    phoneNumber: '',
    phoneType: PhoneNumberType.Mobile,
    emailAddress: '',
    emailType: EmailAddressType.Personal,
    notes: null as string | null,
    concerns: null as string | null,
  });
  const {
    referralOpenedAtLocal,
    firstName,
    lastName,
    gender,
    dateOfBirth,
    ethnicity,
    isInHousehold,
    relationshipToFamily,
    address,
    phoneNumber,
    phoneType,
    emailAddress,
    emailType,
    notes,
    concerns,
  } = fields;
  const directoryModel = useDirectoryModel();

  const relationshipTypes = useRecoilValue(adultFamilyRelationshipsData);
  const ethnicities = useRecoilValue(ethnicitiesData);

  const [dobError, setDobError] = useState(false);

  const withBackdrop = useBackdrop();

  const [referralDateError, setReferralDateError] = useState(false);

  async function save() {
    await withBackdrop(async () => {
      if (firstName.length <= 0 || lastName.length <= 0) {
        alert('First and last name are required. Try again.');
      } else if (relationshipToFamily === '') {
        //TODO: Actual validation!
        alert('Family relationship was not selected. Try again.');
      } else {
        const age = dateOfBirth == null ? null : new ExactAge();
        if (dateOfBirth != null) age!.dateOfBirth = dateOfBirth;
        const familyId = crypto.randomUUID();
        await directoryModel.createPartneringFamilyWithNewAdult(
          familyId,
          referralOpenedAtLocal,
          firstName,
          lastName,
          gender,
          age,
          optional(ethnicity),
          isInHousehold,
          relationshipToFamily,
          address == null
            ? null
            : new Address({ ...address, id: crypto.randomUUID() }),
          optional(phoneNumber),
          phoneType,
          optional(emailAddress),
          emailType,
          notes == null ? undefined : notes,
          concerns == null ? undefined : concerns
        );
        //TODO: Error handling (start with a basic error dialog w/ request to share a screenshot, and App Insights logging)
        onClose(familyId);
      }
    });
  }

  return (
    <Dialog
      open={true}
      onClose={(_, reason: string) =>
        !isBackdropClick(reason) ? onClose() : {}
      }
      scroll="body"
      aria-labelledby="create-family-title"
    >
      <DialogTitle id="create-family-title">
        Create Partnering Family - First Adult
      </DialogTitle>
      <DialogContent>
        <Grid item xs={12} sx={{ paddingTop: 1 }}>
          <ValidateDatePicker
            label="When was this referral opened?"
            value={referralOpenedAtLocal}
            disableFuture
            minDate={new Date(1900, 0, 1)}
            onChange={(date) => {
              if (date) setFields({ ...fields, referralOpenedAtLocal: date });
            }}
            onErrorChange={setReferralDateError}
            textFieldProps={{
              fullWidth: true,
              required: true,
            }}
          />
        </Grid>
        <DialogContentText>
          Provide the basic information needed for the first adult in the
          family.
        </DialogContentText>
        <form noValidate autoComplete="off">
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="first-name"
                label="First Name"
                fullWidth
                size="small"
                value={firstName}
                onChange={(e) =>
                  setFields({ ...fields, firstName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                id="last-name"
                label="Last Name"
                fullWidth
                size="small"
                value={lastName}
                onChange={(e) =>
                  setFields({ ...fields, lastName: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth size="small">
                <InputLabel id="family-relationship-label">
                  Relationship to Family
                </InputLabel>
                <Select
                  labelId="family-relationship-label"
                  id="family-relationship"
                  value={relationshipToFamily}
                  onChange={(e) =>
                    setFields({
                      ...fields,
                      relationshipToFamily: e.target.value as string,
                    })
                  }
                >
                  <MenuItem key="placeholder" value="" disabled>
                    Select a relationship type
                  </MenuItem>
                  {relationshipTypes.map((relationshipType) => (
                    <MenuItem key={relationshipType} value={relationshipType}>
                      {relationshipType}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isInHousehold}
                      onChange={(e) =>
                        setFields({
                          ...fields,
                          isInHousehold: e.target.checked,
                        })
                      }
                      name="isInHousehold"
                      color="primary"
                      size="small"
                    />
                  }
                  label="In Household"
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              <Divider />
            </Grid>
            <Grid item xs={12}>
              <FormControl component="fieldset">
                <FormLabel component="legend">Gender:</FormLabel>
                <RadioGroup
                  aria-label="genderType"
                  name="genderType"
                  row
                  value={gender == null ? null : Gender[gender]}
                  onChange={(e) =>
                    setFields({
                      ...fields,
                      gender: Gender[e.target.value as keyof typeof Gender],
                    })
                  }
                >
                  <FormControlLabel
                    value={Gender[Gender.Male]}
                    control={<Radio size="small" />}
                    label="Male"
                  />
                  <FormControlLabel
                    value={Gender[Gender.Female]}
                    control={<Radio size="small" />}
                    label="Female"
                  />
                  <FormControlLabel
                    value={Gender[Gender.SeeNotes]}
                    control={<Radio size="small" />}
                    label="See Notes"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <ValidateDatePicker
                label="Date of birth"
                value={dateOfBirth}
                maxDate={subYears(new Date(), 16)}
                onChange={(date) => setFields({ ...fields, dateOfBirth: date })}
                onErrorChange={setDobError}
                textFieldProps={{
                  size: 'small',
                  fullWidth: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel id="ethnicity-label">Ethnicity</InputLabel>
                <Select
                  labelId="ethnicity-label"
                  id="ethnicity"
                  value={ethnicity}
                  onChange={(e) =>
                    setFields({
                      ...fields,
                      ethnicity: e.target.value as string,
                    })
                  }
                >
                  <MenuItem key="placeholder" value="" disabled>
                    Select an ethnicity
                  </MenuItem>
                  {ethnicities.map((ethnicity) => (
                    <MenuItem key={ethnicity} value={ethnicity}>
                      {ethnicity}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}></Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="phone-number"
                label="Phone Number"
                fullWidth
                size="small"
                type="tel"
                value={phoneNumber}
                onChange={(e) =>
                  setFields({ ...fields, phoneNumber: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <RadioGroup
                  aria-label="phoneType"
                  name="phoneType"
                  row
                  value={PhoneNumberType[phoneType]}
                  onChange={(e) =>
                    setFields({
                      ...fields,
                      phoneType:
                        PhoneNumberType[
                          e.target.value as keyof typeof PhoneNumberType
                        ],
                    })
                  }
                >
                  <FormControlLabel
                    value={PhoneNumberType[PhoneNumberType.Mobile]}
                    control={<Radio size="small" />}
                    label="Mobile"
                  />
                  <FormControlLabel
                    value={PhoneNumberType[PhoneNumberType.Home]}
                    control={<Radio size="small" />}
                    label="Home"
                  />
                  <FormControlLabel
                    value={PhoneNumberType[PhoneNumberType.Work]}
                    control={<Radio size="small" />}
                    label="Work"
                  />
                  {/* <FormControlLabel value={PhoneNumberType[PhoneNumberType.Fax]} control={<Radio size="small" />} label="Fax" /> */}
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                id="email-address"
                label="Email Address"
                fullWidth
                size="small"
                type="email"
                value={emailAddress}
                onChange={(e) =>
                  setFields({ ...fields, emailAddress: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl component="fieldset">
                <RadioGroup
                  aria-label="emailType"
                  name="emailType"
                  row
                  value={EmailAddressType[emailType]}
                  onChange={(e) =>
                    setFields({
                      ...fields,
                      emailType:
                        EmailAddressType[
                          e.target.value as keyof typeof EmailAddressType
                        ],
                    })
                  }
                >
                  <FormControlLabel
                    value={EmailAddressType[EmailAddressType.Personal]}
                    control={<Radio size="small" />}
                    label="Personal"
                  />
                  <FormControlLabel
                    value={EmailAddressType[EmailAddressType.Work]}
                    control={<Radio size="small" />}
                    label="Work"
                  />
                </RadioGroup>
              </FormControl>
            </Grid>
            <Grid item xs={12}></Grid>
            <AddressFormFields
              address={address}
              onEdit={(value) => setFields({ ...fields, address: value })}
            />
            <Grid item xs={12}></Grid>
            <Grid item xs={12}>
              <TextField
                id="concerns"
                label="Concerns"
                placeholder="Note any safety risks, allergies, etc."
                multiline
                fullWidth
                variant="outlined"
                minRows={2}
                maxRows={5}
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <WarningIcon />
                    </InputAdornment>
                  ),
                }}
                value={concerns == null ? '' : concerns}
                onChange={(e) =>
                  setFields({ ...fields, concerns: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                id="notes"
                label="Notes"
                placeholder="Space for any general notes"
                multiline
                fullWidth
                variant="outlined"
                minRows={2}
                maxRows={5}
                size="small"
                value={notes == null ? '' : notes}
                onChange={(e) =>
                  setFields({ ...fields, notes: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </form>
      </DialogContent>
      <DialogActions sx={{ marginBottom: 4 }}>
        <Button onClick={() => onClose()} color="secondary">
          Cancel
        </Button>
        <Button
          onClick={save}
          variant="contained"
          color="primary"
          disabled={dobError || referralDateError}
        >
          Create Family
        </Button>
      </DialogActions>
    </Dialog>
  );
}
