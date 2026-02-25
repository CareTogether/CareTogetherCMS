import { useState } from 'react';
import {
  Button,
  Checkbox,
  Drawer,
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
  Typography,
  Autocomplete,
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
    v1CaseOpenedAtLocal: new Date(),
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
    v1CaseOpenedAtLocal,
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
          v1CaseOpenedAtLocal,
          firstName,
          lastName,
          gender,
          age?.toJSON(),
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
    <Drawer
      anchor="right"
      open
      onClose={() => onClose()}
      PaperProps={{
        sx: {
          width: 600,
          p: 3,
          top: 45,
        },
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="h6">
            Create Partnering Family - First Adult
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            Provide the basic information needed for the first adult in the
            family.
          </Typography>
        </Grid>

        <Grid item xs={12}>
          <ValidateDatePicker
            label="When was this Case opened?"
            value={v1CaseOpenedAtLocal}
            disableFuture
            onChange={(date) =>
              date && setFields({ ...fields, v1CaseOpenedAtLocal: date })
            }
            onErrorChange={setReferralDateError}
            textFieldProps={{ fullWidth: true, required: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            required
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
            label="Last Name"
            fullWidth
            size="small"
            value={lastName}
            onChange={(e) => setFields({ ...fields, lastName: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <Autocomplete
            fullWidth
            size="small"
            options={relationshipTypes}
            value={
              relationshipTypes.find((r) => r === relationshipToFamily) ?? null
            }
            onChange={(_, value) =>
              setFields({
                ...fields,
                relationshipToFamily: value ?? '',
              })
            }
            renderInput={(params) => (
              <TextField {...params} label="Relationship to Family" required />
            )}
          />
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
          <FormControl>
            <FormLabel>Gender</FormLabel>
            <RadioGroup
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
                value="Male"
                control={<Radio size="small" />}
                label="Male"
              />
              <FormControlLabel
                value="Female"
                control={<Radio size="small" />}
                label="Female"
              />
              <FormControlLabel
                value="SeeNotes"
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
            openTo="year"
            onChange={(date) => setFields({ ...fields, dateOfBirth: date })}
            onErrorChange={setDobError}
            textFieldProps={{ size: 'small', fullWidth: true }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Ethnicity</InputLabel>
            <Select
              value={ethnicity}
              onChange={(e) =>
                setFields({ ...fields, ethnicity: e.target.value as string })
              }
            >
              <MenuItem value="" disabled>
                Select an ethnicity
              </MenuItem>
              {ethnicities.map((e) => (
                <MenuItem key={e} value={e}>
                  {e}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <AddressFormFields
          address={address}
          onEdit={(value) => setFields({ ...fields, address: value })}
        />

        <Grid item xs={12}>
          <TextField
            label="Concerns"
            multiline
            fullWidth
            minRows={2}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <WarningIcon />
                </InputAdornment>
              ),
            }}
            value={concerns ?? ''}
            onChange={(e) => setFields({ ...fields, concerns: e.target.value })}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            label="Notes"
            multiline
            fullWidth
            minRows={2}
            size="small"
            value={notes ?? ''}
            onChange={(e) => setFields({ ...fields, notes: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sx={{ textAlign: 'right', mt: 2 }}>
          <Button
            variant="contained"
            color="secondary"
            sx={{ mr: 2 }}
            onClick={() => onClose()}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            color="primary"
            onClick={save}
            disabled={dobError || referralDateError}
          >
            Create Family
          </Button>
        </Grid>
      </Grid>
    </Drawer>
  );
}
