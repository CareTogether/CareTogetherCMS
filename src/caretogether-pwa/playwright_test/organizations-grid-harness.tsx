import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import type { GridFilterModel } from '@mui/x-data-grid-premium';
import { OrganizationsDataGrid } from '../src/Communities/CommunitiesList';
import { buildOrganizationsGridColumns } from '../src/Communities/organizationsGridColumns';
import type { OrganizationGridRow } from '../src/Communities/organizationsDataGridViewModel';

const rows: OrganizationGridRow[] = [
  {
    id: 'organization-alpha',
    name: 'Alpha Organization',
    description: 'Family support',
    categoryLabels: ['Housing'],
    memberFamilyCount: 2,
    organizationCount: 1,
    roleAssignmentCount: 1,
  },
  {
    id: 'organization-beta',
    name: 'Beta Organization',
    description: 'Community support',
    categoryLabels: ['Advocacy'],
    memberFamilyCount: 5,
    organizationCount: 1,
    roleAssignmentCount: 3,
  },
];

const columns = buildOrganizationsGridColumns({
  organizationCategoriesEnabled: true,
});

export function Harness() {
  const [filterModel, setFilterModel] = useState<GridFilterModel>({
    items: [],
  });

  return (
    <div style={{ width: '100%' }}>
      <OrganizationsDataGrid
        columns={columns}
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        onRowClick={(row) => {
          window.history.pushState(
            {},
            '',
            `/organizations/organization/${row.id}`
          );
        }}
        rows={rows}
      />
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<Harness />);
