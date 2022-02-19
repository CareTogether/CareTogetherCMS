import { Container, Toolbar, Grid, Button, Menu, MenuItem, MenuList, useMediaQuery, useTheme, IconButton } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { ActionRequirement, ArrangementPolicy, CombinedFamilyInfo, CompletedCustomFieldInfo, CustomFieldType, Permission, ReferralCloseReason } from '../../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { partneringFamiliesData } from '../../Model/ReferralsModel';
import { useParams } from 'react-router';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import AssignmentTurnedInIcon from '@material-ui/icons/AssignmentTurnedIn';
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
import { policyData } from '../../Model/ConfigurationModel';
import { RecordReferralStepDialog } from './RecordReferralStepDialog';
import { CreateArrangementDialog } from './CreateArrangementDialog';
import { CloseReferralDialog } from './CloseReferralDialog';
import { OpenNewReferralDialog } from './OpenNewReferralDialog';
import { CustomReferralFieldDialog } from './CustomReferralFieldDialog';
import { FamilyDocuments } from '../Families/FamilyDocuments';
import { HeaderContent, HeaderTitle } from '../Header';
import { ArrowBack } from '@material-ui/icons';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../Model/SessionModel';

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
  
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const partneringFamilies = useRecoilValue(partneringFamiliesData);
  const policy = useRecoilValue(policyData);

  const partneringFamily = partneringFamilies.find(x => x.family?.id === familyId) as CombinedFamilyInfo;
  
  const canCloseReferral = partneringFamily.partneringFamilyInfo?.openReferral &&
    !partneringFamily.partneringFamilyInfo.openReferral.closeReason &&
    !partneringFamily.partneringFamilyInfo.openReferral.arrangements?.some(arrangement => !arrangement.endedAtUtc);

  const [familyRecordMenuAnchor, setFamilyRecordMenuAnchor] = useState<Element | null>(null);
  const [recordReferralStepParameter, setRecordReferralStepParameter] = useState<{requirementName: string, requirementInfo: ActionRequirement} | null>(null);
  function selectRecordReferralStep(requirementName: string) {
    setFamilyRecordMenuAnchor(null);
    const requirementInfo = policy.actionDefinitions![requirementName];
    setRecordReferralStepParameter({requirementName, requirementInfo});
  }
  
  const [closeReferralDialogOpen, setCloseReferralDialogOpen] = useState(false);
  const [openNewReferralDialogOpen, setOpenNewReferralDialogOpen] = useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] = useState(false);
  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  
  const [customFieldDialogParameter, setCustomFieldDialogParameter] = useState<string | CompletedCustomFieldInfo | null>(null);

  const [createArrangementDialogParameter, setCreateArrangementDialogParameter] = useState<ArrangementPolicy | null>(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const navigate = useNavigate();

  const permissions = usePermissions();

  return (
  <Container>
    <HeaderContent>
      <HeaderTitle>
        <IconButton color="inherit" onClick={() => navigate("..")}>
          <ArrowBack />
        </IconButton>
        &nbsp;
        {partneringFamily?.family?.adults!.filter(adult => adult.item1!.id === partneringFamily!.family!.primaryFamilyContactPersonId)[0]?.item1?.lastName} Family
      </HeaderTitle>
    </HeaderContent>
    <Toolbar variant="dense" disableGutters={true}>
      <Button aria-controls="family-record-menu" aria-haspopup="true"
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<AssignmentTurnedInIcon />}
        onClick={(event) => setFamilyRecordMenuAnchor(event.currentTarget)}>
        Complete…
      </Button>
      {permissions(Permission.UploadStandaloneDocuments) && <Button
        onClick={() => setUploadDocumentDialogOpen(true)}
        variant="contained" color="default" size="small" className={classes.button}
        startIcon={<CloudUploadIcon />}>
        Upload
      </Button>}
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
      <Menu id="family-record-menu"
        anchorEl={familyRecordMenuAnchor}
        keepMounted
        open={Boolean(familyRecordMenuAnchor)}
        onClose={() => setFamilyRecordMenuAnchor(null)}>
        <MenuList dense={isMobile}>
          {partneringFamily.partneringFamilyInfo?.openReferral?.missingRequirements?.map(requirementName => (
            <MenuItem key={requirementName} onClick={() => selectRecordReferralStep(requirementName)}>{requirementName}</MenuItem>
          ))}
          {/* <Divider /> */}
          {/* {partneringFamily.partneringFamilyInfo?.availableApplications?.map(requirementName => (
            <MenuItem key={requirementName} onClick={() => selectRecordFamilyStep(requirementName)}>{requirementName}</MenuItem>
          ))} */}
        </MenuList>
      </Menu>
      {recordReferralStepParameter && <RecordReferralStepDialog partneringFamily={partneringFamily} referralId={partneringFamily.partneringFamilyInfo?.openReferral?.id!}
        requirementName={recordReferralStepParameter.requirementName} stepActionRequirement={recordReferralStepParameter.requirementInfo}
        onClose={() => setRecordReferralStepParameter(null)} />}
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
            <p>Previous Referrals:</p>
            <ul>
              {partneringFamily.partneringFamilyInfo!.closedReferrals?.map(referral => (
                <li key={referral.id}>Referral closed - {ReferralCloseReason[referral.closeReason!]}</li>
              ))}
            </ul>
          </Grid>
        )) || null}
      </Grid>
      <Grid item container xs={12} md={8} spacing={2}>
        <Grid item xs={12}>
          <span>Primary Contact: <PersonName person={partneringFamily.family?.adults?.find(adult => adult.item1?.id === partneringFamily.family?.primaryFamilyContactPersonId)?.item1} /></span>
        </Grid>
        <Grid item container xs={12}>
          <Grid item xs={6} md={4}>
            {partneringFamily.partneringFamilyInfo?.openReferral
              ? "Referral open since " + format(partneringFamily.partneringFamilyInfo.openReferral.openedAtUtc!, "MM/dd/yyyy")
              : "Referral closed - " + ReferralCloseReason[partneringFamily.partneringFamilyInfo?.closedReferrals?.[partneringFamily.partneringFamilyInfo.closedReferrals.length-1]?.closeReason!]
              //TODO: "Closed on " + format(partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closedUtc) -- needs a new calculated property
            }
          </Grid>
          <Grid item xs={6} md={8}>
            {partneringFamily.partneringFamilyInfo?.openReferral?.completedCustomFields?.map(completedField => (
              <p key={completedField.customFieldName}>
                {completedField.customFieldName}: {completedField.customFieldType === CustomFieldType.String
                  ? completedField.value as string
                  : (completedField.value as boolean ? "Yes" : "No")}&nbsp;
                <Button
                  onClick={() => setCustomFieldDialogParameter(completedField)}
                  variant="contained" color="default" size="small" className={classes.button}>
                  Edit…
                </Button>
              </p>
            ))}
            {partneringFamily.partneringFamilyInfo?.openReferral?.missingCustomFields?.map(missingField => (
              <p key={missingField}>
                {missingField}: ❓&nbsp;
                <Button
                  onClick={() => setCustomFieldDialogParameter(missingField)}
                  variant="contained" color="default" size="small" className={classes.button}>
                  Complete…
                </Button>
              </p>
            ))}
            {customFieldDialogParameter && (
              <CustomReferralFieldDialog
                partneringFamilyId={partneringFamily.family?.id!}
                referralId={partneringFamily.partneringFamilyInfo!.openReferral!.id!}
                customField={customFieldDialogParameter}
                onClose={() => setCustomFieldDialogParameter(null)} />)}
          </Grid>
          <Grid item xs={12}>
            {canCloseReferral && <Button
              onClick={() => setCloseReferralDialogOpen(true)}
              variant="contained" color="default" size="small" className={classes.button}>
              Close Referral
            </Button>}
            {!partneringFamily.partneringFamilyInfo?.openReferral && <Button
              onClick={() => setOpenNewReferralDialogOpen(true)}
              variant="contained" color="default" size="small" className={classes.button}>
              Open New Referral
            </Button>}
            {closeReferralDialogOpen && (
              <CloseReferralDialog
                partneringFamilyId={partneringFamily.family?.id!}
                referralId={partneringFamily.partneringFamilyInfo!.openReferral!.id!}
                onClose={() => setCloseReferralDialogOpen(false)} />)}
            {openNewReferralDialogOpen && (
              <OpenNewReferralDialog
                partneringFamilyId={partneringFamily.family?.id!}
                onClose={() => setOpenNewReferralDialogOpen(false)} />)}
          </Grid>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <h3>Incomplete</h3>
          <ul className={classes.familyRequirementsList}>
            {partneringFamily.partneringFamilyInfo?.openReferral?.missingRequirements?.map((missingRequirementName, i) => (
              <li key={i}>
                ❌ {missingRequirementName}
              </li>
            ))}
          </ul>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <h3>Completed</h3>
          <ul className={classes.familyRequirementsList}>
            {partneringFamily.partneringFamilyInfo?.openReferral?.completedRequirements?.map((completed, i) => (
              <li key={i}>
                ✅ {completed.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                {completed.completedAtUtc && <span style={{float:'right',marginRight:20}}>{format(completed.completedAtUtc, "MM/dd/yyyy hh:mm aa")}</span>}
              </li>
            ))}
          </ul>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <h3>Documents</h3>
          <FamilyDocuments family={partneringFamily} />
        </Grid>
        <Grid item container xs={12} spacing={2}>
          {partneringFamily.partneringFamilyInfo?.openReferral?.arrangements?.map(arrangement => (
            <Grid item key={arrangement.id}>
              <ArrangementCard partneringFamily={partneringFamily} referralId={partneringFamily.partneringFamilyInfo!.openReferral!.id!} arrangement={arrangement} />
            </Grid>
          ))}
          {partneringFamily.partneringFamilyInfo?.openReferral && policy.referralPolicy?.arrangementPolicies?.map(arrangementPolicy => (
            <Grid item key={arrangementPolicy.arrangementType}>
              <Button
                onClick={() => setCreateArrangementDialogParameter(arrangementPolicy)}
                variant="contained" color="default" size="small" className={classes.button}
                startIcon={<AddCircleIcon />}>
                {arrangementPolicy.arrangementType}
              </Button>
            </Grid>
          ))}
          {createArrangementDialogParameter &&
            <CreateArrangementDialog
              referralId={partneringFamily.partneringFamilyInfo!.openReferral!.id!}
              arrangementPolicy={createArrangementDialogParameter}
              onClose={() => setCreateArrangementDialogParameter(null)} />}
        </Grid>
        {partneringFamily.family?.adults?.map(adult => adult.item1 && adult.item1.id && adult.item1.active && adult.item2 && (
          <Grid item key={adult.item1.id}>
            <PartneringAdultCard partneringFamilyId={familyId} personId={adult.item1.id} />
          </Grid>
        ))}
        {partneringFamily.family?.children?.map(child => child.active && (
          <Grid item key={child.id!}>
            <PartneringChildCard partneringFamilyId={familyId} personId={child.id!} />
          </Grid>
        ))}
      </Grid>
    </Grid>
  </Container>);
}
