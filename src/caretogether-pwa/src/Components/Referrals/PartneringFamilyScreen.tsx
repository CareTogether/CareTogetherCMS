import { Container, Toolbar, Grid, Button, useMediaQuery, useTheme, IconButton } from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import { ArrangementPolicy, ChildLocationPlan, CombinedFamilyInfo, CompletedCustomFieldInfo, CustomFieldType, Permission, ReferralCloseReason } from '../../GeneratedClient';
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
import { PersonName } from '../Families/PersonName';
import { format } from 'date-fns';
import { NoteCard } from '../Families/NoteCard';
import { UploadFamilyDocumentDialog } from '../Families/UploadFamilyDocumentDialog';
import { policyData } from '../../Model/ConfigurationModel';
import { CreateArrangementDialog } from './CreateArrangementDialog';
import { CloseReferralDialog } from './CloseReferralDialog';
import { OpenNewReferralDialog } from './OpenNewReferralDialog';
import { CustomReferralFieldDialog } from './CustomReferralFieldDialog';
import { FamilyDocuments } from '../Families/FamilyDocuments';
import { HeaderContent, HeaderTitle } from '../Header';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../Model/SessionModel';
import { Masonry, Timeline, TimelineConnector, TimelineContent, TimelineDot, TimelineItem, TimelineOppositeContent, TimelineSeparator } from '@mui/lab';
import { MissingRequirementRow } from "../Requirements/MissingRequirementRow";
import { ExemptedRequirementRow } from "../Requirements/ExemptedRequirementRow";
import { CompletedRequirementRow } from "../Requirements/CompletedRequirementRow";
import { ReferralContext } from "../Requirements/RequirementContext";
import { FamilyName } from '../Families/FamilyName';

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

  const [closeReferralDialogOpen, setCloseReferralDialogOpen] = useState(false);
  const [openNewReferralDialogOpen, setOpenNewReferralDialogOpen] = useState(false);
  const [uploadDocumentDialogOpen, setUploadDocumentDialogOpen] = useState(false);
  const [addAdultDialogOpen, setAddAdultDialogOpen] = useState(false);
  const [addChildDialogOpen, setAddChildDialogOpen] = useState(false);
  const [addNoteDialogOpen, setAddNoteDialogOpen] = useState(false);
  
  const [customFieldDialogParameter, setCustomFieldDialogParameter] = useState<string | CompletedCustomFieldInfo | null>(null);

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
    <Container maxWidth={false}>
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
        {uploadDocumentDialogOpen && <UploadFamilyDocumentDialog family={partneringFamily}
          onClose={() => setUploadDocumentDialogOpen(false)} />}
        {addAdultDialogOpen && <AddAdultDialog onClose={() => setAddAdultDialogOpen(false)} />}
        {addChildDialogOpen && <AddChildDialog onClose={() => setAddChildDialogOpen(false)} />}
        {addNoteDialogOpen && <AddEditNoteDialog familyId={partneringFamily.family!.id!} onClose={() => setAddNoteDialogOpen(false)} />}
      </Toolbar>
      <Grid container spacing={0}>
        <Grid item container xs={12} md={4} spacing={2}>
          <Grid item xs={12}>
            <Timeline position="right">
              {partneringFamily.partneringFamilyInfo?.history?.slice().reverse().map((activity, i) =>
                <TimelineItem key={i}>
                  <TimelineOppositeContent>
                    {format(activity.timestampUtc!, "M/d/yy h:mm a")}
                  </TimelineOppositeContent>
                  <TimelineSeparator>
                    <TimelineDot color={i === 0 ? "secondary" : "primary"} />
                    <TimelineConnector />
                  </TimelineSeparator>
                  <TimelineContent>
                    {JSON.stringify(activity)}
                    {/* <FamilyName family={familyLookup(historyEntry.childLocationFamilyId)} />
                    <br />
                    <span style={{fontStyle: "italic"}}>
                      {historyEntry.plan === ChildLocationPlan.DaytimeChildCare ? "daytime child care"
                      : historyEntry.plan === ChildLocationPlan.OvernightHousing ? "overnight housing"
                      : "with parent"}
                    </span> */}
                  </TimelineContent>
                </TimelineItem>
              )}
            </Timeline>
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
                    variant="contained"
                    size="small"
                    className={classes.button}>
                    Edit…
                  </Button>
                </p>
              ))}
              {partneringFamily.partneringFamilyInfo?.openReferral?.missingCustomFields?.map(missingField => (
                <p key={missingField}>
                  {missingField}: ❓&nbsp;
                  <Button
                    onClick={() => setCustomFieldDialogParameter(missingField)}
                    variant="contained"
                    size="small"
                    className={classes.button}>
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
          <Grid item xs={12} sm={6} md={4} style={{paddingRight: 20}}>
            <h3>Incomplete</h3>
            {partneringFamily.partneringFamilyInfo?.openReferral?.missingRequirements?.map((missing, i) =>
              <MissingRequirementRow key={`${missing}:${i}`} requirement={missing} context={requirementContext!} />
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={4} style={{paddingRight: 20}}>
            <h3>Completed</h3>
            {partneringFamily.partneringFamilyInfo?.openReferral?.completedRequirements?.map((completed, i) =>
              <CompletedRequirementRow key={`${completed.completedRequirementId}:${i}`} requirement={completed} context={requirementContext!} />
            )}
            {partneringFamily.partneringFamilyInfo?.openReferral?.exemptedRequirements?.map((exempted, i) =>
              <ExemptedRequirementRow key={`${exempted.requirementName}:${i}`} requirement={exempted} context={requirementContext!} />
            )}
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <h3>Documents</h3>
            <FamilyDocuments family={partneringFamily} />
          </Grid>
          <Grid item xs={12}>
            <Masonry columns={isDesktop ? isWideScreen ? 3 : 2 : 1} spacing={2}>
              {partneringFamily.partneringFamilyInfo?.openReferral?.arrangements?.map(arrangement => (
                <ArrangementCard key={arrangement.id}
                  partneringFamily={partneringFamily} referralId={partneringFamily.partneringFamilyInfo!.openReferral!.id!}
                  arrangement={arrangement} />
              )) || false}
            </Masonry>
            {partneringFamily.partneringFamilyInfo?.openReferral && policy.referralPolicy?.arrangementPolicies?.map(arrangementPolicy => (
              <Grid item key={arrangementPolicy.arrangementType}>
                <Button
                  onClick={() => setCreateArrangementDialogParameter(arrangementPolicy)}
                  variant="contained"
                  size="small"
                  className={classes.button}
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
          <Grid item xs={12}>
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
    </Container>
  );
}
