import { Button } from "@mui/material";
import { formatRelative } from "date-fns";
import { useState } from "react";
import { Arrangement, ArrangementPhase } from "../../GeneratedClient";
import { CancelArrangementDialog } from "./CancelArrangementDialog";
import { EndArrangementDialog } from "./EndArrangementDialog";
import { StartArrangementDialog } from "./StartArrangementDialog";

type ArrangementCardTitleProps = {
  summaryOnly?: boolean
  referralId: string
  arrangement: Arrangement
}

export function ArrangementCardTitle({ summaryOnly, referralId, arrangement }: ArrangementCardTitleProps) {
  const now = new Date();

  const [showStartArrangementDialog, setShowStartArrangementDialog] = useState(false);
  const [showEndArrangementDialog, setShowEndArrangementDialog] = useState(false);
  const [showCancelArrangementDialog, setShowCancelArrangementDialog] = useState(false);

  return (
    <>
      <span style={{fontWeight: "bold"}}>{arrangement.arrangementType}</span>
      {summaryOnly &&
        <span style={{marginLeft: 40, float: "right"}}>
          {arrangement.phase === ArrangementPhase.Cancelled ? `Cancelled ${formatRelative(arrangement.cancelledAtUtc!, now)}`
            : arrangement.phase === ArrangementPhase.SettingUp ? "Setting up"
            : arrangement.phase === ArrangementPhase.ReadyToStart ? "Ready to start"
            : arrangement.phase === ArrangementPhase.Started ? `Started ${formatRelative(arrangement.startedAtUtc!, now)}`
            : `Ended ${formatRelative(arrangement.endedAtUtc!, now)}`}
        </span>}
      {!summaryOnly &&
        <span style={{marginLeft: 0, float: "right"}}>
          {arrangement.phase === ArrangementPhase.Cancelled ?
            `Cancelled ${formatRelative(arrangement.cancelledAtUtc!, now)}`
            : arrangement.phase === ArrangementPhase.SettingUp ?
              <>
                Setting up
                <Button variant="outlined" size="small"
                  style={{marginLeft: 10}}
                  onClick={() => setShowCancelArrangementDialog(true)}>
                  Cancel
                </Button>
              </>
            : arrangement.phase === ArrangementPhase.ReadyToStart ?
              <>
                <Button variant="outlined" size="small"
                  style={{marginLeft: 10}}
                  onClick={() => setShowCancelArrangementDialog(true)}>
                  Cancel
                </Button>
                <Button variant="contained" size="small"
                  style={{marginLeft: 10}}
                  onClick={() => setShowStartArrangementDialog(true)}>
                  Start
                </Button>
              </>
            : arrangement.phase === ArrangementPhase.Started ?
              <>
                <span>Started {formatRelative(arrangement.startedAtUtc!, now)}</span>
                <Button variant="outlined" size="small"
                  style={{marginLeft: 10}}
                  onClick={() => setShowEndArrangementDialog(true)}>
                  End
                </Button>
              </>
            : `Ended ${formatRelative(arrangement.endedAtUtc!, now)}`}
      </span>}
      {(showStartArrangementDialog && <StartArrangementDialog referralId={referralId} arrangement={arrangement}
        onClose={() => setShowStartArrangementDialog(false)} />) || null}
      {(showEndArrangementDialog && <EndArrangementDialog referralId={referralId} arrangement={arrangement}
        onClose={() => setShowEndArrangementDialog(false)} />) || null}
      {(showCancelArrangementDialog && <CancelArrangementDialog referralId={referralId} arrangement={arrangement}
        onClose={() => setShowCancelArrangementDialog(false)} />) || null}
    </>
  );
}