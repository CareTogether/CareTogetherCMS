import {
  Card,
  CardHeader,
  IconButton,
  CardContent,
  Typography,
  Chip,
} from "@mui/material";
import { CustodialRelationshipType, ExactAge, Gender, Permission } from "../GeneratedClient";
import { AgeText } from "./AgeText";
import EditIcon from '@mui/icons-material/Edit';
import { useDialogHandle } from "../Hooks/useDialogHandle";
import { EditChildDialog } from "./EditChildDialog";
import { useFamilyPermissions } from "../Model/SessionModel";
import { useFamilyLookup } from "../Model/DirectoryModel";
import { differenceInYears } from "date-fns";

type ChildCardProps = {
  familyId: string,
  personId: string
}

export function ChildCard({ familyId, personId }: ChildCardProps) {
  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId)!;

  const child = family.family?.children?.find(x => x.id === personId);

  const isAdult = child?.age &&
    differenceInYears(new Date(), (child.age as ExactAge).dateOfBirth!) >= 18;

  const editDialogHandle = useDialogHandle();

  const permissions = useFamilyPermissions(family);

  return <>{child &&
    <Card variant="outlined" sx={{ minWidth: '275px' }}>
      <CardHeader sx={{ paddingBottom: 0 }}
        title={child.firstName + " " + child.lastName}
        subheader={<>
          Child, <AgeText age={child.age} /> {child.gender ? ", " + Gender[child.gender] : ""} {child.ethnicity ? ", " + child.ethnicity : ""}
        </>}
        action={permissions(Permission.EditFamilyInfo) &&
          <IconButton
            onClick={editDialogHandle.openDialog}
            size="medium">
            <EditIcon color="primary" />
          </IconButton>} />
      <CardContent sx={{ paddingTop: 1, paddingBottom: 1, maxWidth: '500px' }}>
        {isAdult && <Chip size="small" label={"No longer under 18!"} color="error" />}
        <Typography variant="body2" component="div">
          {child.concerns && <><strong>⚠&nbsp;&nbsp;&nbsp;{child.concerns}</strong></>}
          {child.concerns && child.notes && <br />}
          {child.notes && <>📝&nbsp;{child.notes}</>}
        </Typography>
        <Typography variant="body2" component="div">
          <ul style={{ padding: 0, margin: 0, marginTop: 8, listStyle: 'none' }}>
            {family.family?.custodialRelationships?.filter(relationship => relationship.childId === child.id)?.map(relationship => (
              <li key={relationship.personId} style={{ marginTop: 4 }}>
                {family.family?.adults?.filter(x => x.item1?.id === relationship.personId)[0].item1?.firstName}:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                <span style={{ float: 'right' }}>{relationship.type === CustodialRelationshipType.LegalGuardian
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
        child={child} familyAdults={family.family!.adults!.map(a => a.item1!)}
        custodialRelationships={family.family!.custodialRelationships} />}
    </Card>}</>;
}
