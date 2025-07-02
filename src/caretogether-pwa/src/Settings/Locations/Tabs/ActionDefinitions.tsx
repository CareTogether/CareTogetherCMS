import {
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Link,
  TablePagination,
  Drawer,
} from '@mui/material';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../../Model/ConfigurationModel';
import { useState } from 'react';
import { AddActionDefinition } from './AddActionDefinition';
import SearchIcon from '@mui/icons-material/Search';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import relativeTime from 'dayjs/plugin/relativeTime';
import InputAdornment from '@mui/material/InputAdornment';

dayjs.extend(duration);
dayjs.extend(relativeTime);

export default function ActionDefinitions() {
  const effectiveLocationPolicy = useRecoilValue(policyData);
  const actionDefinitions = effectiveLocationPolicy?.actionDefinitions;

  const [searchTerm, setSearchTerm] = useState('');

  const [page, setPage] = useState(0);
  const rowsPerPage = 5;

  const [openDrawer, setOpenDrawer] = useState(false);

  if (!actionDefinitions || Object.keys(actionDefinitions).length === 0) {
    return (
      <Typography variant="body2">No action definitions found.</Typography>
    );
  }

  const rows = Object.entries(actionDefinitions).filter(([name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const paginatedRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Action definitions
      </Typography>
      <Typography variant="body2" sx={{ mb: 3 }}>
        Actions can not be delete, nor have its name changed. All the other
        properties can be changed.
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

      <TableContainer component={Paper} sx={{ mb: 1 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Document</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Instructions</TableCell>
              <TableCell>Info link</TableCell>
              <TableCell>Validity</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.map(([name, definition]) => (
              <TableRow key={name}>
                <TableCell>{name}</TableCell>
                <TableCell>{definition.documentLink || '-'}</TableCell>
                <TableCell>{definition.noteEntry || '-'}</TableCell>
                <TableCell>{definition.instructions || '-'}</TableCell>
                <TableCell>
                  {definition.infoLink ? (
                    <Link
                      href={definition.infoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {definition.infoLink}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>
                  {definition.validity
                    ? dayjs.duration(definition.validity).humanize()
                    : '-'}
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

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDrawer(true)}
        >
          Add New Action Definition
        </Button>
      </Stack>

      <Drawer
        anchor="right"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
      >
        <Box sx={{ width: 500, padding: 3, pt: 7 }}>
          <AddActionDefinition onClose={() => setOpenDrawer(false)} />
        </Box>
      </Drawer>
    </Box>
  );
}
