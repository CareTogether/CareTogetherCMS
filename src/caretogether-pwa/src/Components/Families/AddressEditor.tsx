import { Button, Checkbox, Divider, FormControlLabel, Grid, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useDirectoryModel } from '../../Model/DirectoryModel';
import { useInlineEditor } from '../../useInlineEditor';
import { PersonEditorProps } from "./PersonEditorProps";
import { Address, IAddress, Permission } from '../../GeneratedClient';
import { MyLocation, LocationSearching } from '@mui/icons-material';
import { usePermissions } from '../../Model/SessionModel';

type AddressEditorProps = PersonEditorProps & {
  add?: boolean
  address?: Address
}

type IAddressWithCurrent = IAddress & {
  isCurrent?: boolean
}

export function AddressEditor({ familyId, person, add, address }: AddressEditorProps) {
  const directoryModel = useDirectoryModel();

  // Automatically assume this is the person's current address if it is the
  // first address being added for that person.
  const isCurrent = person.currentAddressId === address?.id ||
    typeof person.addresses === 'undefined' ||
    person.addresses.length === 0;
  const addressWithCurrent = {...address} as IAddressWithCurrent | undefined;
  if (typeof addressWithCurrent !== 'undefined')
    addressWithCurrent.isCurrent = isCurrent;
  
  const editor = useInlineEditor(async value =>
    await (add
      ? directoryModel.addPersonAddress(familyId!, person.id!,
          value!.line1!, value!.line2 && value!.line2.length > 0 ? value.line2 : null,
          value!.city!, value!.state!, value!.postalCode!, value!.isCurrent!)
      : directoryModel.updatePersonAddress(familyId!, person.id!,
          value.id!, value.line1!, value.line2 && value.line2.length > 0 ? value.line2 : null,
          value.city!, value.state!, value.postalCode!, value!.isCurrent!)),
    addressWithCurrent,
    value => (value &&
      (value.line1!.length > 0 && value.city!.length > 0 && value.state!.length > 0 && value.postalCode!.length > 0) &&
      (value.line1 !== address?.line1 ||
        (address?.line2 && address?.line2.length > 0 ? value.line2 !== address?.line2 : value.line2 !== "") ||
        value.city !== address?.city || value.state !== address?.state || value.postalCode !== address?.postalCode ||
        value.isCurrent !== isCurrent)) as boolean);

  function handleAdd() {
    editor.setValue({
      line1: "",
      city: "",
      state: "",
      postalCode: "",
      isCurrent: isCurrent
    });
    editor.setEditing(true);
  }

  const permissions = usePermissions();
  
  return (
    <Grid container rowSpacing={2} columnSpacing={2}>
      {editor.editing
        ? <>
            <Grid item xs={12}><Divider /><br /></Grid>
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
            <Grid item xs={12} sm={6}>
              <FormControlLabel control={
                <Checkbox checked={editor.value!.isCurrent}
                  onChange={e => editor.setValue({...editor.value, isCurrent: e.target.checked})}
                  icon={<LocationSearching />}
                  checkedIcon={<MyLocation />} />}
                label="Is Current Address" />
            </Grid>
            <Grid item xs={12} sm={6}>
              {editor.cancelButton}
              {editor.saveButton}
            </Grid>
            <Grid item xs={12}><Divider /><br /></Grid>
          </>
        : <Grid item xs={12}>
          { add
            ? <Button
                onClick={handleAdd}
                variant="text"
                size="small"
                startIcon={<AddIcon />}>
                Add
              </Button>
            : <>
                {isCurrent
                  ? <MyLocation fontSize='small' color='disabled' sx={{verticalAlign: 'middle', marginRight: 1}} />
                  : <LocationSearching fontSize='small' color='disabled' sx={{verticalAlign: 'middle', marginRight: 1}} />}
                <p style={{display: 'inline-block', margin: 0}}>
                  {address!.line1}<br />
                  {address!.line2 && <>{address!.line2}<br /></>}
                  {address!.city},&nbsp;{address!.state}&nbsp;{address!.postalCode}
                </p>
                {permissions(Permission.EditPersonContactInfo) && editor.editButton}
              </>}
        </Grid>}
    </Grid>
  );
}
