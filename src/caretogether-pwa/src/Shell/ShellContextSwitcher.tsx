import { Skeleton, Stack, Typography } from '@mui/material';
import { useLoadable } from '../Hooks/useLoadable';
import { locationNameQuery, organizationNameQuery } from '../Model/ConfigurationModel';

export function ShellContextSwitcher() {
  const organizationName = useLoadable(organizationNameQuery);
  const locationName = useLoadable(locationNameQuery);

  // const organizationConfiguration = useLoadable(organizationConfigurationQuery);
  // const [selectedLocationId, setSelectedLocationId] = useRecoilStateLoadable(selectedLocationIdState);
  // const [, setSavedLocationId] = useLocalStorage<string | null>('locationId', null);
  // const availableLocations = useLoadable(availableLocationsQuery);

  // const locations = organizationConfiguration?.locations!.map(location => ({
  //   id: location.id!,
  //   name: location.name!,
  //   isAvailable: availableLocations?.some(available => available.locationId === location.id)
  // }));
  // const currentLocationName = locations?.find(x => x.id === selectedLocationId.contents)?.name;
  
  // const navigate = useNavigate();

  // function switchLocation(locationId: string) {
  //   setSelectedLocationId(locationId);
  //   setSavedLocationId(locationId);
  //   navigate("/");
  // }

  return (
    <Stack sx={{ position: 'absolute' }}>
      {organizationName
        ? <Typography variant='subtitle1' component="h1"
            sx={{ position: 'relative', top: -4, left: 8}}>
            {organizationName}
          </Typography>
        : <Skeleton variant="text" width={130} animation="wave" sx={{ marginTop: -0.5, marginLeft: 1}} />}
      {locationName
        ? <Typography variant='subtitle2' component="h2"
            sx={{ position: 'relative', top: -8, left: 8}}>
            {locationName}
          </Typography>
          // {availableLocations.length >= 1
          //   ? <Select size={isMobile ? "medium" : "small"}
          //       sx={{ paddingLeft: '8px', '& .MuiInputBase-input': { padding: isMobile ? 1 : 0 } }}
          //       value={selectedLocationId}
          //       onChange={e => switchLocation(e.target.value as string)}>
          //         {locations.map(location =>
          //           <MenuItem key={location.id} value={location.id}
          //             disabled={!location.isAvailable}>
          //             {location.name}
          //           </MenuItem>)}
          //     </Select>
          //   : <p style={{
          //       margin: '0',
          //       paddingLeft: '8px',
          //       fontSize: '14px'
          //     }}>{currentLocationName}</p>}
        : <Skeleton variant="text" width={130} animation="wave" sx={{ marginLeft: 1 }} />}
    </Stack>
  );
}
