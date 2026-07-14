import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, Chip, IconButton, Stack, Typography } from '@mui/material';
import { ArrangementPhase, Permission } from '../../GeneratedClient';
import { useFamilyIdPermissions } from '../../Model/SessionModel';
import { ArrangementRowV2 } from './arrangementViewModel';
import { ArrangementManagementMode } from './ArrangementManagementDrawerV2';

type ArrangementWorkspaceHeaderV2Props = {
  onClose: () => void;
  onManage: (mode: ArrangementManagementMode) => void;
  row: ArrangementRowV2;
};

export function ArrangementWorkspaceHeaderV2({
  onClose,
  onManage,
  row,
}: ArrangementWorkspaceHeaderV2Props) {
  const arrangement = row.source;
  const permissions = useFamilyIdPermissions(row.partneringFamily.family!.id!);
  const canEdit = permissions(Permission.EditArrangement);
  const canDelete = permissions(Permission.DeleteArrangement);

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 1,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          color="text.secondary"
          sx={{ textTransform: 'uppercase' }}
          variant="caption"
        >
          Arrangement
        </Typography>
        <Typography
          id="arrangement-details-title"
          className="ph-unmask"
          variant="h5"
        >
          {row.arrangementType}
        </Typography>
        <Box
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1,
            justifyContent: 'space-between',
            mt: 1,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <Chip label={row.statusLabel} size="small" />
            <Typography
              color="text.secondary"
              variant="body2"
            >
              {row.childOrPersonLabel}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {arrangement.phase === ArrangementPhase.SettingUp && canEdit && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onManage('cancel')}
              >
                Cancel
              </Button>
            )}
            {arrangement.phase === ArrangementPhase.ReadyToStart && canEdit && (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onManage('cancel')}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => onManage('start')}
                >
                  Start
                </Button>
              </>
            )}
            {arrangement.phase === ArrangementPhase.Started && canEdit && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onManage('end')}
              >
                End
              </Button>
            )}
            {arrangement.phase === ArrangementPhase.Ended && canEdit && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onManage('reopen')}
              >
                Reopen
              </Button>
            )}
            {canDelete && (
              <Button
                variant="outlined"
                size="small"
                color="warning"
                onClick={() => onManage('delete')}
              >
                Delete
              </Button>
            )}
          </Stack>
        </Box>
      </Box>
      <IconButton aria-label="close arrangement details" onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </Box>
  );
}
