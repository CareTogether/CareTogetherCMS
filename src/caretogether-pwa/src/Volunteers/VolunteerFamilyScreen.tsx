import { useState } from 'react';
import { Container, Toolbar, Button, Menu, MenuItem, Grid, useMediaQuery, useTheme, MenuList, IconButton, ListItemText, Chip, Divider, Box } from '@mui/material';
import { RoleRemovalReason, Permission } from '../GeneratedClient';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { AddAdultDialog } from '../Families/AddAdultDialog';
import { AddChildDialog } from '../Families/AddChildDialog';
import { useParams } from 'react-router';
import { AdultCard } from '../Families/AdultCard';
import { ChildCard } from '../Families/ChildCard';
import { UploadFamilyDocumentsDialog } from '../Families/UploadFamilyDocumentsDialog';
import { VolunteerRoleApprovalStatusChip } from './VolunteerRoleApprovalStatusChip';
import { RemoveFamilyRoleDialog } from './RemoveFamilyRoleDialog';
import { ResetFamilyRoleDialog } from './ResetFamilyRoleDialog';
import { FamilyDocuments } from '../Families/FamilyDocuments';
import { useFamilyPermissions } from '../Model/SessionModel';
import { Masonry } from '@mui/lab';
import { MissingRequirementRow } from "../Requirements/MissingRequirementRow";
import { ExemptedRequirementRow } from "../Requirements/ExemptedRequirementRow";
import { CompletedRequirementRow } from "../Requirements/CompletedRequirementRow";
import { VolunteerFamilyContext } from "../Requirements/RequirementContext";
import { ActivityTimeline } from '../Activities/ActivityTimeline';
import { AddEditNoteDialog } from '../Notes/AddEditNoteDialog';
import { PrimaryContactEditor } from '../Families/PrimaryContactEditor';
import useScreenTitle from '../Shell/ShellScreenTitle';
import { ProgressBackdrop } from '../Shell/ProgressBackdrop';
import { useFamilyLookup } from '../Model/DirectoryModel';

export function FamilyScreen() {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId)!;
  
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
  
  const volunteerFamilyRequirementContext: VolunteerFamilyContext = {
    kind: "Volunteer Family",
    volunteerFamilyId: familyId
  };

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
        {permissions(Permission.AddEditDraftNotes) && <Button
          onClick={() => setAddNoteDialogOpen(true)}
          variant="contained"
          size="small"
          sx={{margin: 1}}
          startIcon={<AddCircleIcon />}>
          Note
        </Button>}
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
            <Grid item xs={12}>
              <PrimaryContactEditor family={family} />
            </Grid>
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
            {permissions(Permission.ViewFamilyDocumentMetadata) &&
              <Grid item xs={12} sm={6} md={4}>
                <h3 style={{ marginBottom: 0 }}>Documents</h3>
                <FamilyDocuments family={family} />
              </Grid>}
          </Grid>
          <Grid container spacing={0}>
            <Grid item xs={12}>
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
