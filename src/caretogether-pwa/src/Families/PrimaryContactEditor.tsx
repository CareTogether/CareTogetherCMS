import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useInlineEditor } from '../useInlineEditor';
import { CombinedFamilyInfo, Permission } from '../GeneratedClient';
import { PersonName } from './PersonName';
import { usePermissions } from '../Model/SessionModel';

type PrimaryContactEditorProps = {
  family: CombinedFamilyInfo
};

export function PrimaryContactEditor({ family }: PrimaryContactEditorProps) {
  const directoryModel = useDirectoryModel();

  const primaryContactPerson = family.family!.adults!.filter(adult =>
    adult.item1!.id === family.family!.primaryFamilyContactPersonId)[0].item1!;
  
  const editor = useInlineEditor(async adultId =>
    await directoryModel.updatePrimaryFamilyContact(family.family!.id!, adultId),
    primaryContactPerson.id!);

  const permissions = usePermissions();
  
  return (editor.editing
  ? <Box>
      <FormControl required fullWidth size="small">
        <InputLabel id="primarycontact-label">Primary Contact</InputLabel>
        <Select
          labelId="primarycontact-label" id="primarycontact"
          value={editor.value}
          onChange={e => editor.setValue(e.target.value as string)}>
            <MenuItem key="placeholder" value="" disabled>
              Select the primary contact for the family
            </MenuItem>
            {family.family!.adults!.map(adult =>
              <MenuItem key={adult.item1!.id!} value={adult.item1!.id!}>
                <PersonName person={adult.item1!} />
              </MenuItem>)}
        </Select>
      </FormControl>
      {editor.cancelButton}
      {editor.saveButton}
    </Box>
  : <Box>
      Primary Contact: <PersonName person={primaryContactPerson} />
      {permissions(Permission.EditFamilyInfo) && editor.editButton}
    </Box>);
}
