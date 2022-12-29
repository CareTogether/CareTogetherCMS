import { Container, Toolbar, Grid, Button, useMediaQuery, useTheme, Box, IconButton, ListItemText, Menu, MenuItem, MenuList, Chip, Divider } from '@mui/material';
import { Arrangement, ArrangementPolicy, CompletedCustomFieldInfo, Permission, ReferralCloseReason, RoleRemovalReason } from '../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { useParams } from 'react-router';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { AdultCard } from '../Families/AdultCard';
import { ChildCard } from '../Families/ChildCard';
import { useState } from 'react';
import { AddAdultDialog } from '../Families/AddAdultDialog';
import { AddChildDialog } from '../Families/AddChildDialog';
import { AddEditNoteDialog } from '../Notes/AddEditNoteDialog';
import { ArrangementCard } from './Arrangements/ArrangementCard';
import { format } from 'date-fns';
import { UploadFamilyDocumentsDialog } from '../Families/UploadFamilyDocumentsDialog';
import { policyData } from '../Model/ConfigurationModel';
import { CreateArrangementDialog } from './Arrangements/CreateArrangementDialog';
import { CloseReferralDialog } from './CloseReferralDialog';
import { OpenNewReferralDialog } from './OpenNewReferralDialog';
import { FamilyDocuments } from '../Families/FamilyDocuments';
import { useFamilyPermissions } from '../Model/SessionModel';
import { Masonry } from '@mui/lab';
import { MissingRequirementRow } from "../Requirements/MissingRequirementRow";
import { ExemptedRequirementRow } from "../Requirements/ExemptedRequirementRow";
import { CompletedRequirementRow } from "../Requirements/CompletedRequirementRow";
import { ReferralContext, VolunteerFamilyContext } from "../Requirements/RequirementContext";
import { ActivityTimeline } from '../Activities/ActivityTimeline';
import { ReferralComments } from './ReferralComments';
import { ReferralCustomField } from './ReferralCustomField';
import { PrimaryContactEditor } from '../Families/PrimaryContactEditor';
import useScreenTitle from '../Shell/ShellScreenTitle';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useFamilyLookup } from '../Model/DirectoryModel';
import { RemoveFamilyRoleDialog } from '../Volunteers/RemoveFamilyRoleDialog';
import { ResetFamilyRoleDialog } from '../Volunteers/ResetFamilyRoleDialog';
import { VolunteerRoleApprovalStatusChip } from '../Volunteers/VolunteerRoleApprovalStatusChip';

const sortArrangementsByStartDateDescThenCreateDateDesc = (a: Arrangement,b: Arrangement) => {
  return ((b.startedAtUtc ?? new Date()).getTime() - (a.startedAtUtc ?? new Date()).getTime()) || 
  ((b.requestedAtUtc ?? new Date()).getTime() - (a.requestedAtUtc ?? new Date()).getTime())
};

export function FamilyScreen() {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId)!;

  const policy = useRecoilValue(policyData);

  const canCloseReferral = family?.partneringFamilyInfo?.openReferral &&
    !family.partneringFamilyInfo.openReferral.closeReason &&
    !family.partneringFamilyInfo.openReferral.arrangements?.some(arrangement =>
      !arrangement.endedAtUtc && !arrangement.cancelledAtUtc);

  const [closeReferralDialogOpen, setCloseReferralDialogOpen] = useState(false);
  const [openNewReferralDialogOpen, setOpenNewReferralDialogOpen] = useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] = useState(false);
  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  
  const [familyMoreMenuAnchor, setFamilyMoreMenuAnchor] = useState<Element | null>(null);

  const participatingFamilyRoles =
    Object.entries(family?.volunteerFamilyInfo?.familyRoleApprovals || {}).filter(
      ([role,]) => !family?.volunteerFamilyInfo?.removedRoles?.find(x => x.roleName === role));
  
  const [removeRoleParameter, setRemoveRoleParameter] = useState<{volunteerFamilyId: string, role: string} | null>(null);
  function selectRemoveRole(role: string) {
    setFamilyMoreMenuAnchor(null);
    setRemoveRoleParameter({volunteerFamilyId: familyId, role: role});
  }
  const [resetRoleParameter, setResetRoleParameter] = useState<{volunteerFamilyId: string, role: string, removalReason: RoleRemovalReason, removalAdditionalComments: string} | null>(null);
  function selectResetRole(role: string, removalReason: RoleRemovalReason, removalAdditionalComments: string) {
    setFamilyMoreMenuAnchor(null);
    setResetRoleParameter({volunteerFamilyId: familyId, role: role, removalReason: removalReason, removalAdditionalComments: removalAdditionalComments});
  }
  
  let referralRequirementContext: ReferralContext | undefined;
  if (family?.partneringFamilyInfo?.openReferral) {
    referralRequirementContext = {
      kind: "Referral",
      partneringFamilyId: familyId,
      referralId: family.partneringFamilyInfo.openReferral.id!
    };
  }
  
  const volunteerFamilyRequirementContext: VolunteerFamilyContext = {
    kind: "Volunteer Family",
    volunteerFamilyId: familyId
  };

  const [createArrangementDialogParameter, setCreateArrangementDialogParameter] = useState<ArrangementPolicy | null>(null);
  
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  const permissions = useFamilyPermissions(family);

  useScreenTitle(family
    ? `${family.family?.adults!.filter(adult => adult.item1!.id === family.family!.primaryFamilyContactPersonId)[0]?.item1?.lastName} Family`
    : "...");

  return (!family
  ? <ProgressBackdrop>
      <p>Loading family...</p>
    </ProgressBackdrop>
  : <Container maxWidth={false} sx={{paddingLeft: '12px'}}>
      <Toolbar variant="dense" disableGutters={true}>
        {permissions(Permission.UploadFamilyDocuments) && <Button
          onClick={() => setUploadDocumentDialogOpen(true)}
          variant="contained"
          size="small"
          sx={{margin: 1}}
          startIcon={<CloudUploadIcon />}>
          Upload
        </Button>}
        {permissions(Permission.EditFamilyInfo) && <Button
          onClick={() => setAddAdultDialogOpen(true)}
          variant="contained"
          size="small"
          sx={{margin: 1}}
          startIcon={<AddCircleIcon />}>
          Adult
        </Button>}
        {permissions(Permission.EditFamilyInfo) && <Button
          onClick={() => setAddChildDialogOpen(true)}
          variant="contained"
          size="small"
          sx={{margin: 1}}
          startIcon={<AddCircleIcon />}>
          Child
        </Button>}
        <Button
          onClick={() => setAddNoteDialogOpen(true)}
          variant="contained"
          size="small"
          sx={{margin: 1}}
          startIcon={<AddCircleIcon />}>
          Note
        </Button>
        {permissions(Permission.EditVolunteerRoleParticipation) &&
          (participatingFamilyRoles.length > 0 ||
            (family.volunteerFamilyInfo?.removedRoles &&
              family.volunteerFamilyInfo.removedRoles.length > 0)) &&
          <IconButton
            onClick={(event) => setFamilyMoreMenuAnchor(event.currentTarget)}
            size="large">
            <MoreVertIcon />
          </IconButton>}
        <Menu id="family-more-menu"
          anchorEl={familyMoreMenuAnchor}
          keepMounted
          open={Boolean(familyMoreMenuAnchor)}
          onClose={() => setFamilyMoreMenuAnchor(null)}>
          <MenuList dense={isDesktop}>
            {permissions(Permission.EditVolunteerRoleParticipation) &&
              participatingFamilyRoles.flatMap(([role, ]) => (
              <MenuItem key={role} onClick={() => selectRemoveRole(role)}>
                <ListItemText primary={`Remove from ${role} role`} />
              </MenuItem>
            ))}
            {permissions(Permission.EditVolunteerRoleParticipation) &&
              (family.volunteerFamilyInfo?.removedRoles || []).map(removedRole => (
              <MenuItem key={removedRole.roleName}
                onClick={() => selectResetRole(removedRole.roleName!, removedRole.reason!, removedRole.additionalComments!)}>
                <ListItemText primary={`Reset ${removedRole.roleName} participation`} />
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
        {uploadDocumentDialogOpen && <UploadFamilyDocumentsDialog family={family}
          onClose={() => setUploadDocumentDialogOpen(false)} />}
        {addAdultDialogOpen && <AddAdultDialog onClose={() => setAddAdultDialogOpen(false)} />}
        {addChildDialogOpen && <AddChildDialog onClose={() => setAddChildDialogOpen(false)} />}
        {addNoteDialogOpen && <AddEditNoteDialog familyId={family.family!.id!} onClose={() => setAddNoteDialogOpen(false)} />}
        {(removeRoleParameter && <RemoveFamilyRoleDialog volunteerFamilyId={familyId} role={removeRoleParameter.role}
          onClose={() => setRemoveRoleParameter(null)} />) || null}
        {(resetRoleParameter && <ResetFamilyRoleDialog volunteerFamilyId={familyId} role={resetRoleParameter.role}
          removalReason={resetRoleParameter.removalReason} removalAdditionalComments={resetRoleParameter.removalAdditionalComments}
          onClose={() => setResetRoleParameter(null)} />) || null}
      </Toolbar>
      <Grid container spacing={0}>
        <Grid item container xs={12} md={4} spacing={0}>
          <Grid item xs={12}>
            <ActivityTimeline family={family} />
          </Grid>
        </Grid>
        <Grid item xs={12} md={8}>
          <Grid container spacing={0}>
            <Grid item xs={12} md={4}>
              <PrimaryContactEditor family={family} />
              {permissions(Permission.ViewReferralProgress) &&
                <>
                  <br />
                  {family.partneringFamilyInfo?.openReferral
                    ? "Referral open since " + format(family.partneringFamilyInfo.openReferral.openedAtUtc!, "M/d/yy")
                    : "Referral closed - " + ReferralCloseReason[family.partneringFamilyInfo?.closedReferrals?.[family.partneringFamilyInfo.closedReferrals.length-1]?.closeReason!]
                    //TODO: "Closed on " + format(partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closedUtc) -- needs a new calculated property
                  }
                  {(family.partneringFamilyInfo!.closedReferrals?.length && (
                    <>
                      <br />
                      {family.partneringFamilyInfo!.closedReferrals?.map(referral => (
                        <p key={referral.id}>Previous referral closed {format(referral.closedAtUtc!, "M/d/yy")} - {ReferralCloseReason[referral.closeReason!]}</p>
                      ))}
                    </>
                  )) || null}
                </>}
            </Grid>
            {permissions(Permission.ViewReferralCustomFields) && <Grid item xs={6} md={4}>
              {(family.partneringFamilyInfo?.openReferral?.completedCustomFields ||
                [] as Array<CompletedCustomFieldInfo | string>).concat(
                family.partneringFamilyInfo?.openReferral?.missingCustomFields || []).sort((a, b) =>
                  (a instanceof CompletedCustomFieldInfo ? a.customFieldName! : a) <
                  (b instanceof CompletedCustomFieldInfo ? b.customFieldName! : b) ? -1
                  : (a instanceof CompletedCustomFieldInfo ? a.customFieldName! : a) >
                  (b instanceof CompletedCustomFieldInfo ? b.customFieldName! : b) ? 1
                  : 0).map(customField =>
                <ReferralCustomField key={typeof customField === 'string' ? customField : customField.customFieldName}
                  partneringFamilyId={familyId} referralId={family.partneringFamilyInfo!.openReferral!.id!}
                  customField={customField} />)}
            </Grid>}
            <Grid item xs={6} md={4}>
              {canCloseReferral && <Button
                onClick={() => setCloseReferralDialogOpen(true)}
                variant="contained"
                size="small"
                sx={{margin: 1}}>
                Close Referral
              </Button>}
              {!family.partneringFamilyInfo?.openReferral && permissions(Permission.CreateReferral) && <Button
                onClick={() => setOpenNewReferralDialogOpen(true)}
                variant="contained"
                size="small"
                sx={{margin: 1}}>
                Open New Referral
              </Button>}
              {closeReferralDialogOpen && family.partneringFamilyInfo?.openReferral && (
                <CloseReferralDialog
                  partneringFamilyId={family.family?.id!}
                  referralId={family.partneringFamilyInfo!.openReferral!.id!}
                  onClose={() => setCloseReferralDialogOpen(false)} />)}
              {openNewReferralDialogOpen && (
                <OpenNewReferralDialog
                  partneringFamilyId={family.family?.id!}
                  onClose={() => setOpenNewReferralDialogOpen(false)} />)}
            </Grid>
          </Grid>
          {permissions(Permission.ViewReferralComments) && family.partneringFamilyInfo?.openReferral &&
            <Grid container spacing={0}>
              <ReferralComments partneringFamily={family}
                referralId={family.partneringFamilyInfo.openReferral.id!} />
            </Grid>}
          <Grid container spacing={0}>
            {permissions(Permission.ViewReferralProgress) && family.partneringFamilyInfo?.openReferral &&
              <>
                <Grid item xs={12} sm={6} md={4} style={{paddingRight: 20}}>
                  <h3 style={{ marginBottom: 0 }}>Incomplete</h3>
                  {family.partneringFamilyInfo?.openReferral?.missingRequirements?.map((missing, i) =>
                    <MissingRequirementRow key={`${missing}:${i}`} requirement={missing} context={referralRequirementContext!} />
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={4} style={{paddingRight: 20}}>
                  <h3 style={{ marginBottom: 0 }}>Completed</h3>
                  {family.partneringFamilyInfo?.openReferral?.completedRequirements?.map((completed, i) =>
                    <CompletedRequirementRow key={`${completed.completedRequirementId}:${i}`} requirement={completed} context={referralRequirementContext!} />
                  )}
                  {family.partneringFamilyInfo?.openReferral?.exemptedRequirements?.map((exempted, i) =>
                    <ExemptedRequirementRow key={`${exempted.requirementName}:${i}`} requirement={exempted} context={referralRequirementContext!} />
                  )}
                </Grid>
              </>}
            {family.volunteerFamilyInfo &&
              <>
                <Grid item xs={12}>
                  <Box sx={{
                    '& > div:first-of-type': {
                      marginLeft: 0
                    },
                    '& > *': {
                      margin: theme.spacing(0.5),
                    }
                  }}>
                    {Object.entries(family.volunteerFamilyInfo?.familyRoleApprovals || {}).flatMap(([role, roleVersionApprovals]) =>
                      <VolunteerRoleApprovalStatusChip key={role} roleName={role} roleVersionApprovals={roleVersionApprovals} />)}
                    {(family.volunteerFamilyInfo?.removedRoles || []).map(removedRole =>
                      <Chip key={removedRole.roleName} size="small" label={`${removedRole.roleName} - ${RoleRemovalReason[removedRole.reason!]} - ${removedRole.additionalComments}`} />)}
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={4} style={{paddingRight: 20}}>
                  <h3>Incomplete</h3>
                  {family.volunteerFamilyInfo?.missingRequirements?.map((missing, i) =>
                    <MissingRequirementRow key={`${missing}:${i}`} requirement={missing} context={volunteerFamilyRequirementContext} />
                  )}
                  <Divider />
                  {family.volunteerFamilyInfo?.availableApplications?.map((application, i) =>
                    <MissingRequirementRow key={`${application}:${i}`} requirement={application} context={volunteerFamilyRequirementContext} isAvailableApplication={true} />
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={4} style={{paddingRight: 20}}>
                  <h3>Completed</h3>
                  {family.volunteerFamilyInfo?.completedRequirements?.map((completed, i) =>
                    <CompletedRequirementRow key={`${completed.completedRequirementId}:${i}`} requirement={completed} context={volunteerFamilyRequirementContext} />
                  )}
                  {family.volunteerFamilyInfo?.exemptedRequirements?.map((exempted, i) =>
                    <ExemptedRequirementRow key={`${exempted.requirementName}:${i}`} requirement={exempted} context={volunteerFamilyRequirementContext} />
                  )}
                </Grid>
              </>}
            {permissions(Permission.ViewFamilyDocumentMetadata) &&
              <Grid item xs={12} sm={6} md={4}>
                <h3 style={{ marginBottom: 0 }}>Documents</h3>
                <FamilyDocuments family={family} />
              </Grid>}
          </Grid>
          <Grid container spacing={0}>
            {family.partneringFamilyInfo?.openReferral &&
              <Grid item xs={12}>
                <h3 style={{ marginBottom: 0 }}>Arrangements</h3>
                <Masonry columns={isDesktop ? isWideScreen ? 3 : 2 : 1} spacing={2}>
                  {family.partneringFamilyInfo?.openReferral?.arrangements?.slice()
                  .sort((a,b) => sortArrangementsByStartDateDescThenCreateDateDesc(a,b))
                  .map(arrangement => (
                    <ArrangementCard key={arrangement.id}
                      partneringFamily={family} referralId={family.partneringFamilyInfo!.openReferral!.id!}
                      arrangement={arrangement} />
                  )) || false}
                  {permissions(Permission.CreateArrangement) && <Box sx={{textAlign: 'center'}}>
                    {family.partneringFamilyInfo?.openReferral && policy.referralPolicy?.arrangementPolicies?.map(arrangementPolicy => (
                      <Box key={arrangementPolicy.arrangementType}>
                        <Button
                          onClick={() => setCreateArrangementDialogParameter(arrangementPolicy)}
                          variant="contained"
                          size="small"
                          sx={{margin: 1}}
                          startIcon={<AddCircleIcon />}>
                          {arrangementPolicy.arrangementType}
                        </Button>
                      </Box>
                    ))}
                  </Box>}
                </Masonry>
                {createArrangementDialogParameter &&
                  <CreateArrangementDialog
                    referralId={family.partneringFamilyInfo!.openReferral!.id!}
                    arrangementPolicy={createArrangementDialogParameter}
                    onClose={() => setCreateArrangementDialogParameter(null)} />}
              </Grid>}
            <Grid item xs={12}>
              <h3 style={{ marginBottom: 0 }}>Family Members</h3>
              <Masonry columns={isDesktop ? isWideScreen ? 3 : 2 : 1} spacing={2}>
                {family.family?.adults?.map(adult => adult.item1 && adult.item1.id && adult.item1.active && adult.item2 && (
                  <AdultCard key={adult.item1.id} familyId={familyId} personId={adult.item1.id} />
                ))}
                {family.family?.children?.map(child => child.active && (
                  <ChildCard key={child.id!} familyId={familyId} personId={child.id!} />
                ))}
              </Masonry>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
