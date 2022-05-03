import { Container, Toolbar, Grid, Button, useMediaQuery, useTheme, IconButton, Box } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { ArrangementPolicy, CombinedFamilyInfo, CompletedCustomFieldInfo, Permission, ReferralCloseReason } from '../../GeneratedClient';
import { useRecoilValue } from 'recoil';
import { partneringFamiliesData } from '../../Model/ReferralsModel';
import { useParams } from 'react-router';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { PartneringAdultCard } from './PartneringAdultCard';
import { PartneringChildCard } from './PartneringChildCard';
import { useState } from 'react';
import { AddAdultDialog } from '../Families/AddAdultDialog';
import { AddChildDialog } from '../Families/AddChildDialog';
import { AddEditNoteDialog } from '../Families/AddEditNoteDialog';
import { ArrangementCard } from './ArrangementCard';
import { format } from 'date-fns';
import { UploadFamilyDocumentsDialog } from '../Families/UploadFamilyDocumentsDialog';
import { policyData } from '../../Model/ConfigurationModel';
import { CreateArrangementDialog } from './CreateArrangementDialog';
import { CloseReferralDialog } from './CloseReferralDialog';
import { OpenNewReferralDialog } from './OpenNewReferralDialog';
import { FamilyDocuments } from '../Families/FamilyDocuments';
import { HeaderContent, HeaderTitle } from '../Header';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../Model/SessionModel';
import { Masonry } from '@mui/lab';
import { MissingRequirementRow } from "../Requirements/MissingRequirementRow";
import { ExemptedRequirementRow } from "../Requirements/ExemptedRequirementRow";
import { CompletedRequirementRow } from "../Requirements/CompletedRequirementRow";
import { ReferralContext } from "../Requirements/RequirementContext";
import { ActivityTimeline } from '../Activities/ActivityTimeline';
import { ReferralComments } from './ReferralComments';
import { ReferralCustomField } from './ReferralCustomField';
import { PrimaryContactEditor } from '../Families/PrimaryContactEditor';

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
    !partneringFamily.partneringFamilyInfo.openReferral.arrangements?.some(arrangement =>
      !arrangement.endedAtUtc && !arrangement.cancelledAtUtc);

  const [closeReferralDialogOpen, setCloseReferralDialogOpen] = useState(false);
  const [openNewReferralDialogOpen, setOpenNewReferralDialogOpen] = useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] = useState(false);
  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  
  let requirementContext: ReferralContext | undefined;
  if (partneringFamily.partneringFamilyInfo?.openReferral) {
    requirementContext = {
      kind: "Referral",
      partneringFamilyId: familyId,
      referralId: partneringFamily.partneringFamilyInfo.openReferral.id!
    };
  }
  
  const [createArrangementDialogParameter, setCreateArrangementDialogParameter] = useState<ArrangementPolicy | null>(null);
  
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('sm'));
  const isWideScreen = useMediaQuery(theme.breakpoints.up('xl'));

  const navigate = useNavigate();

  const permissions = usePermissions();

  return (
    <Container maxWidth={false} sx={{paddingLeft: '12px'}}>
      <HeaderContent>
        <HeaderTitle>
          <IconButton color="inherit" onClick={() => navigate("..")} size="large">
            <ArrowBack />
          </IconButton>
          &nbsp;
          {partneringFamily?.family?.adults!.filter(adult => adult.item1!.id === partneringFamily!.family!.primaryFamilyContactPersonId)[0]?.item1?.lastName} Family
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
        <Button
          onClick={() => setAddNoteDialogOpen(true)}
          variant="contained"
          size="small"
          className={classes.button}
          startIcon={<AddCircleIcon />}>
          Note
        </Button>
        {/* <IconButton
          onClick={(event) => setFamilyMoreMenuAnchor(event.currentTarget)}>
          <MoreVertIcon />
        </IconButton> */}
        {uploadDocumentDialogOpen && <UploadFamilyDocumentsDialog family={partneringFamily}
          onClose={() => setUploadDocumentDialogOpen(false)} />}
        {addAdultDialogOpen && <AddAdultDialog onClose={() => setAddAdultDialogOpen(false)} />}
        {addChildDialogOpen && <AddChildDialog onClose={() => setAddChildDialogOpen(false)} />}
        {addNoteDialogOpen && <AddEditNoteDialog familyId={partneringFamily.family!.id!} onClose={() => setAddNoteDialogOpen(false)} />}
      </Toolbar>
      <Grid container spacing={0}>
        <Grid item container xs={12} md={4} spacing={0}>
          <Grid item xs={12}>
            <ActivityTimeline family={partneringFamily} />
          </Grid>
        </Grid>
        <Grid item xs={12} md={8}>
          <Grid container spacing={0}>
            <Grid item xs={12} md={4}>
              <PrimaryContactEditor family={partneringFamily} />
              <br />
              {partneringFamily.partneringFamilyInfo?.openReferral
                ? "Referral open since " + format(partneringFamily.partneringFamilyInfo.openReferral.openedAtUtc!, "M/d/yy")
                : "Referral closed - " + ReferralCloseReason[partneringFamily.partneringFamilyInfo?.closedReferrals?.[partneringFamily.partneringFamilyInfo.closedReferrals.length-1]?.closeReason!]
                //TODO: "Closed on " + format(partneringFamily.partneringFamilyInfo?.closedReferrals?.[0]?.closedUtc) -- needs a new calculated property
              }
              {(partneringFamily.partneringFamilyInfo!.closedReferrals?.length && (
                <>
                  <br />
                  {partneringFamily.partneringFamilyInfo!.closedReferrals?.map(referral => (
                    <p key={referral.id}>Previous referral closed {format(referral.closedAtUtc!, "M/d/yy")} - {ReferralCloseReason[referral.closeReason!]}</p>
                  ))}
                </>
              )) || null}
            </Grid>
            <Grid item xs={6} md={4}>
              {(partneringFamily.partneringFamilyInfo?.openReferral?.completedCustomFields ||
                [] as Array<CompletedCustomFieldInfo | string>).concat(
                partneringFamily.partneringFamilyInfo?.openReferral?.missingCustomFields || []).sort((a, b) =>
                  (a instanceof CompletedCustomFieldInfo ? a.customFieldName! : a) <
                  (b instanceof CompletedCustomFieldInfo ? b.customFieldName! : b) ? -1
                  : (a instanceof CompletedCustomFieldInfo ? a.customFieldName! : a) >
                  (b instanceof CompletedCustomFieldInfo ? b.customFieldName! : b) ? 1
                  : 0).map(customField =>
                <ReferralCustomField key={typeof customField === 'string' ? customField : customField.customFieldName}
                  partneringFamilyId={familyId} referralId={partneringFamily.partneringFamilyInfo!.openReferral!.id!}
                  customField={customField} />)}
            </Grid>
            <Grid item xs={6} md={4}>
              {canCloseReferral && <Button
                onClick={() => setCloseReferralDialogOpen(true)}
                variant="contained"
                size="small"
                className={classes.button}>
                Close Referral
              </Button>}
              {!partneringFamily.partneringFamilyInfo?.openReferral && <Button
                onClick={() => setOpenNewReferralDialogOpen(true)}
                variant="contained"
                size="small"
                className={classes.button}>
                Open New Referral
              </Button>}
              {closeReferralDialogOpen && partneringFamily.partneringFamilyInfo?.openReferral && (
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
          {partneringFamily.partneringFamilyInfo?.openReferral &&
            <Grid container spacing={0}>
              <ReferralComments partneringFamily={partneringFamily}
                referralId={partneringFamily.partneringFamilyInfo.openReferral.id!} />
            </Grid>}
          <Grid container spacing={0}>
            {partneringFamily.partneringFamilyInfo?.openReferral &&
              <>
                <Grid item xs={12} sm={6} md={4} style={{paddingRight: 20}}>
                  <h3 style={{ marginBottom: 0 }}>Incomplete</h3>
                  {partneringFamily.partneringFamilyInfo?.openReferral?.missingRequirements?.map((missing, i) =>
                    <MissingRequirementRow key={`${missing}:${i}`} requirement={missing} context={requirementContext!} />
                  )}
                </Grid>
                <Grid item xs={12} sm={6} md={4} style={{paddingRight: 20}}>
                  <h3 style={{ marginBottom: 0 }}>Completed</h3>
                  {partneringFamily.partneringFamilyInfo?.openReferral?.completedRequirements?.map((completed, i) =>
                    <CompletedRequirementRow key={`${completed.completedRequirementId}:${i}`} requirement={completed} context={requirementContext!} />
                  )}
                  {partneringFamily.partneringFamilyInfo?.openReferral?.exemptedRequirements?.map((exempted, i) =>
                    <ExemptedRequirementRow key={`${exempted.requirementName}:${i}`} requirement={exempted} context={requirementContext!} />
                  )}
                </Grid>
              </>}
            <Grid item xs={12} sm={6} md={4}>
              <h3 style={{ marginBottom: 0 }}>Documents</h3>
              <FamilyDocuments family={partneringFamily} />
            </Grid>
          </Grid>
          <Grid container spacing={0}>
            {partneringFamily.partneringFamilyInfo?.openReferral &&
              <Grid item xs={12}>
                <h3 style={{ marginBottom: 0 }}>Arrangements</h3>
                <Masonry columns={isDesktop ? isWideScreen ? 3 : 2 : 1} spacing={2}>
                  {partneringFamily.partneringFamilyInfo?.openReferral?.arrangements?.map(arrangement => (
                    <ArrangementCard key={arrangement.id}
                      partneringFamily={partneringFamily} referralId={partneringFamily.partneringFamilyInfo!.openReferral!.id!}
                      arrangement={arrangement} />
                  )) || false}
                  <Box sx={{textAlign: 'center'}}>
                    {partneringFamily.partneringFamilyInfo?.openReferral && policy.referralPolicy?.arrangementPolicies?.map(arrangementPolicy => (
                      <Box key={arrangementPolicy.arrangementType}>
                        <Button
                          onClick={() => setCreateArrangementDialogParameter(arrangementPolicy)}
                          variant="contained"
                          size="small"
                          className={classes.button}
                          startIcon={<AddCircleIcon />}>
                          {arrangementPolicy.arrangementType}
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Masonry>
                {createArrangementDialogParameter &&
                  <CreateArrangementDialog
                    referralId={partneringFamily.partneringFamilyInfo!.openReferral!.id!}
                    arrangementPolicy={createArrangementDialogParameter}
                    onClose={() => setCreateArrangementDialogParameter(null)} />}
              </Grid>}
            <Grid item xs={12}>
              <h3 style={{ marginBottom: 0 }}>Family Members</h3>
              <Masonry columns={isDesktop ? isWideScreen ? 3 : 2 : 1} spacing={2}>
                {partneringFamily.family?.adults?.map(adult => adult.item1 && adult.item1.id && adult.item1.active && adult.item2 && (
                  <PartneringAdultCard key={adult.item1.id} partneringFamilyId={familyId} personId={adult.item1.id} />
                ))}
                {partneringFamily.family?.children?.map(child => child.active && (
                  <PartneringChildCard key={child.id!} partneringFamilyId={familyId} personId={child.id!} />
                ))}
              </Masonry>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
