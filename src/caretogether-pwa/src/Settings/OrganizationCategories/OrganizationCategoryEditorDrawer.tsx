import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Drawer,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  OrganizationCategory,
  PutOrganizationCategoryPayload,
} from '../../GeneratedClient';
import { api } from '../../Api/Api';
import { useBackdrop } from '../../Hooks/useBackdrop';
import { organizationConfigurationEdited } from '../../Model/ConfigurationModel';
import { useRequiredSelectedLocationContext } from '../../Model/Data';
import { useSetAtom } from 'jotai';

type OrganizationCategoryEditorDrawerProps = {
  categories: OrganizationCategory[];
  category?: OrganizationCategory;
  onClose: () => void;
};

export function OrganizationCategoryEditorDrawer({
  categories,
  category,
  onClose,
}: OrganizationCategoryEditorDrawerProps) {
  const [name, setName] = useState(category?.name ?? '');
  const [saveFailed, setSaveFailed] = useState(false);
  const { organizationId } = useRequiredSelectedLocationContext();
  const storeEdits = useSetAtom(organizationConfigurationEdited);
  const withBackdrop = useBackdrop();

  const normalizedName = name.trim();
  const duplicateName = useMemo(
    () =>
      categories.some(
        (existingCategory) =>
          existingCategory.id !== category?.id &&
          existingCategory.name?.trim().toLocaleLowerCase() ===
            normalizedName.toLocaleLowerCase()
      ),
    [categories, category?.id, normalizedName]
  );
  const unchanged = category?.name === normalizedName;
  const canSave = normalizedName.length > 0 && !duplicateName && !unchanged;

  async function save() {
    setSaveFailed(false);
    await withBackdrop(async () => {
      try {
        const updatedConfiguration =
          await api.configuration.putOrganizationCategory(
            organizationId,
            category?.id ?? crypto.randomUUID(),
            new PutOrganizationCategoryPayload({ name: normalizedName })
          );
        storeEdits(updatedConfiguration);
        onClose();
      } catch {
        setSaveFailed(true);
      }
    });
  }

  return (
    <Drawer
      disableRestoreFocus
      anchor="right"
      open
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: { xs: '100%', sm: 600 },
            top: 45,
            height: 'calc(100% - 45px)',
            display: 'flex',
          },
        },
      }}
    >
      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 3 }}>
        <Grid
          container
          spacing={2}
          component="form"
          onSubmit={(event) => {
            event.preventDefault();
            if (canSave) void save();
          }}
        >
          <Grid size={12}>
            <Typography className="ph-unmask" variant="h6">
              {category ? 'Edit Organization Category' : 'Add Category'}
            </Typography>
          </Grid>

          <Grid size={12}>
            <TextField
              autoFocus
              fullWidth
              required
              label="Name"
              value={name}
              error={duplicateName}
              helperText={
                duplicateName
                  ? 'Category names must be unique within the Tenant.'
                  : 'This name will be available in every Tenant location.'
              }
              onChange={(event) => setName(event.target.value)}
            />
          </Grid>

          {saveFailed && (
            <Grid size={12}>
              <Alert severity="error">
                The category could not be saved. Check the name and try again.
              </Alert>
            </Grid>
          )}

          <Grid
            size={12}
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}
          >
            <Button className="ph-unmask" color="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="ph-unmask"
              type="submit"
              variant="contained"
              disabled={!canSave}
            >
              Save
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  );
}
