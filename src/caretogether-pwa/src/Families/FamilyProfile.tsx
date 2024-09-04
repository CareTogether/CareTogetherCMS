import { Card, CardContent, Grid, Typography, Badge } from '@mui/material';
import { PrimaryContactEditor } from './PrimaryContactEditor';
import { useParams } from 'react-router';
import { useFamilyLookup } from '../Model/DirectoryModel';

const FamilyProfile = () => {
  const familyIdMaybe = useParams<{ familyId: string }>();
  const familyId = familyIdMaybe.familyId as string;

  const familyLookup = useFamilyLookup();
  const family = familyLookup(familyId)!;

  return (
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
          <Typography variant="h4"> John and Jane Doe </Typography>
          <Typography variant="h5">
            <PrimaryContactEditor family={family} />
          </Typography>
          <Grid container>
            <Grid item xs={3}>
              <Badge color="success" badgeContent={3}>
                ✅
              </Badge>
            </Grid>
            <Grid item xs={3}>
              <Badge color="warning" badgeContent={1}>
                🚫
              </Badge>
            </Grid>
            <Grid item xs={3}>
              <Badge color="error" badgeContent={0}>
                ❌
              </Badge>
            </Grid>
            <Grid item xs={3}>
              <Badge color="info" badgeContent={2}>
                📅
              </Badge>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Grid>
  );
};

export default FamilyProfile;
