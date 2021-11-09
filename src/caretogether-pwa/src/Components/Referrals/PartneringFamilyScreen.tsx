import { Container, Toolbar, Grid } from '@material-ui/core';
import { CombinedFamilyInfo } from '../../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { partneringFamiliesData } from '../../Model/ReferralsModel';
import { useParams } from 'react-router';
import { PartneringAdultCard } from './PartneringAdultCard';
import { PartneringChildCard } from './PartneringChildCard';

// const useStyles = makeStyles((theme) => ({
//   sectionHeading: {
//   },
//   sectionChips: {
//     '& > div:first-child': {
//       marginLeft: 0
//     },
//     '& > *': {
//       margin: theme.spacing(0.5),
//     }
//   },
//   button: {
//     margin: theme.spacing(1),
//   },
//   familyRequirementsList: {
//     listStyle: 'none',
//     paddingLeft: 22,
//     textIndent: -22
//   },
//   familyDocumentsList: {
//     listStyle: 'none',
//     paddingLeft: 22,
//     textIndent: -22
//   },
//   card: {
//     minWidth: 275,
//   },
//   cardHeader: {
//     paddingBottom: 0
//   },
//   cardContent: {
//     paddingTop: 8,
//     paddingBottom: 8
//   },
//   cardList: {
//     padding: 0,
//     margin: 0,
//     marginTop: 8,
//     listStyle: 'none',
//     '& > li': {
//       marginTop: 4
//     }
//   },
//   rightCardAction: {
//     marginLeft: 'auto !important'
//   }
// }));

export function PartneringFamilyScreen() {
  //const classes = useStyles();
  const { familyId } = useParams<{ familyId: string }>();

  const partneringFamilies = useRecoilValue(partneringFamiliesData);
  //const policy = useRecoilValue(policyData);
  //const organizationId = useRecoilValue(currentOrganizationState);
  //const locationId = useRecoilValue(currentLocationState);

  const partneringFamily = partneringFamilies.find(x => x.family?.id === familyId) as CombinedFamilyInfo;
  
  // const [familyRecordMenuAnchor, setFamilyRecordMenuAnchor] = useState<Element | null>(null);
  // const [recordFamilyStepParameter, setRecordFamilyStepParameter] = useState<{requirementName: string, requirementInfo: ActionRequirement} | null>(null);
  // function selectRecordFamilyStep(requirementName: string) {
  //   setFamilyRecordMenuAnchor(null);
  //   const requirementInfo = policy.actionDefinitions![requirementName];
  //   setRecordFamilyStepParameter({requirementName, requirementInfo});
  // }
  
  // const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] = useState(false);
  // const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  // const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);

  // const [familyMoreMenuAnchor, setFamilyMoreMenuAnchor] = useState<Element | null>(null);

  // const [removeRoleParameter, setRemoveRoleParameter] = useState<{partneringFamilyId: string, role: string} | null>(null);
  // function selectRemoveRole(role: string) {
  //   setFamilyMoreMenuAnchor(null);
  //   setRemoveRoleParameter({partneringFamilyId, role: role});
  // }
  // const [resetRoleParameter, setResetRoleParameter] = useState<{partneringFamilyId: string, role: string, removalReason: RoleRemovalReason, removalAdditionalComments: string} | null>(null);
  // function selectResetRole(role: string, removalReason: RoleRemovalReason, removalAdditionalComments: string) {
  //   setFamilyMoreMenuAnchor(null);
  //   setResetRoleParameter({partneringFamilyId, role: role, removalReason: removalReason, removalAdditionalComments: removalAdditionalComments});
  // }
  
  //const theme = useTheme();
  //const isMobile = useMediaQuery(theme.breakpoints.up('sm'));

  return (
  <Container>
    <Toolbar variant="dense" disableGutters={true}>
      {/* <Button aria-controls="family-record-menu" aria-haspopup="true"
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AssignmentTurnedInIcon />}
        onClick={(event) => setFamilyRecordMenuAnchor(event.currentTarget)}>
        Complete…
      </Button> */}
      {/* <Button
        onClick={() => setUploadDocumentDialogOpen(true)}
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<CloudUploadIcon />}>
        Upload
      </Button> */}
      {/* <Button
        onClick={() => setAddAdultDialogOpen(true)}
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AddCircleIcon />}>
        Adult
      </Button> */}
      {/* <Button
        onClick={() => setAddChildDialogOpen(true)}
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AddCircleIcon />}>
        Child
      </Button> */}
      {/* <IconButton
        onClick={(event) => setFamilyMoreMenuAnchor(event.currentTarget)}>
        <MoreVertIcon />
      </IconButton> */}
      {/* <Menu id="family-record-menu"
        anchorEl={familyRecordMenuAnchor}
        keepMounted
        open={Boolean(familyRecordMenuAnchor)}
        onClose={() => setFamilyRecordMenuAnchor(null)}>
        <MenuList dense={isMobile}>
          {partneringFamily.partneringFamilyInfo?.missingRequirements?.map(requirementName => (
            <MenuItem key={requirementName} onClick={() => selectRecordFamilyStep(requirementName)}>{requirementName}</MenuItem>
          ))}
          <Divider />
          {partneringFamily.partneringFamilyInfo?.availableApplications?.map(requirementName => (
            <MenuItem key={requirementName} onClick={() => selectRecordFamilyStep(requirementName)}>{requirementName}</MenuItem>
          ))}
        </MenuList>
      </Menu> */}
      {/* <Menu id="family-more-menu"
        anchorEl={familyMoreMenuAnchor}
        keepMounted
        open={Boolean(familyMoreMenuAnchor)}
        onClose={() => setFamilyMoreMenuAnchor(null)}>
        <MenuList dense={isMobile}>
          {Object.entries(partneringFamily.partneringFamilyInfo?.familyRoleApprovals || {}).filter(([role, ]) =>
            !partneringFamily.partneringFamilyInfo?.removedRoles?.find(x => x.roleName === role)).flatMap(([role, ]) => (
            <MenuItem key={role} onClick={() => selectRemoveRole(role)}>
              <ListItemText primary={`Remove from ${role} role`} />
            </MenuItem>
          ))}
          {(partneringFamily.partneringFamilyInfo?.removedRoles || []).map(removedRole => (
            <MenuItem key={removedRole.roleName}
              onClick={() => selectResetRole(removedRole.roleName!, removedRole.reason!, removedRole.additionalComments!)}>
              <ListItemText primary={`Reset ${removedRole.roleName} participation`} />
            </MenuItem>
          ))}
        </MenuList>
      </Menu> */}
      {/* {recordFamilyStepParameter && <RecordPartneringFamilyStepDialog partneringFamily={partneringFamily}
        requirementName={recordFamilyStepParameter.requirementName} stepActionRequirement={recordFamilyStepParameter.requirementInfo}
        onClose={() => setRecordFamilyStepParameter(null)} />} */}
      {/* {uploadDocumentDialogOpen && <UploadPartneringFamilyDocumentDialog partneringFamily={partneringFamily}
        onClose={() => setUploadDocumentDialogOpen(false)} />} */}
      {/* {addAdultDialogOpen && <AddAdultDialog onClose={() => setAddAdultDialogOpen(false)} />} */}
      {/* {addChildDialogOpen && <AddChildDialog onClose={() => setAddChildDialogOpen(false)} />} */}
      {/* {(removeRoleParameter && <RemoveFamilyRoleDialog partneringFamilyId={partneringFamilyId} role={removeRoleParameter.role}
        onClose={() => setRemoveRoleParameter(null)} />) || null} */}
      {/* {(resetRoleParameter && <ResetFamilyRoleDialog partneringFamilyId={partneringFamilyId} role={resetRoleParameter.role}
        removalReason={resetRoleParameter.removalReason} removalAdditionalComments={resetRoleParameter.removalAdditionalComments}
        onClose={() => setResetRoleParameter(null)} />) || null} */}
    </Toolbar>
    <Grid container spacing={0}>
      <Grid item xs={12}>
        <span>Primary Contact: {partneringFamily.family?.adults?.filter(adult => adult.item1?.id === partneringFamily.family?.primaryFamilyContactPersonId)[0]?.item1?.firstName}</span>
      </Grid>
      {/* <Grid item xs={12}>
        <div className={classes.sectionChips}>
          {Object.entries(partneringFamily.partneringFamilyInfo?.familyRoleApprovals || {}).flatMap(([role, roleVersionApprovals]) =>
            <VolunteerRoleApprovalStatusChip key={role} roleName={role} roleVersionApprovals={roleVersionApprovals} />)}
          {(partneringFamily.partneringFamilyInfo?.removedRoles || []).map(removedRole =>
            <Chip key={removedRole.roleName} size="small" label={`${removedRole.roleName} - ${RoleRemovalReason[removedRole.reason!]} - ${removedRole.additionalComments}`} />)}
        </div>
      </Grid> */}
      {/* <Grid item xs={12} sm={6} md={4}>
        <h3>Incomplete</h3>
        <ul className={classes.familyRequirementsList}>
          {partneringFamily.partneringFamilyInfo?.missingRequirements?.map((missingRequirementName, i) => (
            <li key={i}>
              ❌ {missingRequirementName}
            </li>
          ))}
        </ul>
      </Grid> */}
      {/* <Grid item xs={12} sm={6} md={4}>
        <h3>Completed</h3>
        <ul className={classes.familyRequirementsList}>
          {partneringFamily.partneringFamilyInfo?.completedRequirements?.map((completed, i) => (
            <li key={i}>
              ✅ {completed.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {completed.completedAtUtc && <span style={{float:'right',marginRight:20}}>{format(completed.completedAtUtc, "MM/dd/yyyy hh:mm aa")}</span>}
            </li>
          ))}
        </ul>
      </Grid> */}
      {/* <Grid item xs={12} sm={6} md={4}>
        <h3>Documents</h3>
        <ul className={classes.familyDocumentsList}>
          {partneringFamily.partneringFamilyInfo?.uploadedDocuments?.map((uploaded, i) => (
            <li key={i}
              onClick={() => downloadFile(organizationId, locationId, uploaded.uploadedDocumentId!)}>
              📃 {uploaded.uploadedFileName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
              {uploaded.timestampUtc && <span style={{float:'right',marginRight:20}}>{format(uploaded.timestampUtc, "MM/dd/yyyy hh:mm aa")}</span>}
            </li>
          ))}
        </ul>
      </Grid> */}
    </Grid>
    <Grid container spacing={2}>
      {partneringFamily.family?.adults?.map(adult => adult.item1 && adult.item1.id && adult.item2 && (
        <Grid item key={adult.item1.id}>
          <PartneringAdultCard partneringFamilyId={familyId} personId={adult.item1.id} />
        </Grid>
      ))}
      {partneringFamily.family?.children?.map(child => (
        <Grid item key={child.id!}>
          <PartneringChildCard partneringFamilyId={familyId} personId={child.id!} />
        </Grid>
      ))}
    </Grid>
  </Container>);
}
