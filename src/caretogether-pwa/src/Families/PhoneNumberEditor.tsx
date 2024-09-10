import {
  Button,
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Grid,
  Radio,
  RadioGroup,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import { PersonEditorProps } from './PersonEditorProps';
import {
  PhoneNumber,
  IPhoneNumber,
  PhoneNumberType,
  Permission,
} from '../GeneratedClient';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useFamilyIdPermissions } from '../Model/SessionModel';

type PhoneNumberEditorProps = PersonEditorProps & {
  add?: boolean;
  phoneNumber?: PhoneNumber;
};

type IPhoneNumberWithPreference = IPhoneNumber & {
  isPreferred?: boolean;
};

export function PhoneNumberEditor({
  familyId,
  person,
  add,
  phoneNumber,
}: PhoneNumberEditorProps) {
  const directoryModel = useDirectoryModel();

  // Automatically assume this is the person's preferred phone number if it is the
  // first phone number being added for that person.
  const isPreferred =
    person.preferredPhoneNumberId === phoneNumber?.id ||
    typeof person.phoneNumbers === 'undefined' ||
    person.phoneNumbers.length === 0;
  const phoneNumberWithPreference = { ...phoneNumber } as
    | IPhoneNumberWithPreference
    | undefined;
  if (typeof phoneNumberWithPreference !== 'undefined')
    phoneNumberWithPreference.isPreferred = isPreferred;

  const editor = useInlineEditor(
    async (value) =>
      await (add
        ? directoryModel.addPersonPhoneNumber(
            familyId!,
            person.id!,
            value!.number!,
            value!.type!,
            value!.isPreferred!
          )
        : directoryModel.updatePersonPhoneNumber(
            familyId!,
            person.id!,
            value!.id!,
            value!.number!,
            value!.type!,
            value!.isPreferred!
          )),
    phoneNumberWithPreference,
    (value) =>
      (value &&
        value.number!.length > 0 &&
        (value.number !== phoneNumber?.number ||
          value.type !== phoneNumber?.type ||
          value.isPreferred !== isPreferred)) as boolean
  );

  function handleAdd() {
    editor.setValue({
      number: '',
      type: PhoneNumberType.Mobile,
      isPreferred: isPreferred,
    });
    editor.setEditing(true);
  }

  const permissions = useFamilyIdPermissions(familyId);

  return (
    <Grid container rowSpacing={0} columnSpacing={2}>
      {editor.editing ? (
        <>
          <Grid item xs={12}>
            <Divider />
            <br />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              id="phone-number"
              label="Phone Number"
              fullWidth
              size="small"
              type="tel"
              value={editor.value!.number!}
              onChange={(e) =>
                editor.setValue({ ...editor.value, number: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Phone Type:</FormLabel>
              <RadioGroup
                aria-label="phoneType"
                name="phoneType"
                row
                value={PhoneNumberType[editor.value!.type!]}
                onChange={(e) =>
                  editor.setValue({
                    ...editor.value,
                    type: PhoneNumberType[
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
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editor.value!.isPreferred}
                  onChange={(e) =>
                    editor.setValue({
                      ...editor.value,
                      isPreferred: e.target.checked,
                    })
                  }
                  icon={<FavoriteBorder />}
                  checkedIcon={<Favorite />}
                />
              }
              label="Is Preferred Phone Number"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            {editor.cancelButton}
            {editor.saveButton}
          </Grid>
          <Grid item xs={12}>
            <Divider />
            <br />
          </Grid>
        </>
      ) : (
        <Grid item xs={12}>
          {add ? (
            <Button
              onClick={handleAdd}
              variant="text"
              size="small"
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          ) : (
            <>
              {isPreferred ? (
                <Favorite
                  fontSize="small"
                  color="disabled"
                  sx={{ verticalAlign: 'middle', marginRight: 1 }}
                />
              ) : (
                <FavoriteBorder
                  fontSize="small"
                  color="disabled"
                  sx={{ verticalAlign: 'middle', marginRight: 1 }}
                />
              )}
              {phoneNumber!.number} - {PhoneNumberType[phoneNumber!.type!]}
              {permissions(Permission.EditPersonContactInfo) &&
                editor.editButton}
            </>
          )}
        </Grid>
      )}
    </Grid>
  );
}
