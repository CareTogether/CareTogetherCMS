import { useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';
import { Container, Toolbar, Button, Menu, MenuItem, Grid, useMediaQuery, useTheme, MenuList, IconButton, ListItemText, Chip, Divider } from '@mui/material';
import { CombinedFamilyInfo, RoleRemovalReason, Permission } from '../../GeneratedClient';
import { useRecoilValue } from 'recoil';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { volunteerFamiliesData } from '../../Model/VolunteersModel';
import { AddAdultDialog } from '../Families/AddAdultDialog';
import { AddChildDialog } from '../Families/AddChildDialog';
import { useParams } from 'react-router';
import { VolunteerAdultCard } from './VolunteerAdultCard';
import { VolunteerChildCard } from './VolunteerChildCard';
import { UploadFamilyDocumentsDialog } from '../Families/UploadFamilyDocumentsDialog';
import { VolunteerRoleApprovalStatusChip } from './VolunteerRoleApprovalStatusChip';
import { RemoveFamilyRoleDialog } from './RemoveFamilyRoleDialog';
import { ResetFamilyRoleDialog } from './ResetFamilyRoleDialog';
import { PersonName } from '../Families/PersonName';
import { FamilyDocuments } from '../Families/FamilyDocuments';
import { HeaderContent, HeaderTitle } from '../Header';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';
import { usePermissions } from '../../Model/SessionModel';
import { Masonry } from '@mui/lab';
import { MissingRequirementRow } from "../Requirements/MissingRequirementRow";
import { ExemptedRequirementRow } from "../Requirements/ExemptedRequirementRow";
import { CompletedRequirementRow } from "../Requirements/CompletedRequirementRow";
import { VolunteerFamilyContext } from "../Requirements/RequirementContext";

const useStyles = makeStyles((theme) => ({
  sectionHeading: {
  },
  sectionChips: {
    '& > div:first-child': {
      marginLeft: 0
    },
    '& > *': {
      margin: theme.spacing(0.5),
    }
  },
  button: {
    margin: theme.spacing(1),
  },
  familyRequirementsList: {
    listStyle: 'none',
    paddingLeft: 22,
    textIndent: -22
  },
  familyDocumentsList: {
    listStyle: 'none',
    paddingLeft: 22,
    textIndent: -22
  },
  card: {
    minWidth: 275,
  },
  cardHeader: {
    paddingBottom: 0
  },
  cardContent: {
    paddingTop: 8,
    paddingBottom: 8
  },
  cardList: {
    padding: 0,
    margin: 0,
    marginTop: 8,
    listStyle: 'none',
    '& > li': {
      marginTop: 4
    }
  },
  rightCardAction: {
    marginLeft: 'auto !important'
  }
}));

export function VolunteerFamilyScreen() {
  const classes = useStyles();
  
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);

  const volunteerFamily = volunteerFamilies.find(x => x.family?.id === familyId) as CombinedFamilyInfo;
  
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] = useState(false);
  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);

  const [familyMoreMenuAnchor, setFamilyMoreMenuAnchor] = useState<Element | null>(null);

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
  
  const requirementContext: VolunteerFamilyContext = {
    kind: "Volunteer Family",
    volunteerFamilyId: familyId
  };

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('xl'));
  
  const navigate = useNavigate();

  const permissions = usePermissions();

  return (
    <Container maxWidth={false}>
      <HeaderContent>
        <HeaderTitle>
          <IconButton color="inherit" onClick={() => navigate("..")} size="large">
            <ArrowBack />
          </IconButton>
          &nbsp;
          {volunteerFamily?.family?.adults!.filter(adult => adult.item1!.id === volunteerFamily!.family!.primaryFamilyContactPersonId)[0]?.item1?.lastName} Family
        </HeaderTitle>
      </HeaderContent>
      <Toolbar variant="dense" disableGutters={true}>
        {permissions(Permission.UploadStandaloneDocuments) && <Button
          onClick={() => setUploadDocumentDialogOpen(true)}
          variant="contained"
          size="small"
          className={classes.button}
          startIcon={<CloudUploadIcon />}>
          Upload
        </Button>}
        <Button
          onClick={() => setAddAdultDialogOpen(true)}
          variant="contained"
          size="small"
          className={classes.button}
          startIcon={<AddCircleIcon />}>
          Adult
        </Button>
        <Button
          onClick={() => setAddChildDialogOpen(true)}
          variant="contained"
          size="small"
          className={classes.button}
          startIcon={<AddCircleIcon />}>
          Child
        </Button>
        <IconButton
          onClick={(event) => setFamilyMoreMenuAnchor(event.currentTarget)}
          size="large">
          <MoreVertIcon />
        </IconButton>
        <Menu id="family-more-menu"
          anchorEl={familyMoreMenuAnchor}
          keepMounted
          open={Boolean(familyMoreMenuAnchor)}
          onClose={() => setFamilyMoreMenuAnchor(null)}>
          <MenuList dense={isDesktop}>
            {permissions(Permission.EditVolunteerRoleParticipation) &&
              Object.entries(volunteerFamily.volunteerFamilyInfo?.familyRoleApprovals || {}).filter(([role, ]) =>
              !volunteerFamily.volunteerFamilyInfo?.removedRoles?.find(x => x.roleName === role)).flatMap(([role, ]) => (
              <MenuItem key={role} onClick={() => selectRemoveRole(role)}>
                <ListItemText primary={`Remove from ${role} role`} />
              </MenuItem>
            ))}
            {permissions(Permission.EditVolunteerRoleParticipation) &&
              (volunteerFamily.volunteerFamilyInfo?.removedRoles || []).map(removedRole => (
              <MenuItem key={removedRole.roleName}
                onClick={() => selectResetRole(removedRole.roleName!, removedRole.reason!, removedRole.additionalComments!)}>
                <ListItemText primary={`Reset ${removedRole.roleName} participation`} />
              </MenuItem>
            ))}
          </MenuList>
        </Menu>
        {uploadDocumentDialogOpen && <UploadFamilyDocumentsDialog family={volunteerFamily}
          onClose={() => setUploadDocumentDialogOpen(false)} />}
        {addAdultDialogOpen && <AddAdultDialog onClose={() => setAddAdultDialogOpen(false)} />}
        {addChildDialogOpen && <AddChildDialog onClose={() => setAddChildDialogOpen(false)} />}
        {(removeRoleParameter && <RemoveFamilyRoleDialog volunteerFamilyId={familyId} role={removeRoleParameter.role}
          onClose={() => setRemoveRoleParameter(null)} />) || null}
        {(resetRoleParameter && <ResetFamilyRoleDialog volunteerFamilyId={familyId} role={resetRoleParameter.role}
          removalReason={resetRoleParameter.removalReason} removalAdditionalComments={resetRoleParameter.removalAdditionalComments}
          onClose={() => setResetRoleParameter(null)} />) || null}
      </Toolbar>
      <Grid container spacing={0}>
        <Grid item xs={12}>
          <span>Primary Contact: <PersonName person={volunteerFamily.family?.adults?.find(adult => adult.item1?.id === volunteerFamily.family?.primaryFamilyContactPersonId)?.item1} /></span>
        </Grid>
        <Grid item xs={12}>
          <div className={classes.sectionChips}>
            {Object.entries(volunteerFamily.volunteerFamilyInfo?.familyRoleApprovals || {}).flatMap(([role, roleVersionApprovals]) =>
              <VolunteerRoleApprovalStatusChip key={role} roleName={role} roleVersionApprovals={roleVersionApprovals} />)}
            {(volunteerFamily.volunteerFamilyInfo?.removedRoles || []).map(removedRole =>
              <Chip key={removedRole.roleName} size="small" label={`${removedRole.roleName} - ${RoleRemovalReason[removedRole.reason!]} - ${removedRole.additionalComments}`} />)}
          </div>
        </Grid>
        <Grid item xs={12} sm={6} md={4} style={{paddingRight: 20}}>
          <h3>Incomplete</h3>
          {volunteerFamily.volunteerFamilyInfo?.missingRequirements?.map((missing, i) =>
            <MissingRequirementRow key={`${missing}:${i}`} requirement={missing} context={requirementContext} />
          )}
          <Divider />
          {volunteerFamily.volunteerFamilyInfo?.availableApplications?.map((application, i) =>
            <MissingRequirementRow key={`${application}:${i}`} requirement={application} context={requirementContext} isAvailableApplication={true} />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4} style={{paddingRight: 20}}>
          <h3>Completed</h3>
          {volunteerFamily.volunteerFamilyInfo?.completedRequirements?.map((completed, i) =>
            <CompletedRequirementRow key={`${completed.completedRequirementId}:${i}`} requirement={completed} context={requirementContext} />
          )}
          {volunteerFamily.volunteerFamilyInfo?.exemptedRequirements?.map((exempted, i) =>
            <ExemptedRequirementRow key={`${exempted.requirementName}:${i}`} requirement={exempted} context={requirementContext} />
          )}
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <h3>Documents</h3>
          <FamilyDocuments family={volunteerFamily} />
        </Grid>
      </Grid>
      <Masonry columns={isDesktop ? isLargeScreen ? 3 : 2 : 1} spacing={2}>
        {volunteerFamily.family?.adults?.map(adult => adult.item1 && adult.item1.id && adult.item1.active && adult.item2 && (
          <VolunteerAdultCard key={adult.item1.id} volunteerFamilyId={familyId} personId={adult.item1.id} />
        ))}
        {volunteerFamily.family?.children?.map(child => child.active && (
          <VolunteerChildCard key={child.id!} volunteerFamilyId={familyId} personId={child.id!} />
        ))}
      </Masonry>
    </Container>
  );
}
