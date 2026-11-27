import { ChevronRight, HistoryOutlined } from '@mui/icons-material';
import { Box, ListItem, ListItemButton, Typography } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { atom } from 'jotai';
import { useMemo } from 'react';
import { api } from '../Api/Api';
import { useAccountInfo } from '../Authentication/Auth';
import { familyNameString } from '../Families/FamilyName';
import { RecentRecordType } from '../GeneratedClient';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import { recentRecordsRevisionAtom } from '../Hooks/useRecordVisit';
import {
  useRequiredSelectedLocationContext,
  useVisibleCommunities,
  useVisibleFamilies,
  useVisibleReferrals,
} from '../Model/Data';
import { useAtomLoadable } from '../State/jotai/useJotaiLoadable';
import { useReferralsAccessGate } from '../V1Referrals/useReferralsAccessGate';
import { DashboardRequirementPanel } from './DashboardRequirementPanel';

export function DashboardRecentRecords() {
  const { organizationId, locationId } = useRequiredSelectedLocationContext();
  const userId = useAccountInfo()?.userId;
  const families = useVisibleFamilies();
  const referrals = useVisibleReferrals();
  const organizations = useVisibleCommunities();
  const { shouldShowReferrals } = useReferralsAccessGate();
  const navigate = useAppNavigate();
  const recentRecordsAtom = useMemo(
    () =>
      atom(async (get) => {
        get(recentRecordsRevisionAtom);
        return userId ? api.recentRecords.list(organizationId, locationId) : [];
      }),
    [locationId, organizationId, userId]
  );
  const recent = useAtomLoadable(recentRecordsAtom);
  const rows =
    recent.state === 'hasValue'
      ? recent.contents.flatMap(({ record: { id, type }, accessedAtUtc }) => {
          let destination:
            | { name: string; label: string; open: () => void }
            | undefined;
          switch (type) {
            case RecentRecordType.Family: {
              const family = families.find((entry) => entry.family?.id === id);
              if (family?.family?.active) {
                destination = {
                  name: familyNameString(family),
                  label: 'Family',
                  open: () => navigate.family(id),
                };
              }
              break;
            }
            case RecentRecordType.Referral: {
              const referral = shouldShowReferrals
                ? referrals.find((entry) => entry.referral?.referralId === id)
                    ?.referral
                : undefined;
              if (referral) {
                destination = {
                  name: referral.title || 'Referral',
                  label: 'Referral',
                  open: () => navigate.referral(id),
                };
              }
              break;
            }
            case RecentRecordType.Organization: {
              const organization = organizations.find(
                (entry) => entry.community?.id === id
              )?.community;
              if (organization) {
                destination = {
                  name: organization.name || 'Organization',
                  label: 'Organization',
                  open: () => navigate.organization(id),
                };
              }
              break;
            }
          }
          return destination && Number.isFinite(accessedAtUtc?.getTime())
            ? [{ ...destination, id, type, accessedAtUtc }]
            : [];
        })
      : [];

  return (
    <DashboardRequirementPanel
      title="Recently accessed"
      icon={<HistoryOutlined fontSize="small" />}
      emptyTitle="No recently accessed records."
      emptyMessage="Records you open appear here."
      loadingMessage="Loading recently accessed records…"
      count={recent.state === 'hasValue' ? rows.length : undefined}
      itemType="record"
      errorMessage={
        recent.state === 'hasError'
          ? 'Recently accessed records are unavailable.'
          : undefined
      }
      compact
    >
      {rows.map(({ id, type, name, label, open, accessedAtUtc }) => (
        <ListItem key={`${type}:${id}`} disablePadding divider>
          <ListItemButton
            component="button"
            onClick={open}
            sx={{ width: '100%', gap: 1, textAlign: 'left' }}
          >
            <Box sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {label} ·{' '}
                <time dateTime={accessedAtUtc.toISOString()}>
                  {formatDistanceToNow(accessedAtUtc, { addSuffix: true })}
                </time>
              </Typography>
            </Box>
            <ChevronRight fontSize="small" color="action" />
          </ListItemButton>
        </ListItem>
      ))}
    </DashboardRequirementPanel>
  );
}
