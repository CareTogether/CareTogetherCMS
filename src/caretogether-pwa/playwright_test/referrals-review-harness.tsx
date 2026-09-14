import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { ReferralsDataGridV2 } from '../src/V1Referrals/ReferralsDataGridV2';
import { CustomField, CustomFieldType } from '../src/GeneratedClient';
import type { ReferralBrowserRowV2 } from '../src/V1Referrals/referralBrowserTypes';

const rows: ReferralBrowserRowV2[] = ['OPEN', 'CLOSED', 'OPEN'].map(
  (status, index) => ({
    id: String(index),
    referralCount: 1,
    title: `Referral ${index}`,
    status: status as ReferralBrowserRowV2['status'],
    openedAtUtc: new Date('2026-01-01'),
    acceptedAtUtc: null,
    closedAtUtc: null,
    clientFamilyName: index === 2 ? null : 'Same family',
    county: 'North',
    comments: 'Full comment',
    searchableText: `Referral ${index}\nSame family\nFull comment`,
    assignmentNamesByRole: {},
    assignmentPersonIdsByRole: {},
    customFieldValues: { Program: 'A' },
  })
);

export function Harness() {
  const [empty, setEmpty] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [navigated, setNavigated] = useState('');
  return (
    <>
      <button onClick={() => setEmpty((value) => !value)}>
        Toggle authorized rows
      </button>
      <button onClick={() => setConfigured((value) => !value)}>
        Toggle configuration
      </button>
      <output>{navigated}</output>
      <div style={{ height: 600, width: '100%' }}>
        <ReferralsDataGridV2
          rows={empty ? [] : rows}
          counties={['North']}
          customFields={
            configured
              ? [
                  new CustomField({
                    name: 'Program',
                    type: CustomFieldType.String,
                    validValues: ['A'],
                  }),
                ]
              : []
          }
          onRowClick={(row) => setNavigated(row.id)}
        />
      </div>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<Harness />);
