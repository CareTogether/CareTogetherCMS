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
import {
  LocationConfiguration,
  AccessLevel,
} from '../../../../GeneratedClient';
import { locationConfigurationQuery } from '../../../../Model/ConfigurationModel';
import { useState } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import { useSidePanel } from '../../../../Hooks/useSidePanel';
import { AccessLevelData, AddAccessLevel } from './AddAccessLevel';
import { summarizeList } from '../../../../Utilities/stringUtils';

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

type Props = {
  data: ConfigurationData;
  currentLocationDefinition: LocationConfiguration;
};

export default function OtherPolicies({}: Props) {
  const location = useRecoilValue(locationConfigurationQuery);
  const accessLevels = location?.accessLevels;

  console.log({ accessLevels });

  const [searchTerm, setSearchTerm] = useState('');

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const { SidePanel, openSidePanel, closeSidePanel } = useSidePanel();
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
                  openSidePanel();
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
            onClick={() => openSidePanel()}
          >
            Add new Access Level
          </Button>

          <SidePanel>
            <AddAccessLevel
              data={workingAccessLevel || undefined}
              onClose={() => {
                setWorkingAccessLevel(null);
                closeSidePanel();
              }}
            />
          </SidePanel>
        </>
      )}
    </Box>
  );
}
