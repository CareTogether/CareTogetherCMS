import { MenuItem, Select, Skeleton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useLoadable } from '../Hooks/useLoadable';
import { locationNameQuery, organizationConfigurationQuery, organizationNameQuery } from '../Model/ConfigurationModel';
import { currentOrganizationQuery, selectedLocationContextState } from '../Model/Data';

export function ShellContextSwitcher() {
  const organizationName = useLoadable(organizationNameQuery);
  const locationName = useLoadable(locationNameQuery);

  const organizationConfiguration = useLoadable(organizationConfigurationQuery);
  const [selectedLocationContext, setSelectedLocationContext] = useRecoilState(selectedLocationContextState);
  const currentOrganization = useRecoilValue(currentOrganizationQuery);
  const availableLocations = currentOrganization.locations;

  const locations = organizationConfiguration?.locations!.map(location => ({
    id: location.id!,
    name: location.name!,
    isAvailable: availableLocations?.some(available => available.locationId === location.id) || false
  }));
  
  const navigate = useNavigate();
  
  function switchLocation(locationId: string) {
    setSelectedLocationContext({ organizationId: currentOrganization.organizationId!, locationId });
    navigate("/");
  }
  
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  return (
    <Stack sx={{ position: 'absolute' }}>
      {organizationName
        ? <Typography variant='subtitle1' component="h1"
            sx={{ position: 'relative', top: -4, left: 8}}>
            {organizationName}
          </Typography>
        : <Skeleton variant='text' width={130} animation='wave' sx={{ marginTop: -0.5, marginLeft: 1}} />}
      {(locationName && availableLocations && locations)
        ? availableLocations.length >= 1
          ? <Select size={isDesktop ? 'small' : 'medium'}
              variant='outlined'
              sx={{
                marginLeft: 0.5, marginTop: isDesktop ? -1 : 0,
                height: isDesktop ? 24 : 56,
                '& .MuiInputBase-input': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  paddingTop: isDesktop ? 0 : 2, paddingBottom: isDesktop ? 0 : 2,
                  paddingLeft: isDesktop ? .5 : 2, paddingRight: isDesktop ? .5 : 2
                },
                '.MuiSelect-iconOutlined': {
                  color: theme.palette.primary.contrastText
                },
                '& [aria-expanded=true]': {
                  backgroundColor: theme.palette.primary.dark
                },
                '& .MuiOutlinedInput-notchedOutline, .Mui-focused & .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#fff8'
                }
              }}
              MenuProps={{ MenuListProps: { sx: {
                backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText
              }}}}
              value={selectedLocationContext.locationId}
              onChange={e => switchLocation(e.target.value as string)}>
                {locations.map(location =>
                  <MenuItem key={location.id} value={location.id}
                    disabled={!location.isAvailable}>
                    {location.name}
                  </MenuItem>)}
              </Select>
            : <Typography variant='subtitle2' component="h2"
                sx={{ position: 'relative', top: -8, left: 8}}>
                {locationName}
              </Typography>
        : <Skeleton variant="text" width={130} animation="wave" sx={{ marginLeft: 1 }} />}
    </Stack>
  );
}
