import { Tooltip } from "@mui/material";
import { format } from "date-fns";
import { CompletedRequirementInfo, ExemptedRequirementInfo, MissingArrangementRequirement } from "../../GeneratedClient";
import { useUserLookup } from "../../Model/DirectoryModel";
import { PersonName } from "../Families/PersonName";
import { IconRow } from "../IconRow";

type RequirementRowProps = {
  requirement: CompletedRequirementInfo | ExemptedRequirementInfo | MissingArrangementRequirement | string
}

export function RequirementRow({ requirement }: RequirementRowProps) {
  const userLookup = useUserLookup();
  
  return (
    requirement instanceof CompletedRequirementInfo
    ? <IconRow icon="✅" interactive>
        <Tooltip title={
          <>
            Completed by <PersonName person={userLookup(requirement.userId)} />
          </>}>
          <span>
            {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {requirement.completedAtUtc &&
              <span style={{float:'right'}}>
                {format(requirement.completedAtUtc, "M/d/yy h:mm a")}
              </span>}
          </span>
        </Tooltip>
      </IconRow>
    : requirement instanceof ExemptedRequirementInfo
    ? <IconRow icon="🚫" interactive>
        <Tooltip title={
          <>
            Granted by <PersonName person={userLookup(requirement.userId)} /> {format(requirement.timestampUtc!, "M/d/yy h:mm a")}
          </>}>
          <span>
            {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            {requirement.exemptionExpiresAtUtc &&
              <span style={{float:'right'}}>
                until {format(requirement.exemptionExpiresAtUtc, "MM/dd/yyyy")}
              </span>}
            <br />
            <span style={{lineHeight: '1.5em', paddingLeft: 30, fontStyle: 'italic'}}>
              {requirement.additionalComments}
            </span>
          </span>
        </Tooltip>
      </IconRow>
    : requirement instanceof MissingArrangementRequirement
    ? requirement.dueBy
      ? <IconRow icon='📅' interactive>
          {requirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          <span style={{float:'right'}}>{format(requirement.dueBy, "M/d/yy h:mm a")}</span>
        </IconRow>
      : <IconRow icon='❌' interactive>
          {requirement.actionName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          {requirement.pastDueSince && <span style={{float:'right'}}>{format(requirement.pastDueSince, "M/d/yy h:mm a")}</span>}
        </IconRow>
    : <IconRow icon="❌" interactive>{requirement}</IconRow>
  );
}
