import { Checkbox, FormControl, FormControlLabel, FormGroup, Grid, InputLabel, MenuItem, Select } from '@mui/material';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useInlineEditor } from '../useInlineEditor';
import { PersonEditorProps } from "./PersonEditorProps";
import { useRecoilValue } from 'recoil';
import { adultFamilyRelationshipsData } from '../Model/ConfigurationModel';
import { FamilyAdultRelationshipInfo } from '../GeneratedClient';

type AdultFamilyRelationshipEditorProps = PersonEditorProps & {
  relationship: FamilyAdultRelationshipInfo
}

export function AdultFamilyRelationshipEditor({ familyId, person, relationship }: AdultFamilyRelationshipEditorProps) {
  const relationshipTypes = useRecoilValue(adultFamilyRelationshipsData);
  const directoryModel = useDirectoryModel();

  const editor = useInlineEditor(async ({ isInHousehold, relationshipToFamily }) => {
    const valueToSave = new FamilyAdultRelationshipInfo();
    valueToSave.isInHousehold = isInHousehold;
    valueToSave.relationshipToFamily = relationshipToFamily;
    await directoryModel.updateAdultRelationshipToFamily(familyId!, person.id!, valueToSave)
  }, { isInHousehold: relationship.isInHousehold, relationshipToFamily: relationship.relationshipToFamily });

  return (
    <Grid container spacing={2}>
      {editor.editing
        ? <>
            <Grid item xs={12} sm={6}>
              <FormControl required fullWidth size="small">
                <InputLabel id="family-relationship-label">Relationship to Family</InputLabel>
                <Select
                  labelId="family-relationship-label" id="family-relationship"
                  value={editor.value?.relationshipToFamily}
                  onChange={e => editor.setValue({
                    isInHousehold: editor.value!.isInHousehold,
                    relationshipToFamily: e.target.value as string })}>
                    <MenuItem key="placeholder" value="" disabled>
                      Select a relationship type
                    </MenuItem>
                    {relationshipTypes.map(relationshipType =>
                      <MenuItem key={relationshipType} value={relationshipType}>{relationshipType}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormGroup row>
                <FormControlLabel
                  control={<Checkbox
                    checked={editor.value?.isInHousehold}
                    onChange={e => editor.setValue({
                      isInHousehold: e.target.checked,
                      relationshipToFamily: editor.value!.relationshipToFamily })}
                    name="isInHousehold" color="primary" size="small" />}
                  label="In Household"
                />
              </FormGroup>
            </Grid>
            <Grid item xs={12}>
              {editor.cancelButton}
              {editor.saveButton}
            </Grid>
          </>
        : <Grid item xs={12}>
            Relationship type: {relationship.relationshipToFamily}, {relationship.isInHousehold
            ? "household member" : "not in household"}
            {editor.editButton}
        </Grid>}
    </Grid>
  );
}
