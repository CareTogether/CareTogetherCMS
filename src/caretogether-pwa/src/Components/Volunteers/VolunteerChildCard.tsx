import {
  Card,
  CardHeader,
  IconButton,
  CardContent,
  Typography,
} from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import { CustodialRelationshipType, Gender, CombinedFamilyInfo, Permission } from "../../GeneratedClient";
import { AgeText } from "../AgeText";
import EditIcon from '@mui/icons-material/Edit';
import { useRecoilValue } from "recoil";
import { volunteerFamiliesData } from "../../Model/VolunteersModel";
import { useDialogHandle } from "../../useDialogHandle";
import { EditChildDialog } from "../Families/EditChildDialog";
import { usePermissions } from "../../Model/SessionModel";

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
  }
}));

type VolunteerChildCardProps = {
  volunteerFamilyId: string,
  personId: string
}

export function VolunteerChildCard({volunteerFamilyId, personId}: VolunteerChildCardProps) {
  const classes = useStyles();

  const volunteerFamilies = useRecoilValue(volunteerFamiliesData);

  const volunteerFamily = volunteerFamilies.find(x => x.family?.id === volunteerFamilyId) as CombinedFamilyInfo;
  const child = volunteerFamily.family?.children?.find(x => x.id === personId);

  const editDialogHandle = useDialogHandle();

  const permissions = usePermissions();

  return <>{child &&
    <Card variant="outlined" className={classes.card}>
      <CardHeader className={classes.cardHeader}
        title={child.firstName + " " + child.lastName}
        subheader={<>
          Child, <AgeText age={child.age} />, {typeof(child.gender) === 'undefined' ? "" : Gender[child.gender] + ","} {child.ethnicity}
        </>}
        action={permissions(Permission.EditFamilyInfo) &&
          <IconButton
            onClick={editDialogHandle.openDialog}
            size="medium">
            <EditIcon color="primary" />
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
                  ? "parent with custody"
                  : relationship.type === CustodialRelationshipType.ParentWithCourtAppointedCustody
                  ? "parent with court-appointed sole custody"
                  : null}</span>
              </li>
            ))}
          </ul>
        </Typography>
      </CardContent>
      {editDialogHandle.open && <EditChildDialog handle={editDialogHandle} key={editDialogHandle.key}
        child={child} familyAdults={volunteerFamily.family!.adults!.map(a => a.item1!)}
        custodialRelationships={volunteerFamily.family!.custodialRelationships} />}
    </Card>}</>;
}
