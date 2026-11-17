import { Navigate, useParams } from 'react-router-dom';
import { settingsSectionPath } from './settingsSections';

export function LegacyCasePolicyRedirect() {
  const { organizationId, locationId } = useParams();
  return (
    <Navigate
      replace
      to={settingsSectionPath(organizationId!, locationId!, 'casePolicy')}
    />
  );
}
