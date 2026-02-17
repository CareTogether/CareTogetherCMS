import { Button, TextField, Typography, Grid, MenuItem } from '@mui/material';
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
import { useBackdrop } from '../../../Hooks/useBackdrop';

interface DrawerProps {
  onClose: () => void;
}

export interface ActionDefinitionData {
  originalActionName?: string;
  name: string;
  alternateNames: string[];
  instructions?: string;
  infoLink?: string;
  documentRequirement: 0 | 1 | 2;
  noteRequirement: 0 | 1 | 2;
  validityInDays: number | null;
  canView?: string;
  canEdit?: string;
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

interface AddActionDefinitionDrawerProps extends DrawerProps {
  data?: ActionDefinitionData;
}

const requirementOptions = [
  { label: 'None', value: 0 },
  { label: 'Allowed', value: 1 },
  { label: 'Required', value: 2 },
];

export function AddActionDefinition({
  data,
  onClose,
}: AddActionDefinitionDrawerProps) {
  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  const setEditedPolicy = useSetRecoilState(effectiveLocationPolicyEdited);
  const withBackdrop = useBackdrop();

  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<AddActionDefinitionFormValues>({
    mode: 'onChange',
    defaultValues: {
      name: data?.name ?? '',
      alternateNames: data?.alternateNames?.join(', ') ?? '',
      instructions: data?.instructions ?? '',
      infoLink: data?.infoLink ?? '',
      documentRequirement: data?.documentRequirement ?? 0,
      noteRequirement: data?.noteRequirement ?? 0,
      validityInDays: data?.validityInDays ?? null,
    },
  });

  const convertToBackend = (formData: AddActionDefinitionFormValues) => {
    const parsedAlternateNames = formData.alternateNames
      ? formData.alternateNames.split(',').map((x) => x.trim())
      : [];

    const validity =
      formData.validityInDays && formData.validityInDays > 0
        ? `${formData.validityInDays}.00:00:00`
        : undefined;

    return {
      actionName: formData.name,
      alternateNames: parsedAlternateNames,
      instructions: formData.instructions || undefined,
      infoLink: formData.infoLink || undefined,
      documentLink: formData.documentRequirement,
      noteEntry: formData.noteRequirement,
      validity,
      canView: data?.canView,
      canEdit: data?.canEdit,
    };
  };

  const onSubmit = async (values: AddActionDefinitionFormValues) => {
    await withBackdrop(async () => {
      const newAction = convertToBackend(values);
      const currentPolicy = await api.configuration.getEffectiveLocationPolicy(
        organizationId,
        locationId
      );

      const updatedActionDefinitions = { ...currentPolicy.actionDefinitions };
      const originalActionName = data?.originalActionName ?? data?.name;
      if (originalActionName) {
        delete updatedActionDefinitions[originalActionName];
      }
      updatedActionDefinitions[newAction.actionName] = new ActionRequirement(
        newAction
      );

      const updatedPolicy = new EffectiveLocationPolicy({
        ...currentPolicy,
        actionDefinitions: updatedActionDefinitions,
      });

      const savedPolicy = await api.configuration.putEffectiveLocationPolicy(
        organizationId,
        locationId,
        updatedPolicy
      );

      setEditedPolicy(savedPolicy);
      onClose();
    });
  };

  return (
    <Grid
      container
      spacing={2}
      maxWidth={500}
      component="form"
      onSubmit={handleSubmit(onSubmit)}
    >
      <Grid item xs={12}>
        <Typography variant="h6" mt={2}>
          {data ? 'Edit Action Definition' : 'Add New Action Definition'}
        </Typography>
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="name"
          control={control}
          rules={{ required: 'Action name is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              label="Name"
              fullWidth
              autoFocus
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="alternateNames"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Alternate name(s)" fullWidth />
          )}
        />
      </Grid>

      <Grid item xs={12}>
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
      </Grid>

      <Grid item xs={12}>
        <Controller
          name="infoLink"
          control={control}
          render={({ field }) => (
            <TextField {...field} label="Info link" fullWidth />
          )}
        />
      </Grid>

      <Grid item xs={12}>
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
      </Grid>

      <Grid item xs={12}>
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
      </Grid>

      <Grid item xs={12}>
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
      </Grid>

      <Grid item xs={12} sx={{ textAlign: 'right' }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={onClose}
          sx={{ marginRight: 2 }}
        >
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
      </Grid>
    </Grid>
  );
}
