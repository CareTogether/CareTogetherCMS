import { useState } from 'react';
import { Grid, TextField } from '@material-ui/core';
import { Person } from '../GeneratedClient';
import { useVolunteerFamiliesModel } from '../Model/VolunteerFamiliesModel';
import { UpdateDialog } from './UpdateDialog';

interface UpdateAddressDialogProps {
  volunteerFamilyId: string,
  person: Person,
  onClose: () => void
}

export function UpdateAddressDialog({volunteerFamilyId, person, onClose}: UpdateAddressDialogProps) {
  const [fields, setFields] = useState({
    notes: person.notes || ''
  });
  const { notes } = fields;
  const volunteerFamiliesModel = useVolunteerFamiliesModel();

  async function save() {
    alert("TODO");
    // await volunteerFamiliesModel.updatePersonNotes(volunteerFamilyId, person.id as string,
    //   notes.length > 0 ? notes : null);
  }

  return (
    <UpdateDialog title={`Update Address for ${person.firstName} ${person.lastName}`} onClose={onClose}
      onSave={save} enableSave={() => notes !== person.notes}>
      <form noValidate autoComplete="off">
        <Grid container spacing={2}>
          {/* <Grid item xs={12}>
            <TextField id="address-line1" label="Address Line 1" fullWidth size="small"
              value={addressLine1} onChange={e => setFields({...fields, addressLine1: e.target.value})} />
          </Grid>
          <Grid item xs={12}>
            <TextField id="address-line2" label="Address Line 2" fullWidth size="small"
              value={addressLine2} onChange={e => setFields({...fields, addressLine2: e.target.value})} />
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
          </Grid> */}
        </Grid>
      </form>
    </UpdateDialog>
  );
}
