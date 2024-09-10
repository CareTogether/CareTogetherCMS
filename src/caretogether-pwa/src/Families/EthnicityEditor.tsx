import { FormControl, Grid, InputLabel, MenuItem, Select } from '@mui/material';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import { PersonEditorProps } from './PersonEditorProps';
import { ethnicitiesData } from '../Model/ConfigurationModel';
import { useRecoilValue } from 'recoil';

export function EthnicityEditor({ familyId, person }: PersonEditorProps) {
  const ethnicities = useRecoilValue(ethnicitiesData);
  const directoryModel = useDirectoryModel();

  const editor = useInlineEditor(
    async (ethnicity) =>
      await directoryModel.updatePersonEthnicity(
        familyId!,
        person.id!,
        ethnicity
      ),
    person.ethnicity!
  );

  return (
    <Grid container spacing={2}>
      {editor.editing ? (
        <>
          <Grid item xs={12}>
            <FormControl required fullWidth size="small">
              <InputLabel id="ethnicity-label">Ethnicity</InputLabel>
              <Select
                labelId="ethnicity-label"
                id="ethnicity"
                value={editor.value || ''}
                onChange={(e) => editor.setValue(e.target.value as string)}
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
          <Grid item xs={12}>
            {editor.cancelButton}
            {editor.saveButton}
          </Grid>
        </>
      ) : (
        <Grid item xs={12}>
          Ethnicity: {person.ethnicity}
          {editor.editButton}
        </Grid>
      )}
    </Grid>
  );
}
