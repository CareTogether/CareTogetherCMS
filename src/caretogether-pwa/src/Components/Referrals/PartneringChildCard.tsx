import {
  Card,
  CardHeader,
  IconButton,
  CardContent,
  Typography,
  CardActions,
  Menu,
  ListItemText,
  MenuItem,
} from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import { useState } from "react";
import { CustodialRelationshipType, Gender, Person, CombinedFamilyInfo } from "../../GeneratedClient";
import { AgeText } from "../AgeText";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRecoilValue } from "recoil";
import { partneringFamiliesData } from "../../Model/ReferralsModel";
import { RenamePersonDialog } from "../Families/RenamePersonDialog";
import { UpdateConcernsDialog } from "../Families/UpdateConcernsDialog";
import { UpdateNotesDialog } from "../Families/UpdateNotesDialog";
import { DeletePersonDialog } from "../Families/DeletePersonDialog";

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

type PartneringChildCardProps = {
  partneringFamilyId: string,
  personId: string
}

export function PartneringChildCard({partneringFamilyId, personId}: PartneringChildCardProps) {
  const classes = useStyles();

  const partneringFamilies = useRecoilValue(partneringFamiliesData);

  const partneringFamily = partneringFamilies.find(x => x.family?.id === partneringFamilyId) as CombinedFamilyInfo;
  const child = partneringFamily.family?.children?.find(x => x.id === personId);

  const [childMoreMenuAnchor, setChildMoreMenuAnchor] = useState<{anchor: Element, child: Person} | null>(null);
  const [renamePersonParameter, setRenamePersonParameter] = useState<{partneringFamilyId: string, person: Person} | null>(null);
  function selectChangeName(child: Person) {
    setChildMoreMenuAnchor(null);
    setRenamePersonParameter({partneringFamilyId, person: child});
  }
  const [deleteParameter, setDeleteParameter] = useState<{familyId: string, person: Person} | null>(null);
  function selectDelete(child: Person) {
    setChildMoreMenuAnchor(null);
    setDeleteParameter({familyId: partneringFamilyId, person: child});
  }
  const [updateConcernsParameter, setUpdateConcernsParameter] = useState<{partneringFamilyId: string, person: Person} | null>(null);
  function selectUpdateConcerns(child: Person) {
    setChildMoreMenuAnchor(null);
    setUpdateConcernsParameter({partneringFamilyId, person: child});
  }
  const [updateNotesParameter, setUpdateNotesParameter] = useState<{partneringFamilyId: string, person: Person} | null>(null);
  function selectUpdateNotes(child: Person) {
    setChildMoreMenuAnchor(null);
    setUpdateNotesParameter({partneringFamilyId, person: child});
  }

  return <>{child &&
    <Card className={classes.card}>
      <CardHeader className={classes.cardHeader}
        title={child.firstName + " " + child.lastName}
        subheader={<>
          Child, <AgeText age={child.age} />, {typeof(child.gender) === 'undefined' ? "" : Gender[child.gender] + ","} {child.ethnicity}
        </>}
        action={
          <IconButton
            onClick={(event) => setChildMoreMenuAnchor({anchor: event.currentTarget, child: child})}
            size="large">
            <MoreVertIcon />
          </IconButton>} />
      <CardContent className={classes.cardContent}>
        <Typography variant="body2" component="div">
          {child.concerns && <><strong>⚠&nbsp;&nbsp;&nbsp;{child.concerns}</strong></>}
          {child.concerns && child.notes && <br />}
          {child.notes && <>📝&nbsp;{child.notes}</>}
        </Typography>
        <Typography variant="body2" component="div">
          <ul className={classes.cardList}>
            {partneringFamily.family?.custodialRelationships?.filter(relationship => relationship.childId === child.id)?.map(relationship => (
              <li key={relationship.personId}>
                {partneringFamily.family?.adults?.filter(x => x.item1?.id === relationship.personId)[0].item1?.firstName}:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span style={{float:'right'}}>{relationship.type === CustodialRelationshipType.LegalGuardian
                  ? "legal guardian"
                  : relationship.type === CustodialRelationshipType.ParentWithCustody
                  ? "parent (with joint custody)"
                  : relationship.type === CustodialRelationshipType.ParentWithCourtAppointedCustody
                  ? "parent with court-appointed sole custody"
                  : null}</span>
              </li>
            ))}
          </ul>
        </Typography>
      </CardContent>
      <CardActions>
      </CardActions>
      <Menu id="child-more-menu"
        anchorEl={childMoreMenuAnchor?.anchor}
        keepMounted
        open={Boolean(childMoreMenuAnchor)}
        onClose={() => setChildMoreMenuAnchor(null)}>
        <MenuItem onClick={() => childMoreMenuAnchor?.child && selectChangeName(childMoreMenuAnchor.child)}>
          <ListItemText primary="Change name" />
        </MenuItem>
        <MenuItem onClick={() => childMoreMenuAnchor?.child && selectDelete(childMoreMenuAnchor.child)}>
          <ListItemText primary="Delete" />
        </MenuItem>
        <MenuItem onClick={() => childMoreMenuAnchor?.child && selectUpdateConcerns(childMoreMenuAnchor.child)}>
          <ListItemText primary="Update concerns" />
        </MenuItem>
        <MenuItem onClick={() => childMoreMenuAnchor?.child && selectUpdateNotes(childMoreMenuAnchor.child)}>
          <ListItemText primary="Update notes" />
        </MenuItem>
      </Menu>
      {(renamePersonParameter && <RenamePersonDialog familyId={partneringFamilyId} person={renamePersonParameter.person}
        onClose={() => setRenamePersonParameter(null)} />) || null}
      {(deleteParameter && <DeletePersonDialog familyId={deleteParameter.familyId} person={deleteParameter.person}
        onClose={() => setDeleteParameter(null)} />) || null}
      {(updateConcernsParameter && <UpdateConcernsDialog familyId={partneringFamilyId} person={updateConcernsParameter.person}
        onClose={() => setUpdateConcernsParameter(null)} />) || null}
      {(updateNotesParameter && <UpdateNotesDialog familyId={partneringFamilyId} person={updateNotesParameter.person}
        onClose={() => setUpdateNotesParameter(null)} />) || null}
    </Card>}</>;
}
