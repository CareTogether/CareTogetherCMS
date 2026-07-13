import Grid from '@mui/material/Grid';
import { TextField } from '@mui/material';
import { Permission } from '../GeneratedClient';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useFamilyIdPermissions } from '../Model/SessionModel';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import { PersonEditorProps } from './PersonEditorProps';

type NotesEditorProps = PersonEditorProps & {
  label?: string;
};

export function NotesEditor({
  familyId,
  label = 'Notes',
  person,
}: NotesEditorProps) {
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
          <Grid size={12}>
            <TextField
              id="notes"
              label={label}
              placeholder={`Space for any general ${label.toLocaleLowerCase()}`}
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
          <Grid size={12}>
            {editor.cancelButton}
            {editor.saveButton}
          </Grid>
        </>
      ) : (
        <Grid size={12}>
          {label}: {person.notes}
          {permissions(Permission.EditPersonNotes) && editor.editButton}
        </Grid>
      )}
    </Grid>
  );
}
