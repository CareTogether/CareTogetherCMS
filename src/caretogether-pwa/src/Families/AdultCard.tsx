import {
  Card,
  CardHeader,
  IconButton,
  CardContent,
  Typography,
  Chip,
  ListItemText,
  Menu,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Grid,
  Tooltip,
} from '@mui/material';
import { useState } from 'react';
import {
  Gender,
  Person,
  RoleRemovalReason,
  Permission,
} from '../GeneratedClient';
import { AgeText } from './AgeText';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { ContactDisplay } from './ContactDisplay';
import { IconRow } from '../Generic/IconRow';
import { VolunteerRoleApprovalStatusChip } from '../Volunteers/VolunteerRoleApprovalStatusChip';
import { RemoveIndividualRoleDialog } from '../Volunteers/RemoveIndividualRoleDialog';
import { ResetIndividualRoleDialog } from '../Volunteers/ResetIndividualRoleDialog';
import { useFamilyPermissions } from '../Model/SessionModel';
import { MissingRequirementRow } from '../Requirements/MissingRequirementRow';
import { ExemptedRequirementRow } from '../Requirements/ExemptedRequirementRow';
import { CompletedRequirementRow } from '../Requirements/CompletedRequirementRow';
import { IndividualVolunteerContext } from '../Requirements/RequirementContext';
import { useDialogHandle } from '../Hooks/useDialogHandle';
import { EditAdultDialog } from './EditAdultDialog';
import { useCollapsed } from '../Hooks/useCollapsed';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { useFeatureFlags } from '../Model/ConfigurationModel';
import { useDrawer } from '../Generic/ShellDrawer';
import { ManageUserDrawer } from './ManageUserDrawer';
import { format } from 'date-fns';
import { DateOfBirth } from './DateOfBirth';
import { WithComma } from '../Utilities/WithComma';
import { ReadMoreText } from '../Generic/Forms/ReadMoreText';

type AdultCardProps = {
  familyId: string;
  personId: string;
  onCompleteOther?: (personId: string) => void;
};

export function AdultCard({
  familyId,
  personId,
  onCompleteOther,
}: AdultCardProps) {
  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId)!;

  const adult = family.family?.adults?.find((x) => x.item1?.id === personId);

  const adultUser = family.users?.find((x) => x.personId === personId);

  const permissions = useFamilyPermissions(family);

  const isVolunteer =
    family.volunteerFamilyInfo?.individualVolunteers?.[personId] != null;

  const editDialogHandle = useDialogHandle();

  const featureFlags = useFeatureFlags();

  const requirementContext: IndividualVolunteerContext = {
    kind: 'Individual Volunteer',
    volunteerFamilyId: familyId,
    personId: personId,
  };

  const [collapsed, setCollapsed] = useCollapsed(
    `person-${familyId}-${personId}`,
    false
  );

  const [adultMoreMenuAnchor, setAdultMoreMenuAnchor] = useState<{
    anchor: Element;
    adult: Person;
  } | null>(null);
  const [removeRoleParameter, setRemoveRoleParameter] = useState<{
    volunteerFamilyId: string;
    person: Person;
    role: string;
  } | null>(null);
  function selectRemoveRole(adult: Person, role: string) {
    setAdultMoreMenuAnchor(null);
    setRemoveRoleParameter({
      volunteerFamilyId: familyId,
      person: adult,
      role: role,
    });
  }
  const [resetRoleParameter, setResetRoleParameter] = useState<{
    volunteerFamilyId: string;
    person: Person;
    role: string;
    removalReason: RoleRemovalReason;
    removalAdditionalComments: string;
  } | null>(null);
  function selectResetRole(
    adult: Person,
    role: string,
    removalReason: RoleRemovalReason,
    removalAdditionalComments: string
  ) {
    setAdultMoreMenuAnchor(null);
    setResetRoleParameter({
      volunteerFamilyId: familyId,
      person: adult,
      role: role,
      removalReason: removalReason,
      removalAdditionalComments: removalAdditionalComments,
    });
  }

  const manageUserDrawer = useDrawer();

  const participatingFamilyRoles = Object.entries(
    family.volunteerFamilyInfo?.familyRoleApprovals || {}
  ).filter(
    ([role, status]) =>
      status.currentStatus != null &&
      !family.volunteerFamilyInfo?.individualVolunteers?.[
        personId
      ]?.roleRemovals?.find(
        (x) =>
          x.roleName === role &&
          (x.effectiveUntil == null || x.effectiveUntil > new Date())
      )
  );
  const participatingIndividualRoles = Object.entries(
    family.volunteerFamilyInfo?.individualVolunteers?.[personId]
      ?.approvalStatusByRole || {}
  ).filter(
    ([role, status]) =>
      status.currentStatus != null &&
      !family.volunteerFamilyInfo?.individualVolunteers?.[
        personId
      ]?.roleRemovals?.find(
        (x) =>
          x.roleName === role &&
          (x.effectiveUntil == null || x.effectiveUntil > new Date())
      )
  );
  const removedRoles =
    family.volunteerFamilyInfo?.individualVolunteers?.[personId]
      ?.roleRemovals || [];

  return (
    <>
      {adult?.item1 && adult.item1.id && adult.item2 && (
        <Card variant="outlined" sx={{ minWidth: '275px' }}>
          <CardHeader
            sx={{ paddingBottom: 0 }}
            title={adult.item1.firstName + ' ' + adult.item1.lastName}
            subheader={
              <WithComma
                items={[
                  'Adult',
                  <AgeText age={adult.item1.age} />,
                  adult.item1.gender && Gender[adult.item1.gender],
                  adult.item1.ethnicity,
                ].filter(Boolean)}
              />
            }
            action={
              <>
                {permissions(Permission.EditFamilyInfo) && (
                  <IconButton
                    onClick={editDialogHandle.openDialog}
                    size="medium"
                  >
                    <EditIcon color="primary" />
                  </IconButton>
                )}
                {((permissions(Permission.EditVolunteerRoleParticipation) &&
                  (participatingFamilyRoles.length > 0 ||
                    participatingIndividualRoles.length > 0 ||
                    removedRoles.length > 0)) ||
                  permissions(Permission.InvitePersonUser) ||
                  permissions(Permission.EditPersonUserStandardRoles) ||
                  permissions(Permission.EditPersonUserProtectedRoles)) && (
                  <IconButton
                    onClick={(event) =>
                      setAdultMoreMenuAnchor({
                        anchor: event.currentTarget,
                        adult: adult.item1 as Person,
                      })
                    }
                    size="large"
                  >
                    <MoreVertIcon />
                  </IconButton>
                )}
              </>
            }
          />
          <CardContent
            sx={{
              paddingTop: 1,
              paddingBottom: 1,
              '&:last-child': {
                paddingBottom: 0,
              },
            }}
          >
            <Typography
              color="textSecondary"
              sx={{
                '& > div:first-of-type': {
                  marginLeft: 0,
                },
                '& > *': {
                  margin: 0.5,
                },
              }}
              component="div"
            >
              {Object.entries(
                family.volunteerFamilyInfo?.individualVolunteers?.[
                  adult.item1.id
                ].approvalStatusByRole || {}
              ).map(([role, roleApprovalStatus]) => (
                <VolunteerRoleApprovalStatusChip
                  key={role}
                  roleName={role}
                  status={roleApprovalStatus.effectiveRoleApprovalStatus}
                />
              ))}
              {(
                family.volunteerFamilyInfo?.individualVolunteers?.[personId]
                  ?.roleRemovals || []
              ).map((removedRole) => (
                <Tooltip
                  key={removedRole.roleName}
                  title={`Removed from ${removedRole.roleName} - ${RoleRemovalReason[removedRole.reason!]} - ${removedRole.additionalComments}${removedRole.effectiveSince ? ' - effective ' + format(removedRole.effectiveSince, 'M/d/yy') : ''}${removedRole.effectiveUntil ? ' - through ' + format(removedRole.effectiveUntil, 'M/d/yy') : ''}`}
                  arrow
                >
                  <Chip
                    key={removedRole.roleName}
                    size="small"
                    label={`${removedRole.roleName} - ${RoleRemovalReason[removedRole.reason!]} - ${removedRole.additionalComments}${removedRole.effectiveSince ? ' - effective ' + format(removedRole.effectiveSince, 'M/d/yy') : ''}${removedRole.effectiveUntil ? ' - through ' + format(removedRole.effectiveUntil, 'M/d/yy') : ''}`}
                  />
                </Tooltip>
              ))}
              {(adult.item2.relationshipToFamily && (
                <Chip size="small" label={adult.item2.relationshipToFamily} />
              )) ||
                null}
              {adult.item2.isInHousehold && (
                <Chip size="small" label="In Household" />
              )}
              {adultUser && (
                <Chip
                  size="small"
                  label={`${adultUser.userId ? 'User: ' : 'User NOT Activated: '}${adultUser.locationRoles?.join(', ')}`}
                  color="info"
                />
              )}
            </Typography>

            <DateOfBirth age={adult.item1.age} permissions={permissions} />

            <Typography variant="body2" component="div">
              {adult.item1.concerns && (
                <IconRow icon="⚠">
                  <strong>{adult.item1.concerns}</strong>
                </IconRow>
              )}
              {adult.item1.notes && (
                <IconRow icon="📝">
                  <ReadMoreText text={adult.item1.notes} />
                </IconRow>
              )}
            </Typography>
            <Typography variant="body2" component="div">
              <ContactDisplay person={adult.item1} />
            </Typography>
            <Accordion
              expanded={!collapsed}
              onChange={(_event, isExpanded) => setCollapsed(!isExpanded)}
              variant="outlined"
              square
              disableGutters
              sx={{ marginLeft: -2, marginRight: -2, border: 'none' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{
                  marginTop: 1,
                  paddingTop: 1,
                  backgroundColor: '#0000000a',
                }}
              >
                <Grid container>
                  <Grid item xs={3}>
                    <Badge
                      color="success"
                      badgeContent={
                        family.volunteerFamilyInfo?.individualVolunteers?.[
                          adult.item1.id
                        ].completedRequirements?.length
                      }
                    >
                      ✅
                    </Badge>
                  </Grid>
                  <Grid item xs={3}>
                    <Badge
                      color="warning"
                      badgeContent={
                        family.volunteerFamilyInfo?.individualVolunteers?.[
                          adult.item1.id
                        ].exemptedRequirements?.length
                      }
                    >
                      🚫
                    </Badge>
                  </Grid>
                  <Grid item xs={3}>
                    <Badge
                      color="error"
                      badgeContent={
                        family.volunteerFamilyInfo?.individualVolunteers?.[
                          adult.item1.id
                        ].missingRequirements?.length
                      }
                    >
                      ❌
                    </Badge>
                  </Grid>
                  <Grid item xs={3}>
                    <Badge
                      color="info"
                      badgeContent={
                        family.volunteerFamilyInfo?.individualVolunteers?.[
                          adult.item1.id
                        ].availableApplications?.length
                      }
                    >
                      💤
                    </Badge>
                  </Grid>
                </Grid>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" component="div">
                  {family.volunteerFamilyInfo?.individualVolunteers?.[
                    adult.item1.id
                  ].completedRequirements?.map((completed, i) => (
                    <CompletedRequirementRow
                      key={`${completed.completedRequirementId}:${i}`}
                      requirement={completed}
                      context={requirementContext}
                    />
                  ))}
                  {family.volunteerFamilyInfo?.individualVolunteers?.[
                    adult.item1.id
                  ].exemptedRequirements?.map((exempted, i) => (
                    <ExemptedRequirementRow
                      key={`${exempted.requirementName}:${i}`}
                      requirement={exempted}
                      context={requirementContext}
                    />
                  ))}
                  {family.volunteerFamilyInfo?.individualVolunteers?.[
                    adult.item1.id
                  ].missingRequirements?.map((missing, i) => (
                    <MissingRequirementRow
                      key={`${missing}:${i}`}
                      requirement={missing.item1!}
                      policyVersions={missing.item2?.map((v) => ({
                        version: v.item1 ?? '',
                        roleName: v.item2 ?? '',
                      }))}
                      context={requirementContext}
                    />
                  ))}
                  {family.volunteerFamilyInfo?.individualVolunteers?.[
                    adult.item1.id
                  ].availableApplications?.map((application, i) => (
                    <MissingRequirementRow
                      key={`${application}:${i}`}
                      requirement={application}
                      context={requirementContext}
                      isAvailableApplication={true}
                    />
                  ))}
                </Typography>
              </AccordionDetails>
            </Accordion>
          </CardContent>
          <Menu
            id="adult-more-menu"
            anchorEl={adultMoreMenuAnchor?.anchor}
            keepMounted
            open={Boolean(adultMoreMenuAnchor)}
            onClose={() => setAdultMoreMenuAnchor(null)}
          >
            {permissions(Permission.EditVolunteerRoleParticipation) &&
              participatingFamilyRoles.flatMap(([role]) => (
                <MenuItem
                  key={role}
                  onClick={() =>
                    adultMoreMenuAnchor?.adult &&
                    selectRemoveRole(adultMoreMenuAnchor.adult, role)
                  }
                >
                  <ListItemText primary={`Remove from ${role} role`} />
                </MenuItem>
              ))}
            {permissions(Permission.EditVolunteerRoleParticipation) &&
              participatingIndividualRoles.flatMap(([role]) => (
                <MenuItem
                  key={role}
                  onClick={() =>
                    adultMoreMenuAnchor?.adult &&
                    selectRemoveRole(adultMoreMenuAnchor.adult, role)
                  }
                >
                  <ListItemText primary={`Remove from ${role} role`} />
                </MenuItem>
              ))}
            {permissions(Permission.EditVolunteerRoleParticipation) &&
              removedRoles
                .filter((removedRole) => !removedRole.effectiveUntil)
                .map((removedRole) => (
                  <MenuItem
                    key={removedRole.roleName}
                    onClick={() =>
                      adultMoreMenuAnchor?.adult &&
                      selectResetRole(
                        adultMoreMenuAnchor.adult,
                        removedRole.roleName!,
                        removedRole.reason!,
                        removedRole.additionalComments!
                      )
                    }
                  >
                    <ListItemText
                      primary={`Reset ${removedRole.roleName} participation`}
                    />
                  </MenuItem>
                ))}
            {((featureFlags?.inviteUser &&
              permissions(Permission.InvitePersonUser)) ||
              permissions(Permission.EditPersonUserStandardRoles) ||
              permissions(Permission.EditPersonUserProtectedRoles)) && (
              <MenuItem
                onClick={() => {
                  adultMoreMenuAnchor?.adult && manageUserDrawer.openDrawer();
                  setAdultMoreMenuAnchor(null); //TODO: Is this why we had needed the null check on the previous line?
                }}
              >
                <ListItemText primary="Manage user..." />
              </MenuItem>
            )}
            {isVolunteer && (
              <MenuItem
                onClick={() => {
                  if (onCompleteOther) onCompleteOther(personId);
                  setAdultMoreMenuAnchor(null);
                }}
              >
                <ListItemText primary="Complete other..." />
              </MenuItem>
            )}
          </Menu>
          {(removeRoleParameter && (
            <RemoveIndividualRoleDialog
              volunteerFamilyId={familyId}
              person={removeRoleParameter.person}
              role={removeRoleParameter.role}
              onClose={() => setRemoveRoleParameter(null)}
            />
          )) ||
            null}
          {(resetRoleParameter && (
            <ResetIndividualRoleDialog
              volunteerFamilyId={familyId}
              person={resetRoleParameter.person}
              role={resetRoleParameter.role}
              removalReason={resetRoleParameter.removalReason}
              removalAdditionalComments={
                resetRoleParameter.removalAdditionalComments
              }
              onClose={() => setResetRoleParameter(null)}
            />
          )) ||
            null}
          {editDialogHandle.open && (
            <EditAdultDialog
              handle={editDialogHandle}
              key={editDialogHandle.key}
              adult={adult}
            />
          )}
          {manageUserDrawer.drawerFor(
            <ManageUserDrawer
              familyId={familyId}
              adult={adult.item1}
              user={adultUser}
              onClose={manageUserDrawer.closeDrawer}
            />
          )}
        </Card>
      )}
    </>
  );
}
