import {
  Tooltip,
} from '@mui/material';
import { ArrangementPhase } from '../../GeneratedClient';
import { format } from 'date-fns';

type ArrangementPhaseSummaryProps = {
  phase: ArrangementPhase,
  requestedAtUtc: Date,
  startedAtUtc?: Date,
  endedAtUtc?: Date
}

export function ArrangementPhaseSummary({ phase, requestedAtUtc, startedAtUtc, endedAtUtc }: ArrangementPhaseSummaryProps) {
  const cancelledColor = "#bdbdbd";
  const completedPhaseColor = "#00838f";
  const currentPhaseColor = "#ffc400";
  const futurePhaseColor = "#ddd";
  return (
    <Tooltip title={<>
      <p>Requested at {format(requestedAtUtc, "M/d/yy h:mm a")}</p>
      {startedAtUtc && <p>Started at {format(startedAtUtc, "M/d/yy h:mm a")}</p>}
      {endedAtUtc && <p>Ended at {format(endedAtUtc, "M/d/yy h:mm a")}</p>}
    </>}>
      <div style={{display: "flex", height: 8, backgroundColor: "red"}}>
        <div style={{flexGrow: 1,
          backgroundColor:
            phase === ArrangementPhase.Cancelled ? cancelledColor
            : phase === ArrangementPhase.SettingUp ? currentPhaseColor
            : phase === ArrangementPhase.ReadyToStart ? completedPhaseColor
            : phase === ArrangementPhase.Started ? completedPhaseColor
            : completedPhaseColor}}>
        </div>
        <div style={{flexGrow: 1,
          backgroundColor:
            phase === ArrangementPhase.Cancelled ? cancelledColor
            : phase === ArrangementPhase.SettingUp ? futurePhaseColor
            : phase === ArrangementPhase.ReadyToStart ? futurePhaseColor
            : phase === ArrangementPhase.Started ? currentPhaseColor
            : completedPhaseColor}}>
        </div>
        <div style={{flexGrow: 1,
          backgroundColor:
            phase === ArrangementPhase.Cancelled ? cancelledColor
            : phase === ArrangementPhase.SettingUp ? futurePhaseColor
            : phase === ArrangementPhase.ReadyToStart ? futurePhaseColor
            : phase === ArrangementPhase.Started ? futurePhaseColor
            : completedPhaseColor /* TODO: Show as currentPhaseColor if any closeout requirements are missing */}}>
        </div>
      </div>
    </Tooltip>
  );
}
