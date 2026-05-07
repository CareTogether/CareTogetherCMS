import {
  AccessTime as AccessTimeIcon,
  CheckCircleOutlined as CheckCircleOutlinedIcon,
  PendingOutlined as PendingOutlinedIcon,
  PlayCircleFilled as PlayCircleFilledIcon,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { ArrangementPhase, PartneringFamilyInfo } from '../../GeneratedClient';
import { allArrangements } from './arrangementHelpers';

const arrangementPhaseText = new Map<number, string>([
  [ArrangementPhase.SettingUp, 'Setting Up'],
  [ArrangementPhase.ReadyToStart, 'Ready To Start'],
  [ArrangementPhase.Started, 'Started'],
  [ArrangementPhase.Ended, 'Ended'],
]);

function arrangementStatusSummary(
  partneringFamily: PartneringFamilyInfo,
  phase: ArrangementPhase,
  type: string
) {
  const phaseText = arrangementPhaseText.get(phase);

  const statusCount = allArrangements(partneringFamily).filter(
    (a) =>
      a.arrangement.phase === phase && a.arrangement.arrangementType === type
  ).length;

  let statusCountDiv;

  const arrangementZero = 'lightGrey';
  const arrangementSettingUp = 'grey';
  const arrangementReady = '#E3AE01';
  const arrangementStarted = '#01ACFB';
  const arrangementEnded = 'green';

  if (statusCount > 0) {
    statusCountDiv = (
      <b
        style={{
          display: 'inline-block',
          verticalAlign: 'middle',
          color:
            statusCount === 0
              ? arrangementZero
              : phase === ArrangementPhase.SettingUp
                ? arrangementSettingUp
                : phase === ArrangementPhase.ReadyToStart
                  ? arrangementReady
                  : phase === ArrangementPhase.Started
                    ? arrangementStarted
                    : arrangementEnded,
        }}
      >
        {statusCount}
      </b>
    );
  }

  return (
    <div style={{ width: 36 }}>
      <Tooltip title={phaseText!}>
        {phase === ArrangementPhase.SettingUp ? (
          <PendingOutlinedIcon
            sx={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '3px',
              color: statusCount === 0 ? arrangementZero : arrangementSettingUp,
            }}
          />
        ) : phase === ArrangementPhase.ReadyToStart ? (
          <AccessTimeIcon
            sx={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '3px',
              color: statusCount === 0 ? arrangementZero : arrangementReady,
            }}
          />
        ) : phase === ArrangementPhase.Started ? (
          <PlayCircleFilledIcon
            sx={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '3px',
              color: statusCount === 0 ? arrangementZero : arrangementStarted,
            }}
          />
        ) : (
          <CheckCircleOutlinedIcon
            sx={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '3px',
              color: statusCount === 0 ? arrangementZero : arrangementEnded,
            }}
          />
        )}
      </Tooltip>
      {statusCountDiv}
    </div>
  );
}

export { arrangementStatusSummary };
