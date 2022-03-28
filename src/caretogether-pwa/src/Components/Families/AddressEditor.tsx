import { Grid, TextField } from '@mui/material';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { useInlineEditor } from '../../useInlineEditor';
import { PersonEditorProps } from "./PersonEditorProps";
import { Address, IAddress } from '../../GeneratedClient';

type AddressEditorProps = PersonEditorProps & {
  address: Address
}

export function AddressEditor({ familyId, person, address }: AddressEditorProps) {
  const directoryModel = useDirectoryModel();

  const editor = useInlineEditor(async value =>
    await directoryModel.updatePersonAddress(familyId!, person.id!,
      value.id!, value.line1!, value.line2!.length > 0 ? value.line2! : null,
      value.city!, value.state!, value.postalCode!),
    address as IAddress,
    value => (value &&
      (value.line1!.length > 0 && value.city!.length > 0 && value.state!.length > 0 && value.postalCode!.length > 0) &&
      (value.line1 !== address.line1 ||
        (address.line2 && address.line2.length > 0 ? value.line2 !== address.line2 : value.line2 !== "") ||
        value.city !== address.city || value.state !== address.state || value.postalCode !== address.postalCode)) as boolean);

  return (
    <Grid container spacing={2}>
      {editor.editing
        ? <>
            <Grid item xs={12}>
              <TextField id="address-line1" label="Address Line 1" fullWidth size="small"
                value={editor.value?.line1 || ""}
                onChange={e => editor.setValue({...editor.value, line1: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              <TextField id="address-line2" label="Address Line 2" fullWidth size="small"
                value={editor.value?.line2 || ""}
                onChange={e => editor.setValue({...editor.value, line2: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField id="address-city" label="City" fullWidth size="small"
                value={editor.value?.city || ""}
                onChange={e => editor.setValue({...editor.value, city: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField id="address-state" label="State" fullWidth size="small"
                value={editor.value?.state || ""}
                onChange={e => editor.setValue({...editor.value, state: e.target.value})} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField id="address-postalcode" label="ZIP/Postal Code" fullWidth size="small"
                value={editor.value?.postalCode || ""}
                onChange={e => editor.setValue({...editor.value, postalCode: e.target.value})} />
            </Grid>
            <Grid item xs={12}>
              {editor.cancelButton}
              {editor.saveButton}
            </Grid>
          </>
        : <Grid item xs={12}>
            <p style={{display: 'inline-block', margin: 0}}>
              {address.line1}<br />
              {address.line2 && <>{address.line2}<br /></>}
              {address.city},&nbsp;{address.state}&nbsp;{address.postalCode}
            </p>
            {editor.editButton}
        </Grid>}
    </Grid>
  );
}
