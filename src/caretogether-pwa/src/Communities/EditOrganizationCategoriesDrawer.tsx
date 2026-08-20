import { useMemo, useState } from 'react';
import {
  Autocomplete,
  Box,
  Button,
  Drawer,
  FormControl,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  OrganizationCategory,
  SetOrganizationCategories,
} from '../GeneratedClient';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useCommunityCommand } from '../Model/DirectoryModel';

type CategoryOption = {
  id: string;
  label: string;
};

type EditOrganizationCategoriesDrawerProps = {
  availableCategories: OrganizationCategory[];
  categoryIds: string[];
  communityId: string;
  onClose: () => void;
};

function categoryIdKey(categoryIds: string[]) {
  return [...categoryIds].sort().join('|');
}

export function EditOrganizationCategoriesDrawer({
  availableCategories,
  categoryIds,
  communityId,
  onClose,
}: EditOrganizationCategoriesDrawerProps) {
  const categoryOptions = useMemo(
    () =>
      availableCategories
        .map((category) => ({ id: category.id!, label: category.name! }))
        .sort((first, second) =>
          first.label.localeCompare(second.label, undefined, {
            sensitivity: 'base',
          })
        ),
    [availableCategories]
  );
  const [selectedCategories, setSelectedCategories] = useState<
    CategoryOption[]
  >(() => categoryOptions.filter((option) => categoryIds.includes(option.id)));
  const setCategories = useCommunityCommand((selectedCommunityId) => {
    const command = new SetOrganizationCategories();
    command.communityId = selectedCommunityId;
    command.categoryIds = selectedCategories.map((category) => category.id);
    return command;
  });
  const withBackdrop = useBackdrop();
  const changed =
    categoryIdKey(categoryIds) !==
    categoryIdKey(selectedCategories.map((category) => category.id));

  async function save() {
    await withBackdrop(async () => {
      await setCategories(communityId);
      onClose();
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
        <Grid container spacing={2}>
          <Grid size={12}>
            <Typography className="ph-unmask" variant="h6">
              Edit Organization Categories
            </Typography>
          </Grid>

          <Grid size={12}>
            {categoryOptions.length === 0 ? (
              <Typography
                className="ph-unmask"
                color="text.secondary"
                variant="body2"
              >
                No categories are configured for this Tenant. A Tenant
                administrator can add them in Settings.
              </Typography>
            ) : (
              <FormControl fullWidth size="small" sx={{ mt: 1 }}>
                <Autocomplete
                  multiple
                  clearOnEscape
                  disableCloseOnSelect
                  options={categoryOptions}
                  value={selectedCategories}
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  onChange={(_event, value) => setSelectedCategories(value)}
                  renderInput={(params) => (
                    <TextField {...params} label="Categories" />
                  )}
                />
              </FormControl>
            )}
          </Grid>

          <Grid
            size={12}
            sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}
          >
            <Button className="ph-unmask" color="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="ph-unmask"
              variant="contained"
              disabled={!changed}
              onClick={() => void save()}
            >
              Save
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Drawer>
  );
}
