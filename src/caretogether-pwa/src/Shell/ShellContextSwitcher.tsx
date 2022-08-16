import { Skeleton, Stack, Typography } from '@mui/material';
import { useLoadable } from '../Hooks/useLoadable';
import { locationNameQuery, organizationNameQuery } from '../Model/ConfigurationModel';

export function ShellContextSwitcher() {
  const organization = useLoadable(organizationNameQuery);
  const location = useLoadable(locationNameQuery);

  return (
    <Stack sx={{ position: 'absolute' }}>
      {organization
        ? <Typography variant='subtitle1' component="h1"
            sx={{ position: 'relative', top: -4, left: 8}}>
            {organization}
          </Typography>
        : <Skeleton variant="text" width={130} animation="wave" sx={{ marginTop: -0.5, marginLeft: 1}} />}
      {location
        ? <Typography variant='subtitle2' component="h2"
            sx={{ position: 'relative', top: -8, left: 8}}>
            {location}
          </Typography>
        : <Skeleton variant="text" width={130} animation="wave" sx={{ marginLeft: 1 }} />}
    </Stack>
  );
}
/*
export function LocationSwitcher() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const organizationName = useRecoilValue(organizationNameQuery);
  const organizationConfiguration = useRecoilValue(organizationConfigurationData);

  const [currentLocationId, setCurrentLocationId] = useRecoilState(selectedLocationIdState);
  const [, setSavedLocationId] = useLocalStorage<string | null>('locationId', null);
  const availableLocations = useRecoilValue(availableLocationsState);

  const locations = organizationConfiguration.locations!.map(location => ({
    id: location.id!,
    name: location.name!,
    isAvailable: availableLocations.some(available => available.locationId === location.id)
  }));
  const currentLocationName = locations.find(x => x.id === currentLocationId)?.name;
  
  const navigate = useNavigate();

  function switchLocation(locationId: string) {
    setCurrentLocationId(locationId);
    setSavedLocationId(locationId);
    navigate("/");
  }

  return (
    <header>
      <p style={{
        margin: '0',
        paddingLeft: '8px',
        fontSize: '16px'
      }}>{organizationName}</p>
      {availableLocations.length >= 1
        ? <Select size={isMobile ? "medium" : "small"}
            sx={{ paddingLeft: '8px', '& .MuiInputBase-input': { padding: isMobile ? 1 : 0 } }}
            value={currentLocationId}
            onChange={e => switchLocation(e.target.value as string)}>
              {locations.map(location =>
                <MenuItem key={location.id} value={location.id}
                  disabled={!location.isAvailable}>
                  {location.name}
                </MenuItem>)}
          </Select>
        : <p style={{
            margin: '0',
            paddingLeft: '8px',
            fontSize: '14px'
          }}>{currentLocationName}</p>}
    </header>
  );
}*/
