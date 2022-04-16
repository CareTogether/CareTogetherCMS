import { FormControl, Grid, MenuItem, Select } from '@mui/material';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { useInlineEditor } from '../../useInlineEditor';
import { PersonEditorProps } from "./PersonEditorProps";
import { CustodialRelationship, CustodialRelationshipType, Person } from '../../GeneratedClient';
import { PersonName } from './PersonName';

type ChildCustodyRelationshipEditorProps = PersonEditorProps & {
  adult: Person
  relationship?: CustodialRelationship
}

export function ChildCustodyRelationshipEditor({ familyId, person, adult, relationship }: ChildCustodyRelationshipEditorProps) {
  const directoryModel = useDirectoryModel();

  const editor = useInlineEditor(async type => {
    if (type === -1) {
      await directoryModel.removeCustodialRelationship(familyId, person.id!, adult.id!);
    } else {
      await directoryModel.upsertCustodialRelationship(familyId, person.id!, adult.id!, type);
    }
  }, typeof relationship?.type === 'undefined' ? -1 : relationship.type as CustodialRelationshipType | -1);

  return (
    <Grid container spacing={2}>
      {editor.editing
        ? <>
            <Grid item xs={12}>
              <PersonName person={adult} />

              <FormControl required fullWidth size="small">
                <Select
                  id={"custodial-relationship-"+adult.id}
                  value={editor.value}
                  onChange={e => editor.setValue(e.target.value as CustodialRelationshipType | -1)}>
                    <MenuItem key="none" value={-1}>None</MenuItem>
                    <MenuItem key='ParentWithCustody' value={CustodialRelationshipType.ParentWithCustody}>Parent with custody</MenuItem>
                    <MenuItem key='ParentWithCourtAppointedCustody' value={CustodialRelationshipType.ParentWithCourtAppointedCustody}>Parent with court-appointed custody</MenuItem>
                    <MenuItem key='LegalGuardian' value={CustodialRelationshipType.LegalGuardian}>Legal guardian</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              {editor.cancelButton}
              {editor.saveButton}
            </Grid>
          </>
        : <Grid item xs={12}>
            <PersonName person={adult} />:
            <span> </span>
            {editor.value === CustodialRelationshipType.LegalGuardian
              ? "legal guardian"
              : editor.value === CustodialRelationshipType.ParentWithCustody
              ? "parent with custody"
              : editor.value === CustodialRelationshipType.ParentWithCourtAppointedCustody
              ? "parent with court-appointed sole custody"
              : "none"}
            {editor.editButton}
        </Grid>}
    </Grid>
  );
}
