import { Container, Toolbar, Grid, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { CombinedFamilyInfo, ReferralCloseReason } from '../../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { partneringFamiliesData } from '../../Model/ReferralsModel';
import { useParams } from 'react-router';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { PartneringAdultCard } from './PartneringAdultCard';
import { PartneringChildCard } from './PartneringChildCard';
import { useState } from 'react';
import { AddAdultDialog } from '../Families/AddAdultDialog';
import { AddChildDialog } from '../Families/AddChildDialog';
import { AddEditNoteDialog } from '../Families/AddEditNoteDialog';
import { ArrangementCard } from './ArrangementCard';
import { PersonName } from '../Families/PersonName';
import { format } from 'date-fns';
import { NoteCard } from '../Families/NoteCard';
import { UploadFamilyDocumentDialog } from '../Families/UploadFamilyDocumentDialog';
import { downloadFile } from '../../Model/FilesModel';
import { currentOrganizationState, currentLocationState } from '../../Model/SessionModel';

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

export function PartneringFamilyScreen() {
  const classes = useStyles();
  const { familyId } = useParams<{ familyId: string }>();

  const partneringFamilies = useRecoilValue(partneringFamiliesData);
  //const policy = useRecoilValue(policyData);
  const organizationId = useRecoilValue(currentOrganizationState);
  const locationId = useRecoilValue(currentLocationState);

  const partneringFamily = partneringFamilies.find(x => x.family?.id === familyId) as CombinedFamilyInfo;
  
  // const [familyRecordMenuAnchor, setFamilyRecordMenuAnchor] = useState<Element | null>(null);
  // const [recordFamilyStepParameter, setRecordFamilyStepParameter] = useState<{requirementName: string, requirementInfo: ActionRequirement} | null>(null);
  // function selectRecordFamilyStep(requirementName: string) {
  //   setFamilyRecordMenuAnchor(null);
  //   const requirementInfo = policy.actionDefinitions![requirementName];
  //   setRecordFamilyStepParameter({requirementName, requirementInfo});
  // }
  
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] = useState(false);
  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  
  // const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.up('sm'));

  return (
  <Container>
    <Toolbar variant="dense" disableGutters={true}>
      {/* <Button aria-controls="family-record-menu" aria-haspopup="true"
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AssignmentTurnedInIcon />}
        onClick={(event) => setFamilyRecordMenuAnchor(event.currentTarget)}>
        Complete…
      </Button> */}
      <Button
        onClick={() => setUploadDocumentDialogOpen(true)}
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<CloudUploadIcon />}>
        Upload
      </Button>
      <Button
        onClick={() => setAddAdultDialogOpen(true)}
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AddCircleIcon />}>
        Adult
      </Button>
      <Button
        onClick={() => setAddChildDialogOpen(true)}
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AddCircleIcon />}>
        Child
      </Button>
      <Button
        onClick={() => setAddNoteDialogOpen(true)}
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AddCircleIcon />}>
        Note
      </Button>
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
          {partneringFamily.partneringFamilyInfo?.openReferral?.missingIntakeRequirements?.map(requirementName => (
            <MenuItem key={requirementName} onClick={() => selectRecordFamilyStep(requirementName)}>{requirementName}</MenuItem>
          ))}
          <Divider /> */}
          {/* {partneringFamily.partneringFamilyInfo?.availableApplications?.map(requirementName => (
            <MenuItem key={requirementName} onClick={() => selectRecordFamilyStep(requirementName)}>{requirementName}</MenuItem>
          ))} */}
        {/* </MenuList>
      </Menu> */}
      {/* {recordFamilyStepParameter && <RecordPartneringFamilyStepDialog partneringFamily={partneringFamily}
        requirementName={recordFamilyStepParameter.requirementName} stepActionRequirement={recordFamilyStepParameter.requirementInfo}
        onClose={() => setRecordFamilyStepParameter(null)} />} */}
      {uploadDocumentDialogOpen && <UploadFamilyDocumentDialog family={partneringFamily}
        onClose={() => setUploadDocumentDialogOpen(false)} />}
      {addAdultDialogOpen && <AddAdultDialog onClose={() => setAddAdultDialogOpen(false)} />}
      {addChildDialogOpen && <AddChildDialog onClose={() => setAddChildDialogOpen(false)} />}
      {addNoteDialogOpen && <AddEditNoteDialog familyId={partneringFamily.family!.id!} onClose={() => setAddNoteDialogOpen(false)} />}
    </Toolbar>
    <Grid container spacing={0}>
      <Grid item container xs={12} md={4} spacing={2}>
        <Grid item xs={12}>
          {partneringFamily.notes?.slice().sort((a, b) =>
            a.timestampUtc! < b.timestampUtc! ? -1 : a.timestampUtc! > b.timestampUtc! ? 1 : 0).map(note => (
            <NoteCard key={note.id} familyId={partneringFamily.family!.id!} note={note} />
          ))}
        </Grid>
        {(partneringFamily.partneringFamilyInfo!.closedReferrals?.length && (
          <Grid item xs={12}>
            <p>Previous Referrals:
              <ul>
                {partneringFamily.partneringFamilyInfo!.closedReferrals?.map(referral => (
                  <li key={referral.id}>Referral closed - {ReferralCloseReason[partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closeReason!]}</li>
                ))}
              </ul>
            </p>
          </Grid>
        )) || null}
      </Grid>
      <Grid item container xs={12} md={8} spacing={2}>
        <Grid item xs={12}>
          <span>Primary Contact: <PersonName person={partneringFamily.family?.adults?.find(adult => adult.item1?.id === partneringFamily.family?.primaryFamilyContactPersonId)?.item1} /></span>
        </Grid>
        <Grid item container xs={12} spacing={2}>
          {partneringFamily.partneringFamilyInfo?.openReferral?.arrangements?.map(arrangement => (
            <Grid item key={arrangement.id}>
              <ArrangementCard partneringFamily={partneringFamily} arrangement={arrangement} />
            </Grid>
          ))}
        </Grid>
        <Grid item xs={12}>
          <p>{
            partneringFamily.partneringFamilyInfo?.openReferral
            ? "Referral open since " + format(partneringFamily.partneringFamilyInfo.openReferral.openedAtUtc!, "MM/dd/yyyy")
            : "Referral closed - " + ReferralCloseReason[partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closeReason!]
            //TODO: "Closed on " + format(partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closedUtc) -- needs a new calculated property
          }</p>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <h3>Documents</h3>
          <ul className={classes.familyDocumentsList}>
            {partneringFamily.uploadedDocuments?.map((uploaded, i) => (
              <li key={i}
                onClick={() => downloadFile(organizationId, locationId, uploaded.uploadedDocumentId!)}>
                📃 {uploaded.uploadedFileName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {uploaded.timestampUtc && <span style={{float:'right',marginRight:20}}>{format(uploaded.timestampUtc, "MM/dd/yyyy hh:mm aa")}</span>}
              </li>
            ))}
          </ul>
        </Grid>
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
    </Grid>
  </Container>);
}
