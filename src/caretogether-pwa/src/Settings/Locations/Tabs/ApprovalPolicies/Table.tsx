import * as React from 'react';
import MuiTable from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import {
  RequirementStage,
  VolunteerRolePolicyVersion,
} from '../../../../GeneratedClient';
import { summarizeList } from '../../../../Utilities/stringUtils';

function Row(props: { row: VolunteerRolePolicyVersion }) {
  const { row } = props;

  console.log({ row, stages: RequirementStage });

  const getSummarizedRequirements = (stage: RequirementStage) =>
    summarizeList(
      row.requirements
        ?.filter((item) => item.stage === stage)
        .map((item) => item.actionName || '') || [],
      2
    );

  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell component="th" scope="row">
          {row.version}
        </TableCell>
        <TableCell>
          {row.supersededAtUtc ? row.supersededAtUtc.toISOString() : '-'}
        </TableCell>
        <TableCell>
          {getSummarizedRequirements(RequirementStage.Application)}
        </TableCell>
        <TableCell>
          {getSummarizedRequirements(RequirementStage.Approval)}
        </TableCell>
        <TableCell>
          {getSummarizedRequirements(RequirementStage.Onboarding)}
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

export function Table({ rows }: { rows: VolunteerRolePolicyVersion[] }) {
  return (
    <TableContainer>
      <MuiTable aria-label="collapsible table">
        <colgroup>
          <col />
          <col />
          <col style={{ width: '33%' }} />
          <col style={{ width: '33%' }} />
          <col style={{ width: '33%' }} />
        </colgroup>
        <TableHead>
          <TableRow>
            <TableCell>Version</TableCell>
            <TableCell>Superseded at</TableCell>
            <TableCell>Application Req.</TableCell>
            <TableCell>Approval Req.</TableCell>
            <TableCell>Onboarding Req.</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <Row key={row.version} row={row} />
          ))}
        </TableBody>
      </MuiTable>
    </TableContainer>
  );
}
