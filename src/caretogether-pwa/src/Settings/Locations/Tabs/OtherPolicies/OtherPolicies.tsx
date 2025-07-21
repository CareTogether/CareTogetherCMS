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
import { useRecoilValue } from 'recoil';
import { organizationConfigurationQuery } from '../../../../Model/ConfigurationModel';
import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import { AccessLevelData, AddAccessLevel } from './AddAccessLevel';
import { summarizeList } from '../../../../Utilities/stringUtils';
import { useParams } from 'react-router-dom';

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

export default function OtherPolicies() {
  const params = useParams();
  const locationId = params.locationId || '';

  const organization = useRecoilValue(organizationConfigurationQuery);
  const location = organization?.locations?.find(
    (loc) => loc.id === locationId
  );

  const accessLevels = location?.accessLevels;

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

  if (!accessLevels) {
    return <Typography variant="body2">No Access Levels found.</Typography>;
  }

  const rows = accessLevels.filter(({ name }) =>
    name?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Other Policies
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
                    organizationRoles: organizationRoles!,
                  });
                  openSidePanelEdit();
                }}
              >
                <TableCell>{name}</TableCell>
                <TableCell>
                  {organizationRoles ? summarizeList(organizationRoles) : '-'}
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
              locationConfiguration={location!}
              onClose={() => {
                closeSidePanelAdd();
              }}
            />
          </SidePanelAdd>

          <SidePanelEdit>
            <AddAccessLevel
              data={workingAccessLevel || undefined}
              locationConfiguration={location!}
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
