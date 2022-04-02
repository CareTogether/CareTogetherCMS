import { useRecoilValue } from 'recoil';
import { locationNameData, organizationNameData } from '../Model/ConfigurationModel';

export function LocationSwitcher() {
  const organizationName = useRecoilValue(organizationNameData);
  const locationName = useRecoilValue(locationNameData);

  return (
    <header>
      <p style={{
        margin: '0',
        paddingLeft: '8px',
        fontSize: '16px'
      }}>{organizationName}</p>
      <p style={{
        margin: '0',
        paddingLeft: '8px',
        fontSize: '14px'
      }}>{locationName}</p>
    </header>
  );
}
