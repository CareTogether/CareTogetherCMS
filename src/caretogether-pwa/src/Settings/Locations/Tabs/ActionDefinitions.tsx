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
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useState, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { policyData } from '../../../Model/ConfigurationModel';
import { AddActionDefinition } from './AddActionDefinition';

const requirementLabel: Record<number, string> = {
  0: 'None',
  1: 'Allowed',
  2: 'Required',
};

function truncate(text?: string | null, length = 40) {
  if (!text) return '-';
  return text.length <= length ? text : text.slice(0, length) + '…';
}

function formatValidity(value?: string | null) {
  if (!value) return '-';
  const [days] = value.split('.');
  return `${days} days`;
}

export default function ActionDefinitions() {
  const effectiveLocationPolicy = useRecoilValue(policyData);
  const actionDefinitions = effectiveLocationPolicy?.actionDefinitions;

  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 5;
  const [openDrawer, setOpenDrawer] = useState(false);

  const entries = Object.entries(actionDefinitions ?? {});

  const filtered = useMemo(
    () =>
      entries.filter(([name]) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    [entries, searchTerm]
  );

  const paginated = filtered.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (!actionDefinitions) {
    return <Typography>No action definitions found.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Action Definitions
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

      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Document Link</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Instructions</TableCell>
              <TableCell>Info Link</TableCell>
              <TableCell>Validity</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginated.map(([name, def]) => (
              <TableRow key={name}>
                <TableCell>
                  {name}

                  {def.alternateNames && def.alternateNames.length > 0 && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5 }}
                    >
                      {def.alternateNames.join(', ')}
                    </Typography>
                  )}
                </TableCell>

                <TableCell>{requirementLabel[def.documentLink]}</TableCell>
                <TableCell>{requirementLabel[def.noteEntry]}</TableCell>
                <TableCell>{truncate(def.instructions)}</TableCell>
                <TableCell>
                  {def.infoLink ? (
                    <Link
                      href={def.infoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {def.infoLink}
                    </Link>
                  ) : (
                    '-'
                  )}
                </TableCell>
                <TableCell>{formatValidity(def.validity)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={filtered.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[]}
      />

      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button variant="contained" onClick={() => setOpenDrawer(true)}>
          Add new action definition
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
