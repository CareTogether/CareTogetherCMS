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
  EmailAddress,
  IEmailAddress,
  EmailAddressType,
  Permission,
} from '../GeneratedClient';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useFamilyIdPermissions } from '../Model/SessionModel';

type EmailAddressEditorProps = PersonEditorProps & {
  add?: boolean;
  emailAddress?: EmailAddress;
};

type IEmailAddressWithPreference = Partial<IEmailAddress> & {
  isPreferred?: boolean;
};

export function EmailAddressEditor({
  familyId,
  person,
  add,
  emailAddress,
}: EmailAddressEditorProps) {
  const directoryModel = useDirectoryModel();

  // Automatically assume this is the person's preferred email address if it is the
  // first email address being added for that person.
  const isPreferred =
    person.preferredEmailAddressId === emailAddress?.id ||
    typeof person.emailAddresses === 'undefined' ||
    person.emailAddresses.length === 0;
  const emailAddressWithPreference = { ...emailAddress } as
    | IEmailAddressWithPreference
    | undefined;
  if (typeof emailAddressWithPreference !== 'undefined')
    emailAddressWithPreference.isPreferred = isPreferred;

  const editor = useInlineEditor(
    async (value) =>
      await (add
        ? directoryModel.addPersonEmailAddress(
            familyId!,
            person.id!,
            value!.address!,
            value!.type!,
            value!.isPreferred!
          )
        : directoryModel.updatePersonEmailAddress(
            familyId!,
            person.id!,
            value.id!,
            value.address!,
            value.type!,
            value!.isPreferred!
          )),
    emailAddressWithPreference,
    (value) =>
      (value &&
        value.address!.length > 0 &&
        (value.address !== emailAddress?.address ||
          value.type !== emailAddress?.type ||
          value.isPreferred !== isPreferred)) as boolean
  );

  function handleAdd() {
    editor.setValue({
      address: '',
      type: EmailAddressType.Personal,
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
              id="email-address"
              label="Email Address"
              fullWidth
              size="small"
              type="email"
              value={editor.value!.address!}
              onChange={(e) =>
                editor.setValue({ ...editor.value, address: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Email Type:</FormLabel>
              <RadioGroup
                aria-label="emailType"
                name="emailType"
                row
                value={EmailAddressType[editor.value!.type!]}
                onChange={(e) =>
                  editor.setValue({
                    ...editor.value,
                    type: EmailAddressType[
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
              label="Is Preferred Email Address"
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
              {emailAddress!.address} - {EmailAddressType[emailAddress!.type!]}
              {permissions(Permission.EditPersonContactInfo) &&
                editor.editButton}
            </>
          )}
        </Grid>
      )}
    </Grid>
  );
}
