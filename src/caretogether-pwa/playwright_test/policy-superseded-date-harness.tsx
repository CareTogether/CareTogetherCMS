import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  ArrangementPolicy,
  OrganizationRolePolicyVersion,
  VolunteerFamilyRolePolicyVersion,
  VolunteerRolePolicyVersion,
} from '../src/GeneratedClient';
import {
  ArrangementPolicySidePanel,
  VolunteerRolePolicyVersionSidePanel,
} from '../src/Settings/Locations/Tabs/PolicyConfiguration/sidePanels';
import { formatDate } from '../src/Settings/Locations/Tabs/PolicyConfiguration/policyUtils';

const kind = new URLSearchParams(location.search).get('kind');
const historical = new URLSearchParams(location.search).has('historical');
const Model =
  kind === 'arrangement'
    ? ArrangementPolicy
    : kind === 'family'
      ? VolunteerFamilyRolePolicyVersion
      : kind === 'organization'
        ? OrganizationRolePolicyVersion
        : VolunteerRolePolicyVersion;
const storageKey = 'saved-policy';

export function Harness() {
  const [editing, setEditing] = useState(
    localStorage.getItem(storageKey) != null ||
      !new URLSearchParams(location.search).has('new')
  );
  const [saved, setSaved] = useState(() =>
    Model.fromJS(
      JSON.parse(
        localStorage.getItem(storageKey) ??
          JSON.stringify({
            arrangementType: 'Care',
            version: 'v1',
            requirements: [],
            supersededAtUtc: historical ? '2026-01-02T23:45:00Z' : null,
          })
      )
    )
  );
  const [revision, setRevision] = useState(0);
  function save(value: typeof saved) {
    const json = JSON.stringify(value.toJSON());
    localStorage.setItem(storageKey, json);
    setSaved(Model.fromJS(JSON.parse(json)));
    setEditing(true);
    setRevision((current) => current + 1);
  }
  return (
    <>
      <output aria-label="Superseded display">
        {formatDate(saved.supersededAtUtc)}
      </output>
      {kind === 'arrangement' ? (
        <ArrangementPolicySidePanel
          key={revision}
          arrangement={editing ? (saved as ArrangementPolicy) : undefined}
          existingArrangementTypes={[]}
          onClose={() => {}}
          onSave={(_previous, value) => save(value)}
        />
      ) : (
        <VolunteerRolePolicyVersionSidePanel
          key={revision}
          title="Policy"
          roleName={editing ? 'Helper' : undefined}
          version={editing ? (saved as VolunteerRolePolicyVersion) : undefined}
          existingRoleNames={[]}
          existingVersionsForRole={[]}
          family={kind === 'family'}
          organization={kind === 'organization'}
          actionNames={[]}
          onClose={() => {}}
          onSave={(_role, _previous, _name, value) => save(value)}
        />
      )}
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <Harness />
  </LocalizationProvider>
);
