import {
  Autocomplete,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  TextField,
} from '@mui/material';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import { PersonEditorProps } from './PersonEditorProps';
import { useRecoilValue } from 'recoil';
import { adultFamilyRelationshipsData } from '../Model/ConfigurationModel';
import { FamilyAdultRelationshipInfo } from '../GeneratedClient';

type AdultFamilyRelationshipEditorProps = PersonEditorProps & {
  relationship: FamilyAdultRelationshipInfo;
};

export function AdultFamilyRelationshipEditor({
  familyId,
  person,
  relationship,
}: AdultFamilyRelationshipEditorProps) {
  const relationshipTypes = useRecoilValue(adultFamilyRelationshipsData);
  const directoryModel = useDirectoryModel();
  const relationshipToFamilyDisplay =
    relationship.relationshipToFamily || 'Not specified';

  const editor = useInlineEditor(
    async ({ isInHousehold, relationshipToFamily }) => {
      const valueToSave = new FamilyAdultRelationshipInfo();
      valueToSave.isInHousehold = isInHousehold;
      valueToSave.relationshipToFamily =
        relationshipToFamily && relationshipToFamily.length > 0
          ? relationshipToFamily
          : undefined;
      await directoryModel.updateAdultRelationshipToFamily(
        familyId!,
        person.id!,
        valueToSave
      );
    },
    {
      isInHousehold: relationship.isInHousehold,
      relationshipToFamily: relationship.relationshipToFamily ?? '',
    }
  );

  return (
    <Grid container spacing={2}>
      {editor.editing ? (
        <>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              fullWidth
              size="small"
              options={relationshipTypes}
              value={editor.value?.relationshipToFamily ?? ''}
              onChange={(_, value) =>
                editor.setValue({
                  isInHousehold: editor.value!.isInHousehold,
                  relationshipToFamily: value ?? '',
                })
              }
              onInputChange={(_, value) =>
                editor.setValue({
                  isInHousehold: editor.value!.isInHousehold,
                  relationshipToFamily: value,
                })
              }
              renderInput={(params) => (
                <TextField {...params} label="Relationship to Family" />
              )}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={editor.value?.isInHousehold}
                    onChange={(e) =>
                      editor.setValue({
                        isInHousehold: e.target.checked,
                        relationshipToFamily:
                          editor.value!.relationshipToFamily,
                      })
                    }
                    name="isInHousehold"
                    color="primary"
                    size="small"
                  />
                }
                label="In Household"
              />
            </FormGroup>
          </Grid>
          <Grid item xs={12}>
            {editor.cancelButton}
            {editor.saveButton}
          </Grid>
        </>
      ) : (
        <Grid item xs={12}>
          Relationship type: {relationshipToFamilyDisplay},{' '}
          {relationship.isInHousehold ? 'household member' : 'not in household'}
          {editor.editButton}
        </Grid>
      )}
    </Grid>
  );
}
