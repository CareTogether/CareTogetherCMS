import {
  Button,
  TextField,
  Typography,
  Radio,
  RadioGroup,
  FormControl,
  FormLabel,
  FormControlLabel,
  FormHelperText,
  Stack,
  Box,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';

interface DrawerProps {
  onClose: () => void;
}

interface AddActionDefinitionFormValues {
  name: string;
  documentRequirement: 'None' | 'Allowed' | 'Required';
  noteRequirement: 'None' | 'Allowed' | 'Required';
  instructions: string;
  infoLink: string;
}

export function AddActionDefinition({ onClose }: DrawerProps) {
  const {
    handleSubmit,
    control,
    formState: { errors, isValid },
  } = useForm<AddActionDefinitionFormValues>({
    mode: 'onChange',
    defaultValues: {
      name: '',
      documentRequirement: 'Allowed',
      noteRequirement: 'Allowed',
      instructions: '',
      infoLink: '',
    },
  });

  const onSubmit = () => {
    onClose();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={0.25} maxWidth={500}>
        <Typography variant="h6">Add new action definition</Typography>

        <Controller
          name="name"
          control={control}
          rules={{ required: 'Action name is required' }}
          render={({ field }) => (
            <TextField
              {...field}
              type="text"
              fullWidth
              required
              label="Name"
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          )}
        />

        <FormControl component="fieldset">
          <FormLabel component="legend">Document</FormLabel>
          <Controller
            name="documentRequirement"
            control={control}
            render={({ field }) => (
              <RadioGroup {...field}>
                <Stack spacing={1}>
                  {['Allowed', 'Required', 'None'].map((value) => (
                    <Box key={value}>
                      <FormControlLabel
                        value={value}
                        control={<Radio />}
                        label={value}
                      />
                      <FormHelperText sx={{ ml: 4 }}>
                        {value === 'Allowed' && 'Document is optional'}
                        {value === 'Required' && 'Always require a document'}
                        {value === 'None' && 'Don’t ask for a document'}
                      </FormHelperText>
                    </Box>
                  ))}
                </Stack>
              </RadioGroup>
            )}
          />
        </FormControl>

        <FormControl component="fieldset">
          <FormLabel component="legend">Note</FormLabel>
          <Controller
            name="noteRequirement"
            control={control}
            render={({ field }) => (
              <RadioGroup {...field}>
                <Stack spacing={1}>
                  {['Allowed', 'Required', 'None'].map((value) => (
                    <Box key={value}>
                      <FormControlLabel
                        value={value}
                        control={<Radio />}
                        label={value}
                      />
                      <FormHelperText sx={{ ml: 4 }}>
                        {value === 'Allowed' && 'Note is optional'}
                        {value === 'Required' && 'Always require a note'}
                        {value === 'None' && 'Don’t ask for a note'}
                      </FormHelperText>
                    </Box>
                  ))}
                </Stack>
              </RadioGroup>
            )}
          />
        </FormControl>

        <Controller
          name="instructions"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Instructions"
              fullWidth
              multiline
              rows={2}
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

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button color="secondary" variant="contained" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            color="primary"
            variant="contained"
            disabled={!isValid}
          >
            Save
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
