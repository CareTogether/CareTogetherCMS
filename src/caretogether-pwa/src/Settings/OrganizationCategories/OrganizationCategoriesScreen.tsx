import { useState } from 'react';
import {
  Add as AddIcon,
  CategoryOutlined as CategoryOutlinedIcon,
  DeleteOutlined as DeleteOutlineIcon,
  EditOutlined as EditOutlinedIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import { Navigate } from 'react-router-dom';
import { OrganizationCategory } from '../../GeneratedClient';
import { Breadcrumbs } from '../../Generic/Breadcrumbs';
import { useOrganizationConfigurationLoadable } from '../../Model/ConfigurationModel';
import { useRequiredSelectedLocationContext } from '../../Model/Data';
import { useUserIsOrganizationAdministrator } from '../../Model/SessionModel';
import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';
import { useScreenTitle } from '../../Shell/ShellScreenTitle';
import { DeleteOrganizationCategoryDialog } from './DeleteOrganizationCategoryDialog';
import { OrganizationCategoryEditorDrawer } from './OrganizationCategoryEditorDrawer';

export function OrganizationCategoriesScreen() {
  useScreenTitle('Organization Categories');
  const configuration = useOrganizationConfigurationLoadable();
  const isOrganizationAdministrator =
    useUserIsOrganizationAdministrator() === true;
  const { organizationId, locationId } = useRequiredSelectedLocationContext();
  const [editorOpen, setEditorOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<OrganizationCategory>();
  const [categoryToDelete, setCategoryToDelete] =
    useState<OrganizationCategory>();

  if (!configuration) {
    return (
      <ProgressBackdrop>
        <p className="ph-unmask">Loading Organization categories...</p>
      </ProgressBackdrop>
    );
  }

  if (!isOrganizationAdministrator) {
    return <Navigate to=".." replace />;
  }

  const categories = [...(configuration.organizationCategories ?? [])].sort(
    (first, second) =>
      first.name!.localeCompare(second.name!, undefined, {
        sensitivity: 'base',
      })
  );

  function openEditor(category?: OrganizationCategory) {
    setCategoryToEdit(category);
    setEditorOpen(true);
  }

  return (
    <Box sx={{ pt: 2 }}>
      <Breadcrumbs
        items={[
          {
            label: 'Settings',
            to: `/org/${organizationId}/${locationId}/settings`,
          },
        ]}
        currentPageLabel="Organization Categories"
        sx={{ mb: 2 }}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 2,
        }}
      >
        <Box>
          <Typography className="ph-unmask" variant="h2">
            Organization Categories
          </Typography>
          <Typography
            className="ph-unmask"
            color="text.secondary"
            variant="body2"
          >
            Define the categories available to Organizations across every Tenant
            location.
          </Typography>
        </Box>
        <Button
          className="ph-unmask"
          startIcon={<AddIcon />}
          variant="contained"
          onClick={() => openEditor()}
        >
          Add Category
        </Button>
      </Box>

      <Box
        sx={{
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          bgcolor: 'background.paper',
          overflow: 'hidden',
        }}
      >
        {categories.length === 0 ? (
          <Box sx={{ py: 6, px: 3, textAlign: 'center' }}>
            <CategoryOutlinedIcon
              color="disabled"
              sx={{ fontSize: 42, mb: 1 }}
            />
            <Typography className="ph-unmask" variant="h6">
              No categories yet
            </Typography>
            <Typography
              className="ph-unmask"
              color="text.secondary"
              variant="body2"
            >
              Add the first category to make it available for assignment.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {categories.map((category, index) => (
              <ListItem
                key={category.id}
                divider={index < categories.length - 1}
                secondaryAction={
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Edit category">
                      <IconButton
                        aria-label={`Edit ${category.name}`}
                        onClick={() => openEditor(category)}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete category">
                      <IconButton
                        aria-label={`Delete ${category.name}`}
                        onClick={() => setCategoryToDelete(category)}
                      >
                        <DeleteOutlineIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
                sx={{ py: 1.25, pr: 13 }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <CategoryOutlinedIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary={category.name} />
              </ListItem>
            ))}
          </List>
        )}
      </Box>

      {editorOpen && (
        <OrganizationCategoryEditorDrawer
          categories={categories}
          category={categoryToEdit}
          onClose={() => setEditorOpen(false)}
        />
      )}
      {categoryToDelete && (
        <DeleteOrganizationCategoryDialog
          category={categoryToDelete}
          onClose={() => setCategoryToDelete(undefined)}
        />
      )}
    </Box>
  );
}
