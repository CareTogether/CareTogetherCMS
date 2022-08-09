import { Grid, TextField } from '@mui/material';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import { PersonName } from './PersonName';
import { PersonEditorProps } from "./PersonEditorProps";

export function NameEditor({ familyId, person }: PersonEditorProps) {
  const directoryModel = useDirectoryModel();

  const editor = useInlineEditor(async ({ firstName, lastName }) =>
    await directoryModel.updatePersonName(familyId!, person.id!, firstName, lastName),
    { firstName: person.firstName!, lastName: person.lastName! },
    value => (value &&
      (value.firstName.length > 0 && value.lastName.length > 0) &&
      (value.firstName !== person.firstName || value.lastName !== person.lastName)) as boolean);

  return (
    <Grid container spacing={2}>
      {editor.editing
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
            Name: <PersonName person={person} />
            {editor.editButton}
        </Grid>}
    </Grid>
  );
}
