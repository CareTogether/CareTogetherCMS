import {
  Card,
  CardHeader,
  IconButton,
  CardContent,
  Typography,
  Chip,
  Divider
} from "@mui/material";
import makeStyles from '@mui/styles/makeStyles';
import { Gender, CombinedFamilyInfo, Permission } from "../../GeneratedClient";
import { AgeText } from "../AgeText";
import EditIcon from '@mui/icons-material/Edit';
import { useRecoilValue } from "recoil";
import { partneringFamiliesData } from "../../Model/ReferralsModel";
import { ContactDisplay } from "../ContactDisplay";
import { IconRow } from "../IconRow";
import { useDialogHandle } from "../../useDialogHandle";
import { EditAdultDialog } from "../Families/EditAdultDialog";
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
  },
  rightCardAction: {
    marginLeft: 'auto !important'
  }
}));

type PartneringAdultCardProps = {
  partneringFamilyId: string,
  personId: string
}

export function PartneringAdultCard({partneringFamilyId, personId}: PartneringAdultCardProps) {
  const classes = useStyles();

  const partneringFamilies = useRecoilValue(partneringFamiliesData);

  const partneringFamily = partneringFamilies.find(x => x.family?.id === partneringFamilyId) as CombinedFamilyInfo;
  const adult = partneringFamily.family?.adults?.find(x => x.item1?.id === personId);

  const editDialogHandle = useDialogHandle();

  const permissions = usePermissions();

  return <>{adult?.item1 && adult.item1.id && adult.item2 &&
    <Card variant="outlined" className={classes.card}>
      <CardHeader className={classes.cardHeader}
        title={adult.item1.firstName + " " + adult.item1.lastName}
        subheader={<>
          Adult, <AgeText age={adult.item1.age} />, {typeof(adult.item1.gender) === 'undefined' ? "" : Gender[adult.item1.gender] + ","} {adult.item1.ethnicity}
        </>}
        action={permissions(Permission.EditFamilyInfo) &&
          <IconButton
            onClick={editDialogHandle.openDialog}
            size="medium">
            <EditIcon color="primary" />
          </IconButton>} />
      <CardContent className={classes.cardContent}>
        <Typography color="textSecondary" className={classes.sectionChips} component="div">
          {(adult.item2.relationshipToFamily && <Chip size="small" label={adult.item2.relationshipToFamily} />) || null}
          {adult.item2.isInHousehold && <Chip size="small" label="In Household" />}
        </Typography>
        <Typography variant="body2" component="div">
          {adult.item1.concerns && <IconRow icon='⚠'><strong>{adult.item1.concerns}</strong></IconRow>}
          {adult.item1.notes && <IconRow icon='📝'>{adult.item1.notes}</IconRow>}
        </Typography>
        <Divider />
        <Typography variant="body2" component="div">
          <ContactDisplay person={adult.item1} />
        </Typography>
      </CardContent>
      {editDialogHandle.open && <EditAdultDialog handle={editDialogHandle} key={editDialogHandle.key}
        adult={adult} />}
    </Card>}</>;
}
