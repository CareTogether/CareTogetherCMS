import { Card, CardHeader, IconButton, CardContent, Typography, CardActions, makeStyles, ListItemText, Menu, MenuItem } from "@material-ui/core";
import { useState } from "react";
import { CustodialRelationshipType, Gender, Person, VolunteerFamily } from "../GeneratedClient";
import { AgeText } from "./AgeText";
import MoreVertIcon from '@material-ui/icons/MoreVert';
import { useRecoilValue } from "recoil";
import { volunteerFamiliesData } from "../Model/VolunteerFamiliesModel";

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

type VolunteerChildCardProps = {
  volunteerFamilyId: string,
  personId: string
}

export function VolunteerChildCard({volunteerFamilyId, personId}: VolunteerChildCardProps) {
  const classes = useStyles();

  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);

  const volunteerFamily = volunteerFamilies.find(x => x.family?.id === volunteerFamilyId) as VolunteerFamily;
  const child = volunteerFamily.family?.children?.find(x => x.id === personId);

  const [childMoreMenuAnchor, setChildMoreMenuAnchor] = useState<{anchor: Element, child: Person} | null>(null);
  function selectChangeName(child: Person) {
    setChildMoreMenuAnchor(null);
    //TODO: Rename...
  }

  return (<>{child &&
    <Card className={classes.card}>
      <CardHeader className={classes.cardHeader}
        title={child.firstName + " " + child.lastName}
        subheader={<>
          Child, <AgeText age={child.age} />, {typeof(child.gender) === 'undefined' ? "" : Gender[child.gender] + ","} {child.ethnicity}
        </>}
        action={
          <IconButton
            onClick={(event) => setChildMoreMenuAnchor({anchor: event.currentTarget, child: child})}>
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
            {volunteerFamily.family?.custodialRelationships?.filter(relationship => relationship.childId === child.id)?.map(relationship => (
              <li key={relationship.personId}>
                {volunteerFamily.family?.adults?.filter(x => x.item1?.id === relationship.personId)[0].item1?.firstName}:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
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
      </Menu>
    </Card>}</>);
}
