import {
  Card,
  CardHeader,
  IconButton,
  CardContent,
  Typography,
  Chip,
  Divider,
  ListItemText,
  Menu,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Badge,
  Grid
} from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import { useState } from "react";
import { Gender, Person, CombinedFamilyInfo, RoleRemovalReason, Permission } from "../../GeneratedClient";
import { AgeText } from "../AgeText";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useRecoilValue } from "recoil";
import { volunteerFamiliesData } from "../../Model/VolunteersModel";
import { ContactDisplay } from "../ContactDisplay";
import { IconRow } from "../IconRow";
import { VolunteerRoleApprovalStatusChip } from "./VolunteerRoleApprovalStatusChip";
import { RemoveIndividualRoleDialog } from "./RemoveIndividualRoleDialog";
import { ResetIndividualRoleDialog } from "./ResetIndividualRoleDialog";
import { usePermissions } from "../../Model/SessionModel";
import { MissingRequirementRow } from "../Requirements/MissingRequirementRow";
import { ExemptedRequirementRow } from "../Requirements/ExemptedRequirementRow";
import { CompletedRequirementRow } from "../Requirements/CompletedRequirementRow";
import { IndividualVolunteerContext } from "../Requirements/RequirementContext";
import { useDialogHandle } from "../../useDialogHandle";
import { EditAdultDialog } from "../Families/EditAdultDialog";
import { useCollapsed } from "../../useCollapsed";

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
    '&:last-child': {
      paddingBottom: 0
    }
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

  const volunteerFamily = volunteerFamilies.find(x => x.family?.id === volunteerFamilyId) as CombinedFamilyInfo;
  const adult = volunteerFamily.family?.adults?.find(x => x.item1?.id === personId);

  const requirementContext: IndividualVolunteerContext = {
    kind: "Individual Volunteer",
    volunteerFamilyId: volunteerFamilyId,
    personId: personId
  };

  const [collapsed, setCollapsed] = useCollapsed(`person-${volunteerFamilyId}-${personId}`, false);

  const editDialogHandle = useDialogHandle();
  
  const [adultMoreMenuAnchor, setAdultMoreMenuAnchor] = useState<{anchor: Element, adult: Person} | null>(null);
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
  
  const permissions = usePermissions();

  return <>{adult?.item1 && adult.item1.id && adult.item2 &&
    <Card variant="outlined" className={classes.card}>
      <CardHeader className={classes.cardHeader}
        title={<span>
          {adult.item1.firstName + " " + adult.item1.lastName}
        </span>}
        subheader={<>
          Adult, <AgeText age={adult.item1.age} />, {typeof(adult.item1.gender) === 'undefined' ? "" : Gender[adult.item1.gender] + ","} {adult.item1.ethnicity}
        </>}
        action={
          <>
            <IconButton
              onClick={editDialogHandle.openDialog}
              size="medium">
              <EditIcon color="primary" />
            </IconButton>
            <IconButton
              onClick={(event) => setAdultMoreMenuAnchor({anchor: event.currentTarget, adult: adult.item1 as Person})}
              size="large">
              <MoreVertIcon />
            </IconButton>
          </>} />
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
        <Typography variant="body2" component="div">
          <ContactDisplay person={adult.item1} />
        </Typography>
        <Accordion expanded={!collapsed} onChange={(event, isExpanded) => setCollapsed(!isExpanded)}
          variant="outlined" square disableGutters sx={{marginLeft:-2, marginRight:-2, border: 'none'}}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ marginTop:1, paddingTop:1, backgroundColor: "#0000000a" }}>
            <Grid container>
              <Grid item xs={3}>
                <Badge color="success"
                  badgeContent={volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].completedRequirements?.length}>
                  ✅
                </Badge>
              </Grid>
              <Grid item xs={3}>
                <Badge color="warning"
                  badgeContent={volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].exemptedRequirements?.length}>
                  🚫
                </Badge>
              </Grid>
              <Grid item xs={3}>
                <Badge color="error"
                  badgeContent={volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].missingRequirements?.length}>
                  ❌
                </Badge>
              </Grid>
              <Grid item xs={3}>
                <Badge color="info"
                  badgeContent={volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].availableApplications?.length}>
                  💤
                </Badge>
              </Grid>
            </Grid>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" component="div">
              {volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].completedRequirements?.map((completed, i) =>
                <CompletedRequirementRow key={`${completed.completedRequirementId}:${i}`} requirement={completed} context={requirementContext} />
              )}
              {volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].exemptedRequirements?.map((exempted, i) =>
                <ExemptedRequirementRow key={`${exempted.requirementName}:${i}`} requirement={exempted} context={requirementContext} />
              )}
              {volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].missingRequirements?.map((missing, i) =>
                <MissingRequirementRow key={`${missing}:${i}`} requirement={missing} context={requirementContext} />
              )}
              {volunteerFamily.volunteerFamilyInfo?.individualVolunteers?.[adult.item1.id].availableApplications?.map((application, i) =>
                <MissingRequirementRow key={`${application}:${i}`} requirement={application} context={requirementContext} isAvailableApplication={true} />
              )}
            </Typography>
          </AccordionDetails>
        </Accordion>
      </CardContent>
      <Menu id="adult-more-menu"
        anchorEl={adultMoreMenuAnchor?.anchor}
        keepMounted
        open={Boolean(adultMoreMenuAnchor)}
        onClose={() => setAdultMoreMenuAnchor(null)}>
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
      {(removeRoleParameter && <RemoveIndividualRoleDialog volunteerFamilyId={volunteerFamilyId} person={removeRoleParameter.person} role={removeRoleParameter.role}
        onClose={() => setRemoveRoleParameter(null)} />) || null}
      {(resetRoleParameter && <ResetIndividualRoleDialog volunteerFamilyId={volunteerFamilyId} person={resetRoleParameter.person} role={resetRoleParameter.role}
        removalReason={resetRoleParameter.removalReason} removalAdditionalComments={resetRoleParameter.removalAdditionalComments}
        onClose={() => setResetRoleParameter(null)} />) || null}
      {editDialogHandle.open && <EditAdultDialog handle={editDialogHandle} key={editDialogHandle.key}
        adult={adult} />}
    </Card>}</>;
}
