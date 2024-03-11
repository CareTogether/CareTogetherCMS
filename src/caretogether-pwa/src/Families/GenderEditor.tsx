import { FormControl, FormControlLabel, FormLabel, Grid, Radio, RadioGroup } from '@mui/material';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import { PersonEditorProps } from "./PersonEditorProps";
import { Gender } from '../GeneratedClient';

export function GenderEditor({ familyId, person }: PersonEditorProps) {
  const directoryModel = useDirectoryModel();

  const editor = useInlineEditor(async gender =>
    await directoryModel.updatePersonGender(familyId!, person.id!, gender),
    person.gender);

  return (
    <Grid container spacing={2}>
      {editor.editing
        ? <>
          <Grid item xs={12}>
            <FormControl required component="fieldset">
              <FormLabel component="legend">Gender:</FormLabel>
              <RadioGroup aria-label="genderType" name="genderType" row
                value={editor.value == null ? '' : Gender[editor.value]}
                onChange={e => editor.setValue(Gender[e.target.value as keyof typeof Gender])}>
                <FormControlLabel value={Gender[Gender.Male]} control={<Radio size="small" />} label="Male" />
                <FormControlLabel value={Gender[Gender.Female]} control={<Radio size="small" />} label="Female" />
                <FormControlLabel value={Gender[Gender.SeeNotes]} control={<Radio size="small" />} label="See Notes" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            {editor.cancelButton}
            {editor.saveButton}
          </Grid>
        </>
        : <Grid item xs={12}>
          Gender: {
            (person.gender !== null && typeof (person.gender) !== 'undefined')
              ? (person.gender === Gender.Male ? "Male"
                : person.gender === Gender.Female ? "Female"
                  : "(see notes)")
              : ""}
          {editor.editButton}
        </Grid>}
    </Grid>
  );
}
