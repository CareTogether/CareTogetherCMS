import { CategoryOutlined as CategoryOutlinedIcon } from '@mui/icons-material';
import { Box, Button, Chip, Typography } from '@mui/material';
import { OrganizationCategory } from '../GeneratedClient';

type OrganizationCategoriesSectionProps = {
  availableCategories: OrganizationCategory[];
  categoryIds: string[];
  canEdit: boolean;
  onEdit: () => void;
};

export function OrganizationCategoriesSection({
  availableCategories,
  categoryIds,
  canEdit,
  onEdit,
}: OrganizationCategoriesSectionProps) {
  const categoriesById = new Map(
    availableCategories.map((category) => [category.id, category])
  );
  const assignedCategories = categoryIds
    .map((categoryId) => categoriesById.get(categoryId))
    .filter((category): category is OrganizationCategory => category != null)
    .sort((first, second) =>
      first.name!.localeCompare(second.name!, undefined, {
        sensitivity: 'base',
      })
    );

  return (
    <Box
      sx={{
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        p: 2,
        mb: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          alignItems: 'center',
          display: 'flex',
          justifyContent: 'space-between',
          gap: 1,
          mb: assignedCategories.length === 0 ? 0 : 1.25,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryOutlinedIcon color="primary" />
          <Typography className="ph-unmask" variant="h5">
            Categories
          </Typography>
        </Box>
        {canEdit && (
          <Button
            className="ph-unmask"
            size="small"
            variant="text"
            onClick={onEdit}
          >
            Edit
          </Button>
        )}
      </Box>

      {assignedCategories.length === 0 ? (
        <Typography
          className="ph-unmask"
          color="text.secondary"
          variant="body2"
        >
          No categories assigned.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {assignedCategories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
