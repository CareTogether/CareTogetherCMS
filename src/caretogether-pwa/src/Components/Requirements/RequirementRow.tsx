import { format } from "date-fns";
import { CompletedRequirementInfo, ExemptedRequirementInfo, MissingArrangementRequirement } from "../../GeneratedClient";
import { IconRow } from "../IconRow";

type RequirementRowProps = {
  requirement: CompletedRequirementInfo | ExemptedRequirementInfo | MissingArrangementRequirement | string
}

export function RequirementRow({ requirement }: RequirementRowProps) {
  return (
    requirement instanceof CompletedRequirementInfo
    ? <IconRow icon="✅">
        {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        {requirement.completedAtUtc &&
          <span style={{float:'right', marginRight: 20}}>
            {format(requirement.completedAtUtc, "M/d/yy h:mm a")}
          </span>}
      </IconRow>
    : requirement instanceof ExemptedRequirementInfo
    ? <IconRow icon="🚫">
        {requirement.requirementName}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        {requirement.exemptionExpiresAtUtc &&
          <span style={{float:'right', marginRight: 20}}>
            until {format(requirement.exemptionExpiresAtUtc, "MM/dd/yyyy")}
          </span>}
        <br />
        <span style={{lineHeight: '1.5em', paddingLeft: 30, fontStyle: 'italic'}}>
          {requirement.additionalComments}
        </span>
      </IconRow>
    : requirement instanceof MissingArrangementRequirement
    ? requirement.dueBy
      ? <IconRow icon="📅">{requirement.actionName}</IconRow>
      : <IconRow icon="❌">{requirement.actionName}</IconRow>
    : <IconRow icon="❌">{requirement}</IconRow>
  );
}
