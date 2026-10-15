import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { Community, OrganizationCategory } from '../src/GeneratedClient';
import { AddEditCommunity } from '../src/Communities/AddEditCommunity';
import { buildOrganizationGridRows } from '../src/Communities/organizationsDataGridViewModel';
import { buildOrganizationsGridColumns } from '../src/Communities/organizationsGridColumns';
import { DataGridPremium } from '@mui/x-data-grid-premium';

declare global {
  interface Window {
    categoryFormCommands: Record<string, unknown>[];
  }
}

window.categoryFormCommands = [];
const categories = [
  new OrganizationCategory({ id: 'category-b', name: 'Housing' }),
  new OrganizationCategory({ id: 'category-a', name: 'Advocacy' }),
];
const params = new URLSearchParams(location.search);

function Harness() {
  const [community, setCommunity] = useState<Community | undefined>(
    params.has('edit')
      ? Community.fromJS({
          id: 'existing',
          name: 'Existing organization',
          description: '',
          categoryIds: ['category-b'],
        })
      : undefined
  );
  useEffect(() => {
    function openCreated() {
      setCommunity(
        Community.fromJS({ ...window.categoryFormCommands[0], id: 'created' })
      );
    }
    window.addEventListener('organization-created', openCreated);
    return () =>
      window.removeEventListener('organization-created', openCreated);
  }, []);
  return (
    <MemoryRouter>
      {community && (
        <div
          style={{ height: 300, width: 1100 }}
          aria-label="Created organizations"
        >
          <DataGridPremium
            rows={buildOrganizationGridRows(
              [community],
              new Map(categories.map((category) => [category.id!, category]))
            )}
            columns={buildOrganizationsGridColumns({
              organizationCategoriesEnabled: true,
            })}
            disableVirtualization
          />
        </div>
      )}
      <AddEditCommunity
        key={community?.id ?? 'new'}
        community={community}
        availableCategories={
          params.has('disabled')
            ? undefined
            : params.has('empty')
              ? []
              : categories
        }
        onClose={() => {}}
      />
    </MemoryRouter>
  );
}

createRoot(document.getElementById('root')!).render(<Harness />);
