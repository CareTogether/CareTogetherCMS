import { useState } from 'react';
import { Grid, TextField } from '@material-ui/core';
import { Person } from '../../GeneratedClient';
import { useVolunteersModel } from '../../Model/VolunteersModel';
import { UpdateDialog } from '../UpdateDialog';

interface UpdateAddressDialogProps {
  volunteerFamilyId: string,
  person: Person,
  onClose: () => void
}

export function UpdateAddressDialog({volunteerFamilyId, person, onClose}: UpdateAddressDialogProps) {
  const volunteerFamiliesModel = useVolunteersModel();
  const currentAddress = person.addresses?.find(x => x.id === person.currentAddressId);
  const [fields, setFields] = useState({
    line1: currentAddress?.line1 || "",
    line2: currentAddress?.line2 || "",
    city: currentAddress?.city || "",
    state: currentAddress?.state || "",
    postalCode: currentAddress?.postalCode || ""
  });
  const { line1, line2, city, state, postalCode } = fields;

  async function save() {
    if (currentAddress)
      await volunteerFamiliesModel.updatePersonAddress(volunteerFamilyId, person.id as string,
        currentAddress.id!, line1, line2, city, state, postalCode);
    else
      await volunteerFamiliesModel.addPersonAddress(volunteerFamilyId, person.id as string,
        line1, line2, city, state, postalCode);
  }

  return (
    <UpdateDialog title={`Update Address for ${person.firstName} ${person.lastName}`} onClose={onClose}
      onSave={save} enableSave={() => line1 !== currentAddress?.line1 || line2 !== currentAddress?.line2 ||
        city !== currentAddress?.city || state !== currentAddress?.state || postalCode !== currentAddress?.postalCode}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField id="address-line1" label="Address Line 1" fullWidth size="small"
              value={line1} onChange={e => setFields({...fields, line1: e.target.value})} />
          </Grid>
          <Grid item xs={12}>
            <TextField id="address-line2" label="Address Line 2" fullWidth size="small"
              value={line2} onChange={e => setFields({...fields, line2: e.target.value})} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField id="address-city" label="City" fullWidth size="small"
              value={city} onChange={e => setFields({...fields, city: e.target.value})} />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField id="address-state" label="State" fullWidth size="small"
              value={state} onChange={e => setFields({...fields, state: e.target.value})} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField id="address-postalcode" label="ZIP/Postal Code" fullWidth size="small"
              value={postalCode} onChange={e => setFields({...fields, postalCode: e.target.value})} />
          </Grid>
        </Grid>
      </form>
    </UpdateDialog>
  );
}
