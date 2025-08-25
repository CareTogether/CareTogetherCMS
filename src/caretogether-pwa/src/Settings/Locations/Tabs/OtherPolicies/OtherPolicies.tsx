import {
  TextField,
  Typography,
  Button,
  Box,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from '@mui/material';
import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import { AccessLevelData, AddAccessLevel } from './AddAccessLevel';
import {
  camelCaseToSpaces,
  summarizeList,
} from '../../../../Utilities/stringUtils';
import { LocationConfiguration } from '../../../../GeneratedClient';

export type ConfigurationData = {
  name: string;
  // timeZone?: string;
  ethnicities: string[];
  adultFamilyRelationships: string[];
  arrangementReasons: string[];
};

export type AvailableOptions = {
  timezones: string[];
  ethnicities: string[];
  adultFamilyRelationships: string[];
  arrangementReasons: string[];
};

type Props = { locationConfiguration: LocationConfiguration };
export default function OtherPolicies({ locationConfiguration }: Props) {
  const accessLevels = locationConfiguration?.accessLevels ?? [];

  const [searchTerm, setSearchTerm] = useState('');

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  // We use two side panels here: one for adding a new access level and one for editing an existing one.
  // This way, the side panel for Adding is always clean (without pre-filled data).
  const {
    SidePanel: SidePanelAdd,
    openSidePanel: openSidePanelAdd,
    closeSidePanel: closeSidePanelAdd,
  } = useSidePanel();

  const {
    SidePanel: SidePanelEdit,
    openSidePanel: openSidePanelEdit,
    closeSidePanel: closeSidePanelEdit,
  } = useSidePanel();
  const [workingAccessLevel, setWorkingAccessLevel] =
    useState<AccessLevelData | null>(null);

  const canEdit = true; // Replace with actual permission check if needed

  const rows = accessLevels.filter(({ name }) =>
    name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  const hasRows = rows.length > 0;

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Access Levels
      </Typography>

      <TextField
        placeholder="Search..."
        size="small"
        fullWidth
        sx={{ maxWidth: 300 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {hasRows ? (
        <>
          <TableContainer sx={{ mb: 1 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Organization Roles</TableCell>
                  <TableCell>Approval Roles</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedRows.map(({ id, name, organizationRoles }) => (
                  <TableRow
                    key={name}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => {
                      setWorkingAccessLevel({
                        id: id!,
                        name: name!,
                        organizationRoles:
                          organizationRoles?.map((roleName) => ({
                            title: camelCaseToSpaces(roleName),
                            value: roleName,
                          })) || [],
                      });
                      openSidePanelEdit();
                    }}
                  >
                    <TableCell>{name}</TableCell>
                    <TableCell>
                      {organizationRoles
                        ? summarizeList(
                            organizationRoles.map(camelCaseToSpaces)
                          )
                        : '-'}
                    </TableCell>
                    <TableCell sx={{ fontStyle: 'italic' }}>
                      Not implemented yet
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[]}
          />
        </>
      ) : (
        <Box sx={{ my: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            No access levels yet for this location.
          </Typography>
        </Box>
      )}

      {canEdit && (
        <>
          <Button
            sx={{ marginY: 2 }}
            variant="contained"
            onClick={() => openSidePanelAdd()}
          >
            Add new Access Level
          </Button>

          <SidePanelAdd>
            <AddAccessLevel
              locationConfiguration={locationConfiguration}
              onClose={() => {
                closeSidePanelAdd();
              }}
            />
          </SidePanelAdd>

          <SidePanelEdit>
            <AddAccessLevel
              data={workingAccessLevel ?? undefined}
              locationConfiguration={locationConfiguration}
              onClose={() => {
                closeSidePanelEdit();
              }}
            />
          </SidePanelEdit>
        </>
      )}
    </Box>
  );
}
