import { Grid, TextField } from '@mui/material';
import { Permission } from '../GeneratedClient';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import { PersonEditorProps } from './PersonEditorProps';

export function NotesEditor({ familyId, person }: PersonEditorProps) {
  const directoryModel = useDirectoryModel();

  const editor = useInlineEditor(
    async (notes) =>
      await directoryModel.updatePersonNotes(
        familyId!,
        person.id!,
        notes != null && notes.length > 0 ? notes : null
      ),
    typeof person.notes === 'undefined' ? null : person.notes
  );

  const permissions = useFamilyIdPermissions(familyId);

  return (
    <Grid container spacing={2}>
      {editor.editing ? (
        <>
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
              value={editor.value == null ? '' : editor.value}
              onChange={(e) => editor.setValue(e.target.value)}
            />
          </Grid>
          <Grid item xs={12}>
            {editor.cancelButton}
            {editor.saveButton}
          </Grid>
        </>
      ) : (
        <Grid item xs={12}>
          Notes: {person.notes}
          {permissions(Permission.EditPersonNotes) && editor.editButton}
        </Grid>
      )}
    </Grid>
  );
}
