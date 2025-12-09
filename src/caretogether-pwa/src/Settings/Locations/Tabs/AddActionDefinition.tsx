import { Button, TextField, Typography, Stack, MenuItem } from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { useRecoilValue } from 'recoil';
import { selectedLocationContextState } from '../../../Model/Data';
import { api } from '../../../Api/Api';
import {
  EffectiveLocationPolicy,
  ActionRequirement,
} from '../../../GeneratedClient';
import { useSetRecoilState } from 'recoil';
import { effectiveLocationPolicyEdited } from '../../../Model/ConfigurationModel';

interface DrawerProps {
  onClose: () => void;
}

interface AddActionDefinitionFormValues {
  name: string;
  alternateNames: string;
  instructions: string;
  infoLink: string;
  documentRequirement: 0 | 1 | 2;
  noteRequirement: 0 | 1 | 2;
  validityInDays: number | null;
}

const requirementOptions = [
  { label: 'None', value: 0 },
  { label: 'Allowed', value: 1 },
  { label: 'Required', value: 2 },
];

export function AddActionDefinition({ onClose }: DrawerProps) {
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  const setEditedPolicy = useSetRecoilState(effectiveLocationPolicyEdited);

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<AddActionDefinitionFormValues>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      alternateNames: '',
      instructions: '',
      infoLink: '',
      documentRequirement: 0,
      noteRequirement: 0,
      validityInDays: null,
    },
  });

  const convertToBackend = (data: AddActionDefinitionFormValues) => {
    const parsedAlternateNames = data.alternateNames
      ? data.alternateNames.split(',').map((x) => x.trim())
      : [];

    const validity =
      data.validityInDays && data.validityInDays > 0
        ? `${data.validityInDays}.00:00:00`
        : undefined;

    return {
      actionName: data.name,
      alternateNames: parsedAlternateNames,
      instructions: data.instructions || undefined,
      infoLink: data.infoLink || undefined,
      documentLink: data.documentRequirement,
      noteEntry: data.noteRequirement,
      validity,
      canView: undefined,
      canEdit: undefined,
    };
  };

  const onSubmit = async (values: AddActionDefinitionFormValues) => {
    const newAction = convertToBackend(values);

    const currentPolicy = await api.configuration.getEffectiveLocationPolicy(
      organizationId,
      locationId
    );

    const updatedPolicy = new EffectiveLocationPolicy({
      ...currentPolicy,
      actionDefinitions: {
        ...currentPolicy.actionDefinitions,
        [newAction.actionName]: new ActionRequirement(newAction),
      },
    });

    await api.configuration.putEffectiveLocationPolicy(
      organizationId,
      locationId,
      updatedPolicy as unknown as EffectiveLocationPolicy
    );

    setEditedPolicy(updatedPolicy);

    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={2} maxWidth={500}>
        <Typography variant="h6">Add New Action Definition</Typography>

        <Controller
          name="name"
          control={control}
          rules={{ required: 'Action name is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Name"
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />

        <Controller
          name="alternateNames"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Alternate name(s)" fullWidth />
          )}
        />

        <Controller
          name="instructions"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Instructions"
              fullWidth
              multiline
              rows={3}
            />
          )}
        />

        <Controller
          name="infoLink"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Info link" fullWidth />
          )}
        />

        <Controller
          name="documentRequirement"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Document" select fullWidth>
              {requirementOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="noteRequirement"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Note" select fullWidth>
              {requirementOptions.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        <Controller
          name="validityInDays"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Validity (days)"
              type="number"
              fullWidth
              InputProps={{ inputProps: { min: 0 } }}
            />
          )}
        />

        <Stack direction="row" justifyContent="flex-end" spacing={2}>
          <Button variant="contained" color="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isValid}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
