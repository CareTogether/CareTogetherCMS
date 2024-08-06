import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import { CombinedFamilyInfo, Permission } from '../GeneratedClient';
import { PersonName } from './PersonName';
import { useFamilyPermissions } from '../Model/SessionModel';

type PrimaryContactEditorProps = {
  family: CombinedFamilyInfo;
};

export function PrimaryContactEditor({ family }: PrimaryContactEditorProps) {
  const directoryModel = useDirectoryModel();

  const primaryFamilyContactPersonId =
    family.family!.primaryFamilyContactPersonId!;

  const primaryContactPerson = family.family!.adults!.find(
    (adult) => adult.item1!.id === primaryFamilyContactPersonId
  )?.item1;
  const primaryContactPersonDeleted = !primaryContactPerson;

  const editor = useInlineEditor(
    async (adultId) =>
      await directoryModel.updatePrimaryFamilyContact(
        family.family!.id!,
        adultId
      ),
    primaryFamilyContactPersonId
  );

  const permissions = useFamilyPermissions(family);

  return editor.editing ? (
    <Box>
      <FormControl required fullWidth size="small">
        <InputLabel id="primarycontact-label">Primary Contact</InputLabel>
        <Select
          labelId="primarycontact-label"
          id="primarycontact"
          value={editor.value}
          onChange={(e) => editor.setValue(e.target.value as string)}
        >
          <MenuItem key="placeholder" value="" disabled>
            Select the primary contact for the family
          </MenuItem>
          {family.family!.adults!.map((adult) => (
            <MenuItem key={adult.item1!.id!} value={adult.item1!.id!}>
              <PersonName person={adult.item1!} />
            </MenuItem>
          ))}
          {primaryContactPersonDeleted && (
            <MenuItem
              key={primaryFamilyContactPersonId}
              value={primaryFamilyContactPersonId}
              disabled
            >
              ⚠ DELETED PERSON
            </MenuItem>
          )}
        </Select>
      </FormControl>
      {editor.cancelButton}
      {editor.saveButton}
    </Box>
  ) : (
    <Box>
      {primaryContactPersonDeleted && (
        <>
          <Chip size="medium" label={'No primary contact!'} color="error" />
          <br />
        </>
      )}
      Primary Contact: <PersonName person={primaryContactPerson} />
      {permissions(Permission.EditFamilyInfo) && editor.editButton}
    </Box>
  );
}
