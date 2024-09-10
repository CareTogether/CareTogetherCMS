import { Card, CardContent, Grid, Typography } from '@mui/material';
import { PrimaryContactEditor } from '../PrimaryContactEditor';
import { useParams } from 'react-router';
import { useFamilyLookup } from '../../Model/DirectoryModel';
import { CompletedCustomFieldInfo, Permission } from '../../GeneratedClient';
import { useFamilyPermissions } from '../../Model/SessionModel';
import { FamilyCustomFieldV2 } from '../FamilyProfile/FamilyCustomFieldV2';
import RequirementsList from './RequirementsList';
import { alphabeticallyBy } from '../../Utilities/sortOrder';

const FamilyProfile = () => {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId)!;

  const permissions = useFamilyPermissions(family);

  const openReferral = family.partneringFamilyInfo?.openReferral;

  const adults = family.family?.adults || [];

  const [adult1, adult2] = adults;

  const firstName1 = adult1.item1?.firstName;
  const firstName2 = adult2.item1?.firstName;

  const lastName = adult1.item1?.lastName;

  const completedCustomFields = family.family!.completedCustomFields || [];
  const missingCustomFields = family.missingCustomFields || [];

  const customFields = [...completedCustomFields, ...missingCustomFields];

  return (
    <>
      <Grid>
        <Typography variant="h3">Family Profile</Typography>
        <Card
          sx={{
            maxWidth: 500,
            margin: '0',
            textAlign: 'center',
            borderRadius: '15px',
            border: '2px solid #005B64',
          }}
        >
          <CardContent>
            <Typography variant="h4">
              {firstName1} and {firstName2} {lastName}
            </Typography>
            <Typography variant="h5">
              <PrimaryContactEditor family={family} isEditable={false} />
            </Typography>
            <Grid>
              {permissions(Permission.ViewFamilyCustomFields) &&
                customFields
                  .sort(
                    alphabeticallyBy((value) => {
                      if (value instanceof CompletedCustomFieldInfo) {
                        return value.customFieldName || '';
                      }

                      return value;
                    })
                  )
                  .map((customField) => (
                    <FamilyCustomFieldV2
                      key={
                        typeof customField === 'string'
                          ? customField
                          : customField.customFieldName
                      }
                      familyId={familyId}
                      customField={customField}
                      isEditable={false}
                    />
                  ))}
            </Grid>

            {openReferral && <RequirementsList referral={openReferral} />}
          </CardContent>
        </Card>
      </Grid>
    </>
  );
};

export default FamilyProfile;
