import {
  Card,
  CardContent,
  Grid,
  Typography,
  ListItemButton,
  ListItemText,
  useTheme,
} from '@mui/material';
import { PrimaryContactEditor } from '../PrimaryContactEditor';
import { useParams } from 'react-router';
import {
  useFamilyLookup,
  useCommunityLookup,
} from '../../Model/DirectoryModel';
import { CompletedCustomFieldInfo, Permission } from '../../GeneratedClient';
import { useFamilyPermissions } from '../../Model/SessionModel';
import { FamilyCustomFieldV2 } from '../FamilyProfile/FamilyCustomFieldV2';
import RequirementsList from './RequirementsList';
import { alphabeticallyBy } from '../../Utilities/sortOrder';
import { visibleCommunitiesQuery } from '../../Model/Data';
import { useLoadable } from '../../Hooks/useLoadable';
import { useAppNavigate } from '../../Hooks/useAppNavigate';

const FamilyProfile = () => {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const communitiesLoadable = useLoadable(visibleCommunitiesQuery);
  const allCommunities = (communitiesLoadable || [])
    .map((x) => x.community!)
    .sort((a, b) => (a.name! < b.name! ? -1 : a.name! > b.name! ? 1 : 0));
  const communityLookup = useCommunityLookup();
  const allCommunityInfo = allCommunities.map((c) => communityLookup(c.id)!);
  const familyCommunityInfo = allCommunityInfo?.filter((c) =>
    c.community?.memberFamilies?.includes(familyId)
  );
  const appNavigate = useAppNavigate();
  const theme = useTheme();

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
      <Grid container spacing={2}>
        <Grid item xs={8} md={3}>
          <Typography variant="h3" style={{ marginTop: 0, marginBottom: 0 }}>
            Family Profile
          </Typography>
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

        <Grid item xs={4} md={2}>
          <Card
            sx={{
              padding: '0.5rem',
              marginBottom: '1rem',
              borderRadius: '20px',
              border: '2px solid #005B64',
            }}
          >
            <Typography
              variant="h3"
              style={{
                marginTop: 0,
                marginBottom: 0,
                textAlign: 'center',
                color: '#005B64',
              }}
            >
              Communities
            </Typography>
          </Card>
          {familyCommunityInfo?.map((communityInfo) => {
            return (
              <ListItemButton
                key={communityInfo.community?.id}
                sx={{
                  padding: '.5rem',
                  border: '2px solid #005B64',
                  borderRadius: '20px',
                  textAlign: 'center',
                }}
                onClick={() =>
                  communityInfo.community && communityInfo.community.id
                    ? appNavigate.community(communityInfo.community.id)
                    : {}
                }
              >
                <ListItemText
                  sx={{ alignSelf: 'baseline' }}
                  primary={communityInfo.community?.name}
                  primaryTypographyProps={{
                    color: theme.palette.primary.main,
                  }}
                ></ListItemText>
              </ListItemButton>
            );
          })}
        </Grid>
      </Grid>
    </>
  );
};

export default FamilyProfile;
