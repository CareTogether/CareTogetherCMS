import { Box, Chip, Typography } from '@mui/material';
import { Community, OrganizationCategory } from '../GeneratedClient';

type OrganizationPrimaryHeaderInfoProps = {
  availableCategories?: OrganizationCategory[];
  community: Community;
  onEdit?: () => void;
};

export function OrganizationPrimaryHeaderInfo({
  availableCategories,
  community,
  onEdit,
}: OrganizationPrimaryHeaderInfoProps) {
  const categoriesById = new Map(
    (availableCategories ?? []).map((category) => [category.id, category])
  );
  const assignedCategories = (community.categoryIds ?? [])
    .map((categoryId) => categoriesById.get(categoryId))
    .filter((category): category is OrganizationCategory => category != null)
    .sort((first, second) =>
      first.name!.localeCompare(second.name!, undefined, {
        sensitivity: 'base',
      })
    );

  return (
    <Box sx={{ flex: '1 1 auto', minWidth: 0 }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          minWidth: 0,
        }}
      >
        <Typography variant="h4">{community.name}</Typography>
        {availableCategories != null && (
          <>
            {assignedCategories.map((category) => (
              <Chip key={category.id} label={category.name} />
            ))}
            {assignedCategories.length === 0 && (
              <Chip
                className="ph-unmask"
                label="No categories"
                variant="outlined"
                clickable={onEdit != null}
                onClick={onEdit}
                aria-label={onEdit ? 'Edit organization categories' : undefined}
                sx={{ color: 'text.secondary', borderStyle: 'dashed' }}
              />
            )}
          </>
        )}
      </Box>
    </Box>
  );
}
