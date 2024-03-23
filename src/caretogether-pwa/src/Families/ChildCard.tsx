import {
  Card,
  CardHeader,
  IconButton,
  CardContent,
  Typography,
} from "@mui/material";
import { CustodialRelationshipType, Gender, Permission } from "../GeneratedClient";
import { AgeText } from "./AgeText";
import EditIcon from '@mui/icons-material/Edit';
import { useFamilyPermissions } from "../Model/SessionModel";
import { useFamilyLookup } from "../Model/DirectoryModel";
import { useDrawer } from "../Generic/ShellDrawer";
import { EditChildDrawer } from "./EditChildDrawer";

type ChildCardProps = {
  familyId: string,
  personId: string
}

export function ChildCard({ familyId, personId }: ChildCardProps) {
  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId)!;

  const child = family.family?.children?.find(x => x.id === personId);
  const editChildDrawer = useDrawer();

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
            onClick={() => editChildDrawer.openDrawer()}
            size="medium">
            <EditIcon color="primary" />
          </IconButton>} />
      <CardContent sx={{ paddingTop: 1, paddingBottom: 1, maxWidth: '500px' }}>
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
      {editChildDrawer.drawerFor(
        <EditChildDrawer child={child} familyAdults={family.family!.adults!.map(a => a.item1!)}
        custodialRelationships={family.family!.custodialRelationships}
		onClose={editChildDrawer.closeDrawer} />
      )}
    </Card>}</>;
}
