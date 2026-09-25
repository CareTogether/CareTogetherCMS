import PersonIcon from '@mui/icons-material/Person';
import { Box, Stack, Tooltip, Typography } from '@mui/material';
import { Gender } from '../GeneratedClient';
import { v2Typography } from '../Families/v2Typography';
import type { ClientMemberSummaryV2 } from './useClientsBrowserViewModel';

type ClientFamilyCellV2Props = {
  familyName: string;
  memberSummaries: ClientMemberSummaryV2[];
};

function memberColor(gender?: Gender) {
  if (gender === Gender.Male) return '#6f8fa8';
  if (gender === Gender.Female) return '#b38a9c';
  if (gender === Gender.SeeNotes) return '#9aa3ad';
  return '#9aa3ad';
}

function MemberIcon({
  memberType,
  label,
  color,
}: Pick<ClientMemberSummaryV2, 'memberType'> & {
  label: string;
  color: string;
}) {
  return (
    <PersonIcon
      aria-label={label}
      sx={{
        color,
        fontSize: memberType === 'child' ? 17 : 21,
      }}
    />
  );
}

export function ClientFamilyCellV2({
  familyName,
  memberSummaries,
}: ClientFamilyCellV2Props) {
  return (
    <Stack
      component="span"
      spacing={0.5}
      sx={{ display: 'inline-flex', minWidth: 0 }}
    >
      <Box
        component="span"
        sx={{ alignItems: 'center', display: 'flex', gap: 0.75, minWidth: 0 }}
      >
        <Typography
          component="span"
          {...v2Typography.primaryValue}
          noWrap
          sx={{
            ...v2Typography.primaryValue.sx,
            flex: '0 1 auto',
            fontWeight: 700,
            minWidth: 0,
          }}
        >
          {familyName}
        </Typography>
      </Box>
      {memberSummaries.length > 0 && (
        <Box
          component="span"
          sx={{ alignItems: 'flex-end', display: 'flex', gap: 0.1 }}
        >
          {memberSummaries.map(({ memberType, gender }, index) => {
            const color = memberColor(gender);
            const memberNumber = memberSummaries
              .slice(0, index + 1)
              .filter((member) => member.memberType === memberType).length;
            const label = `${memberType === 'adult' ? 'Adult' : 'Child'} ${memberNumber}`;
            return (
              <Tooltip key={`${memberType}-${index}`} title={label}>
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    transform:
                      memberType === 'child' ? 'translateY(-0.5px)' : undefined,
                  }}
                >
                  <MemberIcon
                    color={color}
                    label={label}
                    memberType={memberType}
                  />
                </Box>
              </Tooltip>
            );
          })}
        </Box>
      )}
    </Stack>
  );
}
