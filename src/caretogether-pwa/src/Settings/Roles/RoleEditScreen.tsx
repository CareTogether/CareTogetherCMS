import { Typography } from '@mui/material';
import { useLoadable } from '../../Hooks/useLoadable';
import { organizationConfigurationQuery } from '../../Model/ConfigurationModel';
import { ProgressBackdrop } from '../../Shell/ProgressBackdrop';
import { useDataLoaded } from '../../Model/Data';
import { useParams } from 'react-router-dom';
import { RoleEdit } from './RoleEdit';
import useScreenTitle from '../../Shell/ShellScreenTitle';

export function RoleEditScreen() {
  useScreenTitle('Roles');

  const { roleName } = useParams<{ roleName: string }>();
  const configuration = useLoadable(organizationConfigurationQuery);
  const dataLoaded = useDataLoaded();

  if (!dataLoaded || !configuration) {
    return <ProgressBackdrop>Loading role...</ProgressBackdrop>;
  }

  const roles = configuration?.roles;
  const selectedRole = roles?.find((role) => role.roleName === roleName);

  if (!selectedRole) {
    return (
      <div className="ph-unmask">
        <Typography align="center" mt={10}>
          Role not found.
        </Typography>
      </div>
    );
  }

  return (
    <div className="ph-unmask">
      <RoleEdit roleDefinition={selectedRole} />
    </div>
  );
}
