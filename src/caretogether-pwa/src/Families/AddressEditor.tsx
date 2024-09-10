import {
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  Grid,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useDirectoryModel } from '../Model/DirectoryModel';
import { useInlineEditor } from '../Hooks/useInlineEditor';
import { PersonEditorProps } from './PersonEditorProps';
import { Address, IAddress, Permission } from '../GeneratedClient';
import { MyLocation, LocationSearching } from '@mui/icons-material';
import { useFamilyIdPermissions } from '../Model/SessionModel';

type AddressFormFieldsProps = {
  address: IAddress | null;
  onEdit: (value: IAddress | null) => void;
};

function isSet(value: string | undefined) {
  return typeof value !== 'undefined' && value != null && value.length > 0;
}

function isInputValid(value: IAddress) {
  return (
    isSet(value.line1) ||
    isSet(value.line2) ||
    isSet(value.city) ||
    isSet(value.county) ||
    isSet(value.state) ||
    isSet(value.postalCode)
  );
}

export function AddressFormFields({ address, onEdit }: AddressFormFieldsProps) {
  function onEditField(value: IAddress) {
    if (isInputValid(value)) {
      onEdit(value); //TODO: Note that this does not determine whether to add an ID; that is handled by the caller.
    } else {
      onEdit(null);
    }
  }

  return (
    <>
      <Grid item xs={12}>
        <TextField
          id="address-line1"
          label="Address Line 1"
          fullWidth
          size="small"
          value={address?.line1 || ''}
          onChange={(e) => onEditField({ ...address, line1: e.target.value })}
        />
      </Grid>
      <Grid item xs={12}>
        <TextField
          id="address-line2"
          label="Address Line 2"
          fullWidth
          size="small"
          value={address?.line2 || ''}
          onChange={(e) => onEditField({ ...address, line2: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          id="address-city"
          label="City"
          fullWidth
          size="small"
          value={address?.city || ''}
          onChange={(e) => onEditField({ ...address, city: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <TextField
          id="address-county"
          label="County"
          fullWidth
          size="small"
          value={address?.county || ''}
          onChange={(e) => onEditField({ ...address, county: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sm={2}>
        <TextField
          id="address-state"
          label="State"
          fullWidth
          size="small"
          value={address?.state || ''}
          onChange={(e) => onEditField({ ...address, state: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          id="address-postalcode"
          label="ZIP/Postal Code"
          fullWidth
          size="small"
          value={address?.postalCode || ''}
          onChange={(e) =>
            onEditField({ ...address, postalCode: e.target.value })
          }
        />
      </Grid>
    </>
  );
}

type AddressEditorProps = PersonEditorProps & {
  add?: boolean;
  address?: IAddress;
};

export function AddressEditor({
  familyId,
  person,
  add,
  address,
}: AddressEditorProps) {
  const directoryModel = useDirectoryModel();

  // Automatically assume this is the person's current address if it is the
  // first address being added for that person.
  const isCurrent =
    person.currentAddressId === address?.id ||
    typeof person.addresses === 'undefined' ||
    person.addresses.length === 0;
  const addressWithCurrent = { address: address || null, isCurrent: isCurrent };

  const editor = useInlineEditor(
    async (value) =>
      await (add
        ? directoryModel.addPersonAddress(
            familyId!,
            person.id!,
            new Address({ ...value.address!, id: crypto.randomUUID() }),
            value.isCurrent!
          )
        : directoryModel.updatePersonAddress(
            familyId!,
            person.id!,
            new Address({ ...value.address!, id: address!.id }),
            value.isCurrent!
          )),
    addressWithCurrent,
    (value) =>
      (value &&
        value.address != null &&
        (value.address.line1 !== address?.line1 ||
          value.address.line2 !== address?.line2 ||
          value.address.city !== address?.city ||
          value.address.county !== address?.county ||
          value.address.state !== address?.state ||
          value.address.postalCode !== address?.postalCode ||
          value.isCurrent !== isCurrent ||
          add)) ||
      false
  );

  function handleAdd() {
    editor.setValue((editorValue) => ({
      address: editorValue?.address || null,
      isCurrent: isCurrent,
    }));
    editor.setEditing(true);
  }

  function onEditAddressFields(value: IAddress | null) {
    editor.setValue((editorValue) => ({
      address: value,
      isCurrent: editorValue?.isCurrent || false,
    }));
  }

  const permissions = useFamilyIdPermissions(familyId);

  return (
    <Grid container rowSpacing={2} columnSpacing={2}>
      {editor.editing ? (
        <>
          <Grid item xs={12}>
            <Divider />
            <br />
          </Grid>
          <AddressFormFields
            address={editor.value!.address}
            onEdit={onEditAddressFields}
          />
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={editor.value!.isCurrent}
                  onChange={(e) =>
                    editor.setValue({
                      ...editor.value!,
                      isCurrent: e.target.checked,
                    })
                  }
                  icon={<LocationSearching />}
                  checkedIcon={<MyLocation />}
                />
              }
              label="Is Current Address"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            {editor.cancelButton}
            {editor.saveButton}
          </Grid>
          <Grid item xs={12}>
            <Divider />
            <br />
          </Grid>
        </>
      ) : (
        <Grid item xs={12}>
          {add ? (
            <Button
              onClick={handleAdd}
              variant="text"
              size="small"
              startIcon={<AddIcon />}
            >
              Add
            </Button>
          ) : (
            <>
              {isCurrent ? (
                <MyLocation
                  fontSize="small"
                  color="disabled"
                  sx={{ verticalAlign: 'middle', marginRight: 1 }}
                />
              ) : (
                <LocationSearching
                  fontSize="small"
                  color="disabled"
                  sx={{ verticalAlign: 'middle', marginRight: 1 }}
                />
              )}
              <p style={{ display: 'inline-block', margin: 0 }}>
                {address!.line1}
                <br />
                {address!.line2 && (
                  <>
                    {address!.line2}
                    <br />
                  </>
                )}
                {address!.city},&nbsp;{address!.state}&nbsp;
                {address!.postalCode}
                {address!.county && (
                  <>
                    <br />
                    {address!.county} County
                  </>
                )}
              </p>
              {permissions(Permission.EditPersonContactInfo) &&
                editor.editButton}
            </>
          )}
        </Grid>
      )}
    </Grid>
  );
}
