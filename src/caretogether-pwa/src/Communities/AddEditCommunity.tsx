import {
  Autocomplete,
  Button,
  FormControl,
  FormHelperText,
  Link,
  TextField,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Community,
  CreateCommunity,
  EditCommunityDescription,
  OrganizationCategory,
  RenameCommunity,
  SetOrganizationCategories,
} from '../GeneratedClient';
import { useCommunityCommand } from '../Model/DirectoryModel';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useBeforeUnload } from 'react-router-dom';
import { useBackdrop } from '../Hooks/useBackdrop';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { useRequiredSelectedLocationContext } from '../Model/Data';

const UNSAVED_CHANGES_MESSAGE =
  'You have unsaved changes that will be lost. Are you sure?';

interface DrawerProps {
  onClose: () => void;
}
interface AddEditCommunityDrawerProps extends DrawerProps {
  availableCategories?: OrganizationCategory[];
  community?: Community;
  onDirtyChange?: (dirty: boolean) => void;
  onSaveCompleted?: () => void;
}

type CategoryOption = {
  id: string;
  label: string;
};

function categoryIdKey(categoryIds: string[]) {
  return [...categoryIds].sort().join('|');
}

export function AddEditCommunity({
  availableCategories,
  community,
  onDirtyChange,
  onSaveCompleted,
  onClose,
}: AddEditCommunityDrawerProps) {
  const [name, setName] = useState(community?.name || '');
  const [description, setDescription] = useState(community?.description || '');
  const organizationCategoriesEnabled = availableCategories != null;
  const categoryOptions = useMemo(
    () =>
      (availableCategories ?? [])
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
  >(() =>
    categoryOptions.filter((option) =>
      (community?.categoryIds ?? []).includes(option.id)
    )
  );

  const createCommunity = useCommunityCommand((communityId) => {
    const command = new CreateCommunity();
    command.communityId = communityId;
    command.name = name;
    command.description = description;
    return command;
  });

  const editCommunityDescription = useCommunityCommand((communityId) => {
    const command = new EditCommunityDescription();
    command.communityId = communityId;
    command.description = description;
    return command;
  });

  const renameCommunity = useCommunityCommand((communityId) => {
    const command = new RenameCommunity();
    command.communityId = communityId;
    command.name = name;
    return command;
  });

  const setCategories = useCommunityCommand((communityId) => {
    const command = new SetOrganizationCategories();
    command.communityId = communityId;
    command.categoryIds = selectedCategories.map((category) => category.id);
    return command;
  });

  const withBackdrop = useBackdrop();
  const appNavigate = useAppNavigate();
  const { organizationId, locationId } = useRequiredSelectedLocationContext();
  const categorySettingsHref = `/org/${organizationId}/${locationId}/settings/organization-categories`;
  const categoriesChanged =
    community != null &&
    organizationCategoriesEnabled &&
    categoryIdKey(community.categoryIds ?? []) !==
      categoryIdKey(selectedCategories.map((category) => category.id));
  const detailsChanged =
    community != null &&
    (name !== community.name || description !== community.description);
  const hasChanges = community
    ? detailsChanged || categoriesChanged
    : name.length > 0 || description.length > 0;

  useEffect(() => {
    onDirtyChange?.(hasChanges);
  }, [hasChanges, onDirtyChange]);

  useBeforeUnload(
    useCallback(
      (event) => {
        if (!hasChanges) return;

        event.preventDefault();
        event.returnValue = '';
      },
      [hasChanges]
    )
  );

  function confirmNavigation(event: React.MouseEvent<HTMLAnchorElement>) {
    if (hasChanges && !window.confirm(UNSAVED_CHANGES_MESSAGE)) {
      event.preventDefault();
    }
  }

  async function save() {
    await withBackdrop(async () => {
      if (community) {
        if (categoriesChanged) {
          await setCategories(community.id!);
        }
        if (name !== community.name) {
          await renameCommunity(community.id!);
        }
        if (description !== community.description) {
          await editCommunityDescription(community.id!);
        }
        (onSaveCompleted ?? onClose)();
      } else {
        const communityId = crypto.randomUUID();
        await createCommunity(communityId);
        onClose();
        appNavigate.organization(communityId);
      }
    });
  }

  return (
    <Grid container spacing={2} sx={{ maxWidth: 500 }}>
      <Grid size={12}>
        <Typography className="ph-unmask" variant="h6">
          {community ? 'Edit Organization' : 'Add New Organization'}
        </Typography>
      </Grid>
      <Grid size={12}>
        <TextField
          type="text"
          fullWidth
          required
          label="Name"
          placeholder="Enter a name for the organization"
          error={name.length === 0}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Grid>
      <Grid size={12}>
        <TextField
          type="text"
          fullWidth
          multiline
          minRows={4}
          label="Description"
          placeholder="Provide a description for the organization"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Grid>
      {community && organizationCategoriesEnabled && (
        <Grid size={12}>
          <FormControl fullWidth size="small">
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
              <Autocomplete
                multiple
                clearOnEscape
                disableCloseOnSelect
                options={categoryOptions}
                value={selectedCategories}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                onChange={(_event, value) => setSelectedCategories(value)}
                renderInput={(params) => (
                  <TextField {...params} label="Categories" />
                )}
              />
            )}
            <FormHelperText>
              <Link
                className="ph-unmask"
                component={RouterLink}
                to={categorySettingsHref}
                onClick={confirmNavigation}
                underline="hover"
              >
                Edit organization categories
              </Link>
            </FormHelperText>
          </FormControl>
        </Grid>
      )}
      <Grid size={12} sx={{ textAlign: 'right' }}>
        <Button
          color="secondary"
          variant="contained"
          sx={{ marginRight: 2 }}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          color="primary"
          variant="contained"
          disabled={(community != null && !hasChanges) || name.length === 0}
          onClick={save}
        >
          Save
        </Button>
      </Grid>
    </Grid>
  );
}
