import { Select, MenuItem, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';
import { organizationConfigurationData, organizationNameData } from './Model/ConfigurationModel';
import { availableLocationsState, currentLocationState } from './Model/SessionModel';
import { useLocalStorage } from './useLocalStorage';

export function LocationSwitcher() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const organizationName = useRecoilValue(organizationNameData);
  const organizationConfiguration = useRecoilValue(organizationConfigurationData);

  const [currentLocationId, setCurrentLocationId] = useRecoilState(currentLocationState);
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
}
