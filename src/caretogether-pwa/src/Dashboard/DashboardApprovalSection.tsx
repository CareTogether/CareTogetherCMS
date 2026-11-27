import { SnoozeOutlined } from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { useFeatureFlagEnabled } from 'posthog-js/react';
import { useId, type ReactNode } from 'react';
import { personNameString } from '../Families/PersonName';
import { useAppNavigate } from '../Hooks/useAppNavigate';
import {
  useCommunityLookup,
  useFamilyLookup,
  usePersonAndFamilyLookup,
} from '../Model/DirectoryModel';
import { formatUtcDateOnly } from '../Utilities/dateUtils';
import { ORGANIZATION_APPROVALS_FEATURE_FLAG } from '../featureFlags';
import {
  DashboardQueueRow,
  DashboardRequirementPanel,
  DashboardSnoozedList,
  type DashboardSnoozedItem,
} from './DashboardRequirementPanel';
import type { ApprovalExpirationWorkItem } from './approvalExpirationWorkQueue';
import {
  affectedApprovalRoleLabel,
  selectDashboardApprovalWork,
} from './dashboardApprovalRenewals';
import { type RequirementWindowDays } from './dashboardPreferences';
import { openDashboardApproval } from './dashboardWorkNavigation';

import { disclosedFamilyName } from './dashboardFamilyName';
import { NextDaysSelect } from './dashboardLayout';
import { expirationPanel } from './dashboardPanels';

function ApprovalWorkSection({
  title,
  count,
  itemType,
  children,
}: {
  title: string;
  count: number;
  itemType: 'approval' | 'renewal';
  children: ReactNode;
}) {
  const headingId = useId();
  if (!count) return null;

  return (
    <ListItem disablePadding sx={{ display: 'block' }}>
      <Box component="section" aria-labelledby={headingId}>
        <Stack
          direction="row"
          spacing={1}
          sx={{ px: 2, py: 1, alignItems: 'center', bgcolor: 'action.hover' }}
        >
          <Typography
            id={headingId}
            className="ph-unmask"
            component="h3"
            variant="subtitle2"
            sx={{ fontWeight: 600, minWidth: 0, overflowWrap: 'anywhere' }}
          >
            {title}
          </Typography>
          <Chip
            size="small"
            label={count}
            aria-label={`${count} ${itemType}${count === 1 ? '' : 's'}`}
            sx={{ height: 22, fontWeight: 500, flexShrink: 0 }}
          />
        </Stack>
        <List disablePadding>{children}</List>
      </Box>
    </ListItem>
  );
}

export function DashboardApprovalExpirations({
  days,
  onChange,
  familyV2,
  work,
  snoozedWork,
  wakeAt,
  onSnooze,
  onUnsnooze,
  focusSnoozed,
  onSnoozedFocused,
}: {
  work: ReturnType<typeof selectDashboardApprovalWork>;
  snoozedWork: ReturnType<typeof selectDashboardApprovalWork>;
  wakeAt: (token: string) => number | undefined;
  onSnooze: ((token: string) => void) | undefined;
  onUnsnooze: (token: string) => void;
  focusSnoozed: boolean;
  onSnoozedFocused: () => void;
  days: RequirementWindowDays;
  onChange: (days: RequirementWindowDays) => void;
  familyV2: boolean;
}) {
  const organizationApprovals =
    useFeatureFlagEnabled(ORGANIZATION_APPROVALS_FEATURE_FLAG) === true;
  const familyLookup = useFamilyLookup();
  const personLookup = usePersonAndFamilyLookup();
  const communityLookup = useCommunityLookup();
  const navigate = useAppNavigate();
  const { upcoming, uncovered, expiring, expired } = work;

  function subjectContext(target: ApprovalExpirationWorkItem['target']) {
    switch (target.kind) {
      case 'family':
        return disclosedFamilyName(familyLookup(target.familyId)) ?? 'Family';
      case 'individual': {
        const { person, family } = personLookup(target.familyMemberId);
        return family?.id === target.familyId &&
          person &&
          (person.firstName?.trim() || person.lastName?.trim())
          ? personNameString(person)
          : 'Family member';
      }
      case 'organization':
        return (
          communityLookup(target.communityId)?.community?.name?.trim() ||
          'Organization'
        );
    }
  }

  function destination(
    target: ApprovalExpirationWorkItem['target'],
    approval: { kind: 'role' | 'requirement'; name: string }
  ) {
    return {
      context: subjectContext(target),
      onOpen: () =>
        openDashboardApproval(navigate, target, approval, {
          familyV2,
          organizationApprovals,
        }),
    };
  }

  function snoozeAction(token: string | undefined, title: string) {
    return (
      onSnooze &&
      token && (
        <Tooltip title="Snooze approval work">
          <IconButton
            size="small"
            aria-label={`Snooze ${title}`}
            onClick={() => onSnooze(token)}
          >
            <SnoozeOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      )
    );
  }

  const snoozedItems: DashboardSnoozedItem[] = [
    ...snoozedWork.upcoming,
    ...snoozedWork.uncovered,
  ]
    .map((row) => ({
      token: row.snoozeToken,
      title: row.actionName,
      target: row.target,
      label: `Coverage loss ${formatUtcDateOnly(new Date(row.firstUncoveredOnUtc))}`,
    }))
    .concat(
      [...snoozedWork.expiring, ...snoozedWork.expired].map((row) => ({
        token: row.snoozeToken,
        title: row.roleName,
        target: row.target,
        label: `${row.status === 'expired' ? 'Expired on' : 'Expires on'} ${formatUtcDateOnly(new Date(row.expirationDate))}`,
      }))
    )
    .flatMap(({ token, title, target, label }) => {
      const wake = token && wakeAt(token);
      return token && wake
        ? [
            {
              key: token,
              title,
              details: (
                <Typography variant="body2" color="text.secondary">
                  {subjectContext(target)} · {label}
                </Typography>
              ),
              wakeAt: wake,
              restoreLabel: `Unsnooze ${title}`,
              onRestore: () => onUnsnooze(token),
            },
          ]
        : [];
    });

  function renewalRow(row: (typeof upcoming)[number], isUncovered: boolean) {
    return (
      <DashboardQueueRow
        key={row.renderKey}
        title={row.actionName}
        trailingAction={snoozeAction(row.snoozeToken, row.actionName)}
        {...destination(row.target, {
          kind: 'requirement',
          name: row.actionName,
        })}
      >
        <Typography
          component="span"
          variant="body2"
          color={isUncovered ? 'error.main' : 'text.secondary'}
        >
          <span className="ph-unmask">
            {isUncovered ? 'Uncovered since' : 'Projected coverage loss on'}
          </span>{' '}
          <time dateTime={row.firstUncoveredOnUtc}>
            {formatUtcDateOnly(new Date(row.firstUncoveredOnUtc))}
          </time>
        </Typography>
        {row.dateReached && (
          <Typography
            className="ph-unmask"
            component="span"
            variant="body2"
            color="text.secondary"
          >
            Coverage-loss date reached. Last reported as upcoming.
          </Typography>
        )}
        {row.affectedRoles.length > 0 && (
          <Typography component="span" variant="body2" color="text.secondary">
            <span className="ph-unmask">Affected roles</span>{' '}
            {row.affectedRoles.map(affectedApprovalRoleLabel).join(' · ')}
          </Typography>
        )}
      </DashboardQueueRow>
    );
  }

  return (
    <DashboardRequirementPanel
      {...expirationPanel}
      {...(snoozedItems.length > 0 && {
        emptyTitle: 'No active approval work in this view',
        emptyMessage: 'Snoozed approval work is listed below.',
      })}
      count={
        upcoming.length + uncovered.length + expiring.length + expired.length
      }
      footer={
        <DashboardSnoozedList
          items={snoozedItems}
          focusToggle={focusSnoozed}
          onToggleFocused={onSnoozedFocused}
        />
      }
      headerAction={
        <NextDaysSelect
          label="Expiring approvals and requirements time frame"
          value={days}
          onChange={onChange}
        />
      }
    >
      <ApprovalWorkSection
        title="Upcoming renewals"
        count={upcoming.length}
        itemType="renewal"
      >
        {upcoming.map((item) => renewalRow(item, false))}
      </ApprovalWorkSection>
      <ApprovalWorkSection
        title="Expiring approvals"
        count={expiring.length}
        itemType="approval"
      >
        {expiring.map(
          ({
            id,
            target,
            roleName,
            expirationDate,
            relatedRenewals,
            snoozeToken,
          }) => (
            <DashboardQueueRow
              key={id}
              title={roleName}
              trailingAction={snoozeAction(snoozeToken, roleName)}
              {...destination(target, { kind: 'role', name: roleName })}
            >
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
                <span className="ph-unmask">Expires on</span>{' '}
                <time dateTime={expirationDate}>
                  {formatUtcDateOnly(new Date(expirationDate))}
                </time>
              </Typography>
              {relatedRenewals.length > 0 && (
                <Typography
                  component="span"
                  variant="body2"
                  color="text.secondary"
                >
                  <span className="ph-unmask">Related renewals</span>{' '}
                  {relatedRenewals
                    .map(
                      (item) =>
                        `${item.actionName} (${subjectContext(item.target)})`
                    )
                    .join(' · ')}
                </Typography>
              )}
            </DashboardQueueRow>
          )
        )}
      </ApprovalWorkSection>
      <ApprovalWorkSection
        title="Expired approvals"
        count={expired.length}
        itemType="approval"
      >
        {expired.map(
          ({ id, target, roleName, expirationDate, snoozeToken }) => (
            <DashboardQueueRow
              key={id}
              title={roleName}
              trailingAction={snoozeAction(snoozeToken, roleName)}
              {...destination(target, { kind: 'role', name: roleName })}
            >
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
                <span className="ph-unmask">Expired on</span>{' '}
                <time dateTime={expirationDate}>
                  {formatUtcDateOnly(new Date(expirationDate))}
                </time>
              </Typography>
            </DashboardQueueRow>
          )
        )}
      </ApprovalWorkSection>
      <ApprovalWorkSection
        title="Expired and unresolved"
        count={uncovered.length}
        itemType="renewal"
      >
        {uncovered.map((item) => renewalRow(item, true))}
      </ApprovalWorkSection>
    </DashboardRequirementPanel>
  );
}
