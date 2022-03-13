import {
  Card,
  CardHeader,
  IconButton,
  CardContent,
  Typography,
  Chip,
  CardActions,
  Divider,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import { useState } from "react";
import { ActionRequirement, Gender, Person, CombinedFamilyInfo, RoleRemovalReason, CompletedRequirementInfo, ExemptedRequirementInfo, Permission } from "../../GeneratedClient";
import { AgeText } from "../AgeText";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { useRecoilValue } from "recoil";
import { volunteerFamiliesData } from "../../Model/VolunteersModel";
import { RecordVolunteerAdultStepDialog } from "./RecordVolunteerAdultStepDialog";
import { policyData } from '../../Model/ConfigurationModel';
import { RenamePersonDialog } from "../Families/RenamePersonDialog";
import { UpdateConcernsDialog } from "../Families/UpdateConcernsDialog";
import { UpdateNotesDialog } from "../Families/UpdateNotesDialog";
import { ContactDisplay } from "../ContactDisplay";
import { IconRow } from "../IconRow";
import { VolunteerRoleApprovalStatusChip } from "./VolunteerRoleApprovalStatusChip";
import { UpdatePhoneDialog } from "../Families/UpdatePhoneDialog";
import { UpdateEmailDialog } from "../Families/UpdateEmailDialog";
import { UpdateAddressDialog } from "../Families/UpdateAddressDialog";
import { RemoveIndividualRoleDialog } from "./RemoveIndividualRoleDialog";
import { ResetIndividualRoleDialog } from "./ResetIndividualRoleDialog";
import { DeletePersonDialog } from "../Families/DeletePersonDialog";
import { ExemptVolunteerRequirementDialog } from "./ExemptVolunteerRequirementDialog";
import { usePermissions } from "../../Model/SessionModel";
import { IndividualVolunteerContext, RequirementRow } from "../Requirements/RequirementRow";

const useStyles = makeStyles((theme) => ({
  sectionChips: {
    '& > div:first-child': {
      marginLeft: 0
    },
    '& > *': {
      margin: theme.spacing(0.5),
    }
  },
  card: {
    minWidth: 275,
  },
  cardHeader: {
    paddingBottom: 0
  },
  cardContent: {
    paddingTop: 8,
    paddingBottom: 8,
    maxWidth: 500
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

type VolunteerAdultCardProps = {
  volunteerFamilyId: string,
  personId: string
}

export function VolunteerAdultCard({volunteerFamilyId, personId}: VolunteerAdultCardProps) {
  const classes = useStyles();

  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);
  const policy = useRecoilValue(policyData);

  const volunteerFamily = volunteerFamilies.find(x => x.family?.id === volunteerFamilyId) as CombinedFamilyInfo;
  const adult = volunteerFamily.family?.adults?.find(x => x.item1?.id === personId);

  const [adultRecordMenuAnchor, setAdultRecordMenuAnchor] = useState<{anchor: Element, adult: Person} | null>(null);
  const [recordAdultStepParameter, setRecordAdultStepParameter] = useState<{requirementName: string, requirementInfo: ActionRequirement, adult: Person} | null>(null);
  function selectRecordAdultStep(requirementName: string, adult: Person) {
    setAdultRecordMenuAnchor(null);
    const requirementInfo = policy.actionDefinitions![requirementName];
    setRecordAdultStepParameter({requirementName, requirementInfo, adult});
  }
  
  const [requirementMoreMenuAnchor, setRequirementMoreMenuAnchor] = useState<{anchor: Element, requirement: string | CompletedRequirementInfo | ExemptedRequirementInfo} | null>(null);
  const [exemptParameter, setExemptParameter] = useState<{requirementName: string} | null>(null);
  function selectExempt(requirementName: string) {
    setRequirementMoreMenuAnchor(null);
    setExemptParameter({requirementName: requirementName});
  }

  const requirementContext: IndividualVolunteerContext = {
    kind: "Individual Volunteer",
    volunteerFamilyId: volunteerFamilyId,
    personId: personId
  };

  const [adultMoreMenuAnchor, setAdultMoreMenuAnchor] = useState<{anchor: Element, adult: Person} | null>(null);
  const [renamePersonParameter, setRenamePersonParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectChangeName(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setRenamePersonParameter({volunteerFamilyId, person: adult});
  }
  const [deleteParameter, setDeleteParameter] = useState<{familyId: string, person: Person} | null>(null);
  function selectDelete(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setDeleteParameter({familyId: volunteerFamilyId, person: adult});
  }
  const [updateConcernsParameter, setUpdateConcernsParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectUpdateConcerns(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setUpdateConcernsParameter({volunteerFamilyId, person: adult});
  }
  const [updateNotesParameter, setUpdateNotesParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectUpdateNotes(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setUpdateNotesParameter({volunteerFamilyId, person: adult});
  }
  const [updatePhoneParameter, setUpdatePhoneParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectUpdatePhone(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setUpdatePhoneParameter({volunteerFamilyId, person: adult});
  }
  const [updateEmailParameter, setUpdateEmailParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectUpdateEmail(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setUpdateEmailParameter({volunteerFamilyId, person: adult});
  }
  const [updateAddressParameter, setUpdateAddressParameter] = useState<{volunteerFamilyId: string, person: Person} | null>(null);
  function selectUpdateAddress(adult: Person) {
    setAdultMoreMenuAnchor(null);
    setUpdateAddressParameter({volunteerFamilyId, person: adult});
  }
  const [removeRoleParameter, setRemoveRoleParameter] = useState<{volunteerFamilyId: string, person: Person, role: string} | null>(null);
  function selectRemoveRole(adult: Person, role: string) {
    setAdultMoreMenuAnchor(null);
    setRemoveRoleParameter({volunteerFamilyId, person: adult, role: role});
  }
  const [resetRoleParameter, setResetRoleParameter] = useState<{volunteerFamilyId: string, person: Person, role: string, removalReason: RoleRemovalReason, removalAdditionalComments: string} | null>(null);
  function selectResetRole(adult: Person, role: string, removalReason: RoleRemovalReason, removalAdditionalComments: string) {
    setAdultMoreMenuAnchor(null);
    setResetRoleParameter({volunteerFamilyId, person: adult, role: role, removalReason: removalReason, removalAdditionalComments: removalAdditionalComments});
  }
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.up('sm'));

  const permissions = usePermissions();

  return <>{adult?.item1 && adult.item1.id && adult.item2 &&
    <Card variant="outlined" className={classes.card}>
      <CardHeader className={classes.cardHeader}
        title={adult.item1.firstName + " " + adult.item1.lastName}
        subheader={<>
          Adult, <AgeText age={adult.item1.age} />, {typeof(adult.item1.gender) === 'undefined' ? "" : Gender[adult.item1.gender] + ","} {adult.item1.ethnicity}
        </>}
        action={
          <IconButton
            onClick={(event) => setAdultMoreMenuAnchor({anchor: event.currentTarget, adult: adult.item1 as Person})}
            size="large">
            <MoreVertIcon />
          </IconButton>} />
      <CardContent className={classes.cardContent}>
        <Typography color="textSecondary" className={classes.sectionChips} component="div">
          {Object.entries(volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].individualRoleApprovals || {}).map(([role, roleVersionApprovals]) =>
            <VolunteerRoleApprovalStatusChip key={role} roleName={role} roleVersionApprovals={roleVersionApprovals} />)}
          {(volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[personId]?.removedRoles || []).map(removedRole =>
            <Chip key={removedRole.roleName} size="small" label={`${removedRole.roleName} - ${RoleRemovalReason[removedRole.reason!]} - ${removedRole.additionalComments}`} />)}
          {(adult.item2.relationshipToFamily && <Chip size="small" label={adult.item2.relationshipToFamily} />) || null}
          {adult.item2.isInHousehold && <Chip size="small" label="In Household" />}
        </Typography>
        <Typography variant="body2" component="div">
          {adult.item1.concerns && <IconRow icon='⚠'><strong>{adult.item1.concerns}</strong></IconRow>}
          {adult.item1.notes && <IconRow icon='📝'>{adult.item1.notes}</IconRow>}
        </Typography>
        <Divider />
        <Typography variant="body2" component="div">
          {volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].completedRequirements?.map((completed, i) => (
            <RequirementRow key={`${completed.completedRequirementId}:${i}`} requirement={completed} context={requirementContext} />
          ))}
          {volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].exemptedRequirements?.map((exempted, i) => (
            <RequirementRow key={`${exempted.requirementName}:${i}`} requirement={exempted} context={requirementContext} />
          ))}
          {volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].missingRequirements?.map((missing, i) => (
            <RequirementRow key={`${missing}:${i}`} requirement={missing} context={requirementContext} />
          ))}
          <Menu id="volunteer-requirement-more-menu"
            anchorEl={requirementMoreMenuAnchor?.anchor}
            keepMounted
            open={Boolean(requirementMoreMenuAnchor)}
            onClose={() => setRequirementMoreMenuAnchor(null)}>
            { (typeof requirementMoreMenuAnchor?.requirement === 'string') && permissions(Permission.EditApprovalRequirementExemption) &&
              <MenuItem onClick={() => selectExempt(requirementMoreMenuAnchor?.requirement as string)}>Exempt</MenuItem>
              }
          </Menu>
          {(exemptParameter && <ExemptVolunteerRequirementDialog volunteerFamilyId={volunteerFamilyId} personId={personId} requirementName={exemptParameter.requirementName}
            onClose={() => setExemptParameter(null)} />) || null}
        </Typography>
        <Divider />
        <Typography variant="body2" component="div">
          <ContactDisplay person={adult.item1} />
        </Typography>
      </CardContent>
      <CardActions>
        {permissions(Permission.EditApprovalRequirementCompletion) && <IconButton size="small" className={classes.rightCardAction}
          onClick={(event) => setAdultRecordMenuAnchor({anchor: event.currentTarget, adult: adult.item1 as Person})}>
          <AssignmentTurnedInIcon />
        </IconButton>}
      </CardActions>
      <Menu id="adult-record-menu"
        anchorEl={adultRecordMenuAnchor?.anchor}
        keepMounted
        open={Boolean(adultRecordMenuAnchor)}
        onClose={() => setAdultRecordMenuAnchor(null)}>
        <MenuList dense={isMobile}>
          {volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].missingRequirements?.map(missingRequirementName =>
            <MenuItem key={missingRequirementName} onClick={() =>
              adultRecordMenuAnchor?.adult && selectRecordAdultStep(missingRequirementName, adultRecordMenuAnchor.adult)}>
              <ListItemText primary={missingRequirementName} />
            </MenuItem>
          )}
          <Divider />
          {volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].availableApplications?.map(requirementName =>
            <MenuItem key={requirementName} onClick={() =>
              adultRecordMenuAnchor?.adult && selectRecordAdultStep(requirementName, adultRecordMenuAnchor.adult)}>
              <ListItemText primary={requirementName} />
            </MenuItem>
          )}
        </MenuList>
      </Menu>
      {(recordAdultStepParameter && <RecordVolunteerAdultStepDialog volunteerFamily={volunteerFamily} adult={recordAdultStepParameter.adult}
        requirementName={recordAdultStepParameter.requirementName} stepActionRequirement={recordAdultStepParameter.requirementInfo}
        onClose={() => setRecordAdultStepParameter(null)} />) || null}
      <Menu id="adult-more-menu"
        anchorEl={adultMoreMenuAnchor?.anchor}
        keepMounted
        open={Boolean(adultMoreMenuAnchor)}
        onClose={() => setAdultMoreMenuAnchor(null)}>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectChangeName(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Change name" />
        </MenuItem>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectDelete(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Delete" />
        </MenuItem>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectUpdateConcerns(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Update concerns" />
        </MenuItem>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectUpdateNotes(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Update notes" />
        </MenuItem>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectUpdatePhone(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Update phone" />
        </MenuItem>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectUpdateEmail(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Update email" />
        </MenuItem>
        <MenuItem onClick={() => adultMoreMenuAnchor?.adult && selectUpdateAddress(adultMoreMenuAnchor.adult)}>
          <ListItemText primary="Update address" />
        </MenuItem>
        {permissions(Permission.EditVolunteerRoleParticipation) &&
          (Object.entries(volunteerFamily.volunteerFamilyInfo?.familyRoleApprovals || {}).length > 0 ||
          Object.entries(volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[personId]?.individualRoleApprovals || {}).length > 0 ||
          (volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[personId]?.removedRoles || []).length > 0) && <Divider />}
        {permissions(Permission.EditVolunteerRoleParticipation) &&
          Object.entries(volunteerFamily.volunteerFamilyInfo?.familyRoleApprovals || {}).filter(([role, ]) =>
          !volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[personId]?.removedRoles?.find(x => x.roleName === role)).flatMap(([role, ]) => (
          <MenuItem key={role} onClick={() => adultMoreMenuAnchor?.adult && selectRemoveRole(adultMoreMenuAnchor.adult, role)}>
            <ListItemText primary={`Remove from ${role} role`} />
          </MenuItem>
        ))}
        {permissions(Permission.EditVolunteerRoleParticipation) &&
          Object.entries(volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[personId]?.individualRoleApprovals || {}).filter(([role, ]) =>
          !volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[personId]?.removedRoles?.find(x => x.roleName === role)).flatMap(([role, ]) => (
          <MenuItem key={role} onClick={() => adultMoreMenuAnchor?.adult && selectRemoveRole(adultMoreMenuAnchor.adult, role)}>
            <ListItemText primary={`Remove from ${role} role`} />
          </MenuItem>
        ))}
        {permissions(Permission.EditVolunteerRoleParticipation) &&
          (volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[personId]?.removedRoles || []).map(removedRole => (
          <MenuItem key={removedRole.roleName}
            onClick={() => adultMoreMenuAnchor?.adult && selectResetRole(adultMoreMenuAnchor.adult, removedRole.roleName!, removedRole.reason!, removedRole.additionalComments!)}>
            <ListItemText primary={`Reset ${removedRole.roleName} participation`} />
          </MenuItem>
        ))}
      </Menu>
      {(renamePersonParameter && <RenamePersonDialog familyId={volunteerFamilyId} person={renamePersonParameter.person}
        onClose={() => setRenamePersonParameter(null)} />) || null}
      {(deleteParameter && <DeletePersonDialog familyId={deleteParameter.familyId} person={deleteParameter.person}
        onClose={() => setDeleteParameter(null)} />) || null}
      {(updateConcernsParameter && <UpdateConcernsDialog familyId={volunteerFamilyId} person={updateConcernsParameter.person}
        onClose={() => setUpdateConcernsParameter(null)} />) || null}
      {(updateNotesParameter && <UpdateNotesDialog familyId={volunteerFamilyId} person={updateNotesParameter.person}
        onClose={() => setUpdateNotesParameter(null)} />) || null}
      {(updatePhoneParameter && <UpdatePhoneDialog familyId={volunteerFamilyId} person={updatePhoneParameter.person}
        onClose={() => setUpdatePhoneParameter(null)} />) || null}
      {(updateEmailParameter && <UpdateEmailDialog familyId={volunteerFamilyId} person={updateEmailParameter.person}
        onClose={() => setUpdateEmailParameter(null)} />) || null}
      {(updateAddressParameter && <UpdateAddressDialog familyId={volunteerFamilyId} person={updateAddressParameter.person}
        onClose={() => setUpdateAddressParameter(null)} />) || null}
      {(removeRoleParameter && <RemoveIndividualRoleDialog volunteerFamilyId={volunteerFamilyId} person={removeRoleParameter.person} role={removeRoleParameter.role}
        onClose={() => setRemoveRoleParameter(null)} />) || null}
      {(resetRoleParameter && <ResetIndividualRoleDialog volunteerFamilyId={volunteerFamilyId} person={resetRoleParameter.person} role={resetRoleParameter.role}
        removalReason={resetRoleParameter.removalReason} removalAdditionalComments={resetRoleParameter.removalAdditionalComments}
        onClose={() => setResetRoleParameter(null)} />) || null}
    </Card>}</>;
}
