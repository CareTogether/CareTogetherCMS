import { Select, MenuItem } from '@mui/material';
import { useRecoilState, useRecoilValue } from 'recoil';
import { organizationConfigurationData, organizationNameData } from '../Model/ConfigurationModel';
import { availableLocationsState, currentLocationState } from '../Model/SessionModel';
import { useBackdrop } from '../useBackdrop';

export function LocationSwitcher() {
  const organizationName = useRecoilValue(organizationNameData);
  const organizationConfiguration = useRecoilValue(organizationConfigurationData);

  const [currentLocationId, setCurrentLocationId] = useRecoilState(currentLocationState);
  const availableLocations = useRecoilValue(availableLocationsState);

  const withBackdrop = useBackdrop();

  const locations = organizationConfiguration.locations!.map(location => ({
    id: location.id!,
    name: location.name!,
    isAvailable: availableLocations.some(available => available.locationId === location.id) || true
  }));
  const currentLocationName = locations.find(x => x.id === currentLocationId)?.name;
  
  async function switchLocation(locationId: string) {
    // await withBackdrop(async () => {
      console.log(locationId);
      setCurrentLocationId(locationId);
      console.log("finished");
    // });
  }

  return (
    <header>
      <p style={{
        margin: '0',
        paddingLeft: '8px',
        fontSize: '16px'
      }}>{organizationName}</p>
      {availableLocations.length >= 1
        ? <Select size="small" sx={{ paddingLeft: '8px', '& .MuiInputBase-input': { padding: 0 } }}
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
