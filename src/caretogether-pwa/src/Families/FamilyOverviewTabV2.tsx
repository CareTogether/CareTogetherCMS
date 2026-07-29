import {
  Box,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';
import { Diversity3 as Diversity3Icon } from '@mui/icons-material';
import { CompletedCustomFieldInfo } from '../GeneratedClient';
import { CompletedRequirementRow } from '../Requirements/CompletedRequirementRow';
import { ExemptedRequirementRow } from '../Requirements/ExemptedRequirementRow';
import { MissingRequirementRow } from '../Requirements/MissingRequirementRow';
import { V1CaseContext } from '../Requirements/RequirementContext';
import Grid from '../Generic/GridLegacyCompat';
import { FamilyCustomField } from './FamilyCustomField';
import { FamilyMembersDataGridV2 } from './FamilyMembersDataGridV2';
import {
  FamilyRecentOverviewV2,
  RecentOverviewTimelineItem,
} from './FamilyRecentOverviewV2';
import { VolunteerFamilyCustomField } from '../Volunteers/VolunteerFamilyCustomField';
import { V1CaseCustomField } from '../V1Cases/V1CaseCustomField';
import { FamilyMemberRowV2 } from './familyMemberViewModel';
import { Note } from '../GeneratedClient';
import { ComponentProps, ReactNode } from 'react';
import { PersonName } from './PersonName';

type CustomFieldRenderInfo = CompletedCustomFieldInfo | string;
type PersonNamePerson = ComponentProps<typeof PersonName>['person'];
type CommunityOverviewRowV2 = {
  id?: string;
  name?: string;
};

type FamilyOverviewTabV2Props = {
  canAddAdult: boolean;
  canAddChild: boolean;
  communityNameColor: string;
  communityRows: CommunityOverviewRowV2[];
  completedRequirements: NonNullable<
    ComponentProps<typeof CompletedRequirementRow>['requirement']
  >[];
  exemptedRequirements: NonNullable<
    ComponentProps<typeof ExemptedRequirementRow>['requirement']
  >[];
  familyCustomFields: CustomFieldRenderInfo[];
  familyId: string;
  familyMemberRows: FamilyMemberRowV2[];
  missingRequirements: NonNullable<
    ComponentProps<typeof MissingRequirementRow>['requirement']
  >[];
  noteAuthorLookup: (note: Note) => PersonNamePerson;
  recentOverviewTimelineItems: RecentOverviewTimelineItem[];
  renderRecentNoteActions: (item: RecentOverviewTimelineItem) => ReactNode;
  showV1CaseRequirements: boolean;
  userLookup: (userId: string) => PersonNamePerson;
  v1CaseCustomFields: CustomFieldRenderInfo[];
  v1CaseId?: string;
  v1CaseRequirementContext?: V1CaseContext;
  volunteerFamilyCustomFields: CustomFieldRenderInfo[];
  onAddAdult: () => void;
  onAddChild: () => void;
  onCommunityClick: (communityId: string) => void;
  onFamilyMemberClick: (row: FamilyMemberRowV2) => void;
  onViewAllRecentActivity: () => void;
};

function customFieldKey(customField: CustomFieldRenderInfo) {
  return typeof customField === 'string'
    ? customField
    : customField.customFieldName;
}

export function FamilyOverviewTabV2({
  canAddAdult,
  canAddChild,
  communityNameColor,
  communityRows,
  completedRequirements,
  exemptedRequirements,
  familyCustomFields,
  familyId,
  familyMemberRows,
  missingRequirements,
  noteAuthorLookup,
  recentOverviewTimelineItems,
  renderRecentNoteActions,
  showV1CaseRequirements,
  userLookup,
  v1CaseCustomFields,
  v1CaseId,
  v1CaseRequirementContext,
  volunteerFamilyCustomFields,
  onAddAdult,
  onAddChild,
  onCommunityClick,
  onFamilyMemberClick,
  onViewAllRecentActivity,
}: FamilyOverviewTabV2Props) {
  return (
    <>
      <Grid
        item
        xs={12}
        lg={8}
        sx={{ display: 'flex', flexDirection: 'column' }}
      >
        <Grid container spacing={0} sx={{ order: 2 }}>
          {showV1CaseRequirements && v1CaseRequirementContext && v1CaseId && (
            <>
              <Grid item xs={12} sm={6} md={4} style={{ paddingRight: 20 }}>
                <Typography
                  className="ph-unmask"
                  variant="h3"
                  style={{ marginBottom: 0 }}
                >
                  Incomplete
                </Typography>
                {missingRequirements.map((missing, i) => (
                  <MissingRequirementRow
                    key={`${missing}:${i}`}
                    requirement={missing}
                    context={v1CaseRequirementContext}
                    v1CaseId={v1CaseId}
                  />
                ))}
              </Grid>
              <Grid item xs={12} sm={6} md={4} style={{ paddingRight: 20 }}>
                <Typography
                  className="ph-unmask"
                  variant="h3"
                  style={{ marginBottom: 0 }}
                >
                  Completed
                </Typography>
                {completedRequirements.map((completed, i) => (
                  <CompletedRequirementRow
                    key={`${completed.completedRequirementId}:${i}`}
                    requirement={completed}
                    context={v1CaseRequirementContext}
                  />
                ))}
                {exemptedRequirements.map((exempted, i) => (
                  <ExemptedRequirementRow
                    key={`${exempted.requirementName}:${i}`}
                    requirement={exempted}
                    context={v1CaseRequirementContext}
                  />
                ))}
              </Grid>
            </>
          )}
        </Grid>
        <Grid container spacing={0} sx={{ order: 1 }}>
          <Grid item xs={12}>
            <FamilyMembersDataGridV2
              rows={familyMemberRows}
              onAddAdult={onAddAdult}
              onAddChild={onAddChild}
              onRowClick={onFamilyMemberClick}
              canAddAdult={canAddAdult}
              canAddChild={canAddChild}
            />
          </Grid>
          <Grid item xs={12}>
            {familyCustomFields.map((customField) => (
              <FamilyCustomField
                key={customFieldKey(customField)}
                familyId={familyId}
                customField={customField}
              />
            ))}
            {volunteerFamilyCustomFields.map((customField) => (
              <VolunteerFamilyCustomField
                key={customFieldKey(customField)}
                familyId={familyId}
                customField={customField}
              />
            ))}

            <Grid item xs={12} md={4}>
              {v1CaseId &&
                v1CaseCustomFields.map((customField) => (
                  <V1CaseCustomField
                    key={customFieldKey(customField)}
                    partneringFamilyId={familyId}
                    v1CaseId={v1CaseId}
                    customField={customField}
                  />
                ))}
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid item xs={12} lg={4}>
        <Box
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            p: 2,
            ml: { lg: 2 },
            mb: 2,
            bgcolor: 'background.paper',
          }}
        >
          <Typography className="ph-unmask" variant="h3" sx={{ mb: 1 }}>
            Communities
          </Typography>
          {communityRows.length === 0 ? (
            <Typography color="text.secondary" variant="body2">
              No communities.
            </Typography>
          ) : (
            communityRows.map((communityInfo) => (
              <ListItemButton
                key={communityInfo.id}
                sx={{
                  padding: '.5rem',
                  border: '1px solid #e0e0e0',
                  borderRadius: '5px',
                }}
                onClick={() =>
                  communityInfo.id ? onCommunityClick(communityInfo.id) : {}
                }
              >
                <ListItemIcon
                  sx={{ alignSelf: 'center', justifyContent: 'center' }}
                >
                  <Diversity3Icon color="primary" />
                </ListItemIcon>
                <ListItemText
                  sx={{ alignSelf: 'baseline' }}
                  primary={communityInfo.name}
                  slotProps={{
                    primary: {
                      color: communityNameColor,
                    },
                  }}
                />
              </ListItemButton>
            ))
          )}
        </Box>
        <FamilyRecentOverviewV2
          items={recentOverviewTimelineItems}
          noteAuthorLookup={noteAuthorLookup}
          renderRecentNoteActions={renderRecentNoteActions}
          userLookup={userLookup}
          onViewAll={onViewAllRecentActivity}
        />
      </Grid>
    </>
  );
}
