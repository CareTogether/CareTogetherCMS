import {
  Card,
  CardHeader,
  IconButton,
  CardContent,
  Typography,
  Chip,
  Divider
} from "@mui/material";
import { Gender, CombinedFamilyInfo, Permission } from "../GeneratedClient";
import { AgeText } from "../AgeText";
import EditIcon from '@mui/icons-material/Edit';
import { useRecoilValue } from "recoil";
import { partneringFamiliesData } from "../Model/ReferralsModel";
import { ContactDisplay } from "../ContactDisplay";
import { IconRow } from "../IconRow";
import { useDialogHandle } from "../Hooks/useDialogHandle";
import { EditAdultDialog } from "../Families/EditAdultDialog";
import { usePermissions } from "../Model/SessionModel";

type PartneringAdultCardProps = {
  partneringFamilyId: string,
  personId: string
}

export function PartneringAdultCard({partneringFamilyId, personId}: PartneringAdultCardProps) {
  const partneringFamilies = useRecoilValue(partneringFamiliesData);

  const partneringFamily = partneringFamilies.find(x => x.family?.id === partneringFamilyId) as CombinedFamilyInfo;
  const adult = partneringFamily.family?.adults?.find(x => x.item1?.id === personId);

  const editDialogHandle = useDialogHandle();

  const permissions = usePermissions();

  return <>{adult?.item1 && adult.item1.id && adult.item2 &&
    <Card variant="outlined" sx={{minWidth: '275px'}}>
      <CardHeader sx={{paddingBottom: 0}}
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
      <CardContent sx={{
        paddingTop: 1,
        paddingBottom: 1,
        maxWidth: '500px'
      }}>
        <Typography color="textSecondary" sx={{
          '& > div:first-child': {
            marginLeft: 0
          },
          '& > *': {
            margin: 0.5,
          }
        }} component="div">
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
