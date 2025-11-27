import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useAppNavigate } from '../../Hooks/useAppNavigate';
import { useLoadable } from '../../Hooks/useLoadable';
import { organizationConfigurationQuery } from '../../Model/ConfigurationModel';
import { useUserIsOrganizationAdministrator } from '../../Model/SessionModel';
import { useSidePanel } from '../../Hooks/useSidePanel';
import { AddLocation } from './AddLocationSidePanel';
import { useRecoilValue } from 'recoil';
import { selectedLocationContextState } from '../../Model/Data';
import { Breadcrumbs } from '../../Generic/Breadcrumbs';

export function LocationsSection() {
  const configuration = useLoadable(organizationConfigurationQuery);

  const { organizationId, locationId } = useRecoilValue(
    selectedLocationContextState
  );

  const appNavigate = useAppNavigate();

  const { SidePanel, openSidePanel, closeSidePanel } = useSidePanel();

  const canAddOrEdit = useUserIsOrganizationAdministrator();

  return (
    <>
      <Breadcrumbs
        items={[
          {
            label: 'Settings',
            to: `/org/${organizationId}/${locationId}/settings`,
          },
        ]}
        currentPageLabel="Locations"
        sx={{ mb: 2 }}
      />

      <Typography variant="h2" mt={2}>
        Locations
      </Typography>

      <TableContainer>
        <Table aria-label="Locations list">
          <TableHead>
            <TableRow>
              <TableCell align="left" sx={{ minWidth: 200 }}>
                Name
              </TableCell>
              {/* TODO: implement delete location */}
              {/* <TableCell>Actions</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {configuration?.locations?.map((location) => {
              // const canDelete = isRoleEditable(role) && canEdit;

              // const deleteRoleButton = (
              //   <DeleteRoleButton
              //     roleName={role.roleName!}
              //     disabled={!canDelete}
              //   />
              // );

              return (
                <TableRow
                  key={location.name}
                  hover
                  role="listitem"
                  tabIndex={-1}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => appNavigate.locationEdit(location.id!)}
                >
                  <TableCell align="left" sx={{ minWidth: 200 }}>
                    {location.name}
                  </TableCell>

                  {/* TODO: implement delete location */}
                  {/* <TableCell
                    // We don't want clicks in this cell to open the item
                    // For some reason, the event is not being stopped in the IconButton in DeleteRoleButton
                    onClick={(event) => event.stopPropagation()}
                  >
                    {canDelete ? (
                      deleteRoleButton
                    ) : (
                      // Explain why user can't delete the role. Have to use MUI's Tooltip as per:
                      // https://v5.mui.com/material-ui/react-tooltip/#disabled-elements
                      // https://github.com/mui/material-ui/issues/8416#issuecomment-332556082
                      <Tooltip
                        title="Not allowed to delete this role"
                        placement="bottom"
                      >
                        <span>{deleteRoleButton}</span>
                      </Tooltip>
                    )}
                  </TableCell> */}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {canAddOrEdit && (
        <>
          <Button
            sx={{ marginY: 2 }}
            variant="contained"
            onClick={() => openSidePanel()}
          >
            Add new location
          </Button>

          <SidePanel>
            <AddLocation onClose={() => closeSidePanel()} />
          </SidePanel>
        </>
      )}
    </>
  );
}
