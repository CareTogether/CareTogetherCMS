using CareTogether.Resources;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class ReferralCalculations
    {
        public static ReferralStatus CalculateReferralStatus(
            ReferralPolicy referralPolicy, ReferralEntry referralEntry, DateTime utcNow)
        {
            var missingIntakeRequirements = referralPolicy.RequiredIntakeActionNames.Where(requiredAction =>
                !SharedCalculations.RequirementMetOrExempted(requiredAction,
                    policySupersededAtUtc: null, utcNow: utcNow,
                    completedRequirements: referralEntry.CompletedRequirements,
                    exemptedRequirements: referralEntry.ExemptedRequirements))
                .ToImmutableList();

            var missingCustomFields = referralPolicy.CustomFields.Where(customField =>
                !referralEntry.CompletedCustomFields.Any(completed => completed.Key == customField.Name))
                .Select(customField => customField.Name)
                .ToImmutableList();

            var individualArrangements = referralEntry.Arrangements.ToImmutableDictionary(
                arrangement => arrangement.Key,
                arrangement =>
                {
                    ArrangementPolicy arrangementPolicy = referralPolicy.ArrangementPolicies
                        .Single(p => p.ArrangementType == arrangement.Value.ArrangementType);

                    return CalculateArrangementStatus(arrangement.Value,
                        arrangementPolicy, utcNow);
                });

            return new ReferralStatus(
                missingIntakeRequirements,
                missingCustomFields,
                individualArrangements);
        }


        internal static ArrangementStatus CalculateArrangementStatus(ArrangementEntry arrangement, ArrangementPolicy arrangementPolicy,
            DateTime utcNow)
        {
            var missingSetupRequirements = CalculateMissingSetupRequirements(arrangementPolicy.RequiredSetupActionNames,
                arrangement.CompletedRequirements, arrangement.ExemptedRequirements, utcNow);
            var missingMonitoringRequirements = CalculateMissingMonitoringRequirements(arrangementPolicy.RequiredMonitoringActions,
                arrangement.StartedAtUtc, arrangement.EndedAtUtc,
                arrangement.CompletedRequirements, arrangement.ExemptedRequirements, arrangement.ChildrenLocationHistory, utcNow);
            var missingCloseoutRequirements = CalculateMissingCloseoutRequirements(arrangementPolicy.RequiredCloseoutActionNames,
                arrangement.CompletedRequirements, arrangement.ExemptedRequirements, utcNow);
            var missingFunctionAssignments = CalculateMissingFunctionAssignments(arrangementPolicy.ArrangementFunctions,
                arrangement.FamilyVolunteerAssignments, arrangement.IndividualVolunteerAssignments);

            var phase = CalculateArrangementPhase(arrangement.StartedAtUtc, arrangement.EndedAtUtc, arrangement.CancelledAtUtc,
                missingSetupRequirements, missingFunctionAssignments);

            var missingRequirements = SelectMissingRequirementsForStatus(phase,
                missingSetupRequirements, missingMonitoringRequirements, missingCloseoutRequirements);

            return new ArrangementStatus(phase,
                missingRequirements); //TODO: Shouldn't missing function assignments be returned as well?
        }

        internal static ImmutableList<MissingArrangementRequirement> SelectMissingRequirementsForStatus(ArrangementPhase phase,
            ImmutableList<MissingArrangementRequirement> missingSetupRequirements,
            ImmutableList<MissingArrangementRequirement> missingMonitoringRequirements,
            ImmutableList<MissingArrangementRequirement> missingCloseoutRequirements) => phase switch
            {
                ArrangementPhase.SettingUp => missingSetupRequirements,
                ArrangementPhase.ReadyToStart => ImmutableList<MissingArrangementRequirement>.Empty,
                ArrangementPhase.Started => missingMonitoringRequirements,
                ArrangementPhase.Ended => missingCloseoutRequirements.Concat(missingMonitoringRequirements).ToImmutableList(),
                ArrangementPhase.Cancelled => ImmutableList<MissingArrangementRequirement>.Empty,
                _ => throw new NotImplementedException($"The arrangement phase '{phase}' has not been implemented.")
            };

        internal static ArrangementPhase CalculateArrangementPhase(
            DateTime? startedAtUtc, DateTime? endedAtUtc, DateTime? cancelledAtUtc,
            ImmutableList<MissingArrangementRequirement> missingSetupRequirements,
            ImmutableList<ArrangementFunction> missingFunctionAssignments) =>
            cancelledAtUtc.HasValue
                ? ArrangementPhase.Cancelled
                : endedAtUtc.HasValue
                ? ArrangementPhase.Ended
                : startedAtUtc.HasValue
                ? ArrangementPhase.Started
                : (missingSetupRequirements.Count == 0 && missingFunctionAssignments.Count == 0)
                ? ArrangementPhase.ReadyToStart
                : ArrangementPhase.SettingUp;

        internal static ImmutableList<MissingArrangementRequirement> CalculateMissingSetupRequirements(
            ImmutableList<string> requiredSetupActionNames, ImmutableList<CompletedRequirementInfo> completedRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedRequirements, DateTime utcNow) =>
            requiredSetupActionNames
                .Where(requiredAction =>
                    !SharedCalculations.RequirementMetOrExempted(requiredAction,
                        policySupersededAtUtc: null, utcNow: utcNow,
                        completedRequirements: completedRequirements,
                        exemptedRequirements: exemptedRequirements))
                .Select(requiredAction => new MissingArrangementRequirement(requiredAction, null, null))
                .ToImmutableList();

        internal static ImmutableList<MissingArrangementRequirement> CalculateMissingMonitoringRequirements(
            ImmutableList<MonitoringRequirement> requiredMonitoringActionNames,
            DateTime? startedAtUtc, DateTime? endedAtUtc,
            ImmutableList<CompletedRequirementInfo> completedRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedRequirements,
            ImmutableSortedSet<ChildLocationHistoryEntry> childLocationHistory,
            DateTime utcNow) =>
            requiredMonitoringActionNames.SelectMany(monitoringRequirement =>
                (startedAtUtc.HasValue
                ? CalculateMissingMonitoringRequirementInstances(monitoringRequirement.Recurrence,
                    startedAtUtc.Value, endedAtUtc,
                    completedRequirements
                    .Where(x => x.RequirementName == monitoringRequirement.ActionName)
                    .Select(x => x.CompletedAtUtc)
                    .OrderBy(x => x).ToImmutableList(),
                    childLocationHistory, utcNow)
                : ImmutableList<DateTime>.Empty)
                .Where(missingDueDate => !exemptedRequirements.Any(exempted =>
                    exempted.RequirementName == monitoringRequirement.ActionName &&
                    (!exempted.DueDate.HasValue || exempted.DueDate == missingDueDate.ToUniversalTime()) &&
                    (exempted.ExemptionExpiresAtUtc == null || exempted.ExemptionExpiresAtUtc > utcNow)))
                .Select(missingDueDate =>
                    new MissingArrangementRequirement(monitoringRequirement.ActionName,
                        DueBy: missingDueDate > utcNow ? missingDueDate : null,
                        PastDueSince: missingDueDate <= utcNow ? missingDueDate : null)))
                .ToImmutableList();

        internal static ImmutableList<DateTime> CalculateMissingMonitoringRequirementInstances(
            RecurrencePolicy recurrence, DateTime arrangementStartedAtUtc, DateTime? arrangementEndedAtUtc,
            ImmutableList<DateTime> completions, ImmutableSortedSet<ChildLocationHistoryEntry> childLocationHistory,
            DateTime utcNow)
        {
            return recurrence switch
            {
                DurationStagesRecurrencePolicy durationStages =>
                    CalculateMissingMonitoringRequirementInstancesForDurationRecurrence(
                        durationStages, arrangementStartedAtUtc, arrangementEndedAtUtc, utcNow, completions),
                DurationStagesPerChildLocationRecurrencePolicy durationStagesPerChildLocation =>
                    CalculateMissingMonitoringRequirementInstancesForDurationRecurrencePerChildLocation(
                        durationStagesPerChildLocation, arrangementStartedAtUtc, arrangementEndedAtUtc, utcNow,
                        completions, childLocationHistory),
                ChildCareOccurrenceBasedRecurrencePolicy childCareOccurences =>
                    CalculateMissingMonitoringRequirementInstancesForChildCareOccurrences(
                        childCareOccurences, arrangementStartedAtUtc, arrangementEndedAtUtc,
                        completions, childLocationHistory, utcNow),
                _ => throw new NotImplementedException(
                    $"The recurrence policy type '{recurrence.GetType().FullName}' has not been implemented.")
            };
        }

        internal static ImmutableList<DateTime> CalculateMissingMonitoringRequirementInstancesForDurationRecurrence(
            DurationStagesRecurrencePolicy recurrence,
            DateTime arrangementStartedAtUtc, DateTime? arrangementEndedAtUtc, DateTime utcNow,
            ImmutableList<DateTime> completions)
        {
            // Technically, the RecurrencePolicyStage model currently allows any stage to have an unlimited
            // # of occurrences, but that would be invalid, so check for those cases and throw an exception.
            //TODO: Move this into the policy loading code, or better yet fix the model to make this impossible.
            if (recurrence.Stages.Take(recurrence.Stages.Count - 1).Any(stage => !stage.MaxOccurrences.HasValue))
                throw new InvalidOperationException("A stage other than the last stage in a recurrence policy was found to have an unlimited number of occurrences.");

            // Calculate the start and end dates of each stage based on the recurrence policy and the arrangement start date.
            // A null end date means the stage continues indefinitely.
            // A null start date will only occur if invalid data is provided (i.e., if any stage other than the last one has
            // an unlimited number of occurrences), so this calculation forces start date results to be non-null.
            var arrangementStages = recurrence.Stages
                .Select(stage => (incrementDelay: stage.Delay, totalDuration: stage.Delay * stage.MaxOccurrences))
                .Aggregate(ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty,
                    (priorStages, stage) => priorStages.Add((stage.incrementDelay,
                        startDate: priorStages.Count == 0
                        ? arrangementStartedAtUtc
                        : priorStages.Last().endDate!.Value,
                        endDate: priorStages.Count == 0
                        ? arrangementStartedAtUtc + stage.totalDuration
                        : priorStages.Last().endDate!.Value + stage.totalDuration)));

            // For each completion, find the time of the following completion (null in the case of the last completion
            // unless the arrangement has ended, in which case use the end of the arrangement).
            // This represents the set of gaps between completions in which there could be missing requirement due dates.
            // Prepend this list with an entry representing the start of the arrangement.
            var completionGaps = completions.Select((completion, i) =>
                (start: completion, end: i + 1 >= completions.Count
                    ? (arrangementEndedAtUtc.HasValue ? arrangementEndedAtUtc.Value : null as DateTime?)
                    : completions[i + 1]))
                .Prepend((start: arrangementStartedAtUtc, end: completions.Count > 0
                    ? completions[0]
                    : (arrangementEndedAtUtc.HasValue ? arrangementEndedAtUtc.Value : null as DateTime?)))
                .ToImmutableList();

            // Calculate all missing requirements within each completion gap (there may be none).
            var missingRequirements = completionGaps.SelectMany(gap =>
                CalculateMissingMonitoringRequirementsWithinCompletionGap(utcNow, gap.start, gap.end, arrangementStages))
                .ToImmutableList();

            return missingRequirements;
        }
        internal static ImmutableList<DateTime> CalculateMissingMonitoringRequirementInstancesForDurationRecurrencePerChildLocation(
            DurationStagesPerChildLocationRecurrencePolicy recurrence,
            DateTime arrangementStartedAtUtc, DateTime? arrangementEndedAtUtc, DateTime utcNow,
            ImmutableList<DateTime> completions, ImmutableSortedSet<ChildLocationHistoryEntry> childLocationHistory)
        {
            // Technically, the RecurrencePolicyStage model currently allows any stage to have an unlimited
            // # of occurrences, but that would be invalid, so check for those cases and throw an exception.
            //TODO: Move this into the policy loading code, or better yet fix the model to make this impossible.
            if (recurrence.Stages.Take(recurrence.Stages.Count - 1).Any(stage => !stage.MaxOccurrences.HasValue))
                throw new InvalidOperationException("A stage other than the last stage in a recurrence policy was found to have an unlimited number of occurrences.");

            // Calculate the start and end dates of each stage based on the recurrence policy and the arrangement start date.
            // A null end date means the stage continues indefinitely.
            // A null start date will only occur if invalid data is provided (i.e., if any stage other than the last one has
            // an unlimited number of occurrences), so this calculation forces start date results to be non-null.
            var arrangementStages = recurrence.Stages
                .Select(stage => (incrementDelay: stage.Delay, totalDuration: stage.Delay * stage.MaxOccurrences))
                .Aggregate(ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)>.Empty,
                    (priorStages, stage) => priorStages.Add((stage.incrementDelay,
                        startDate: priorStages.Count == 0
                        ? arrangementStartedAtUtc
                        : priorStages.Last().endDate!.Value,
                        endDate: priorStages.Count == 0
                        ? arrangementStartedAtUtc + stage.totalDuration
                        : priorStages.Last().endDate!.Value + stage.totalDuration)));

            // For each completion, find the time of the following completion (null in the case of the last completion
            // unless the arrangement has ended, in which case use the end of the arrangement).
            // This represents the set of gaps between completions in which there could be missing requirement due dates.
            // Prepend this list with an entry representing the start of the arrangement.
            var completionGaps = completions.Select((completion, i) =>
                (start: completion, end: i + 1 >= completions.Count
                    ? (arrangementEndedAtUtc.HasValue ? arrangementEndedAtUtc.Value : null as DateTime?)
                    : completions[i + 1]))
                .Prepend((start: arrangementStartedAtUtc, end: completions.Count > 0
                    ? completions[0]
                    : (arrangementEndedAtUtc.HasValue ? arrangementEndedAtUtc.Value : null as DateTime?)))
                .ToImmutableList();

            // Calculate all missing requirements within each completion gap (there may be none).
            var missingRequirements = completionGaps.SelectMany(gap =>
                CalculateMissingMonitoringRequirementsWithinCompletionGap(utcNow, gap.start, gap.end, arrangementStages))
                .ToImmutableList();

            return missingRequirements;
        }

        internal static ImmutableList<DateTime> CalculateMissingMonitoringRequirementsWithinCompletionGap(
            DateTime utcNow, DateTime gapStart, DateTime? gapEnd,
            ImmutableList<(TimeSpan incrementDelay, DateTime startDate, DateTime? endDate)> arrangementStages)
        {
            // Use the current date as the end value if either the gap has no end or if the
            // current date is before the end of the gap.
            var effectiveEnd = !gapEnd.HasValue || utcNow <= gapEnd ? utcNow : gapEnd.Value;

            // Determine which recurrence stages apply to the completion gap.
            // One of three conditions makes a stage apply:
            //  1. It begins during the gap.
            //  2. It ends during the gap.
            //  3. It begins before the gap and either ends after the gap or doesn't end.
            var gapStages = arrangementStages.Where(stage =>
                (stage.startDate >= gapStart && stage.startDate <= effectiveEnd) ||
                (stage.endDate >= gapStart && stage.endDate <= effectiveEnd) ||
                (stage.startDate < gapStart && (stage.endDate > effectiveEnd || !stage.endDate.HasValue)))
                .ToImmutableList();

            // Calculate all missing requirements within the gap, using the stages to determine the
            // increment delays to apply.
            var dueDatesInGap = new List<DateTime>();
            var nextDueDate = null as DateTime?;
            var endConditionExceeded = false;
            do
            {
                if (nextDueDate != null)
                    dueDatesInGap.Add(nextDueDate.Value);

                // The applicable stage for this next requirement is either:
                //  1. the first of the gap stages if this is the first requirement being calculated, or
                //  2. the first of the gap stages that would end after this next requirement (self-referencing), or
                //  3. the first of the gap stages that has no end date (i.e., the last stage).
                // TODO: An unknown issue is causing this to match no stages in some cases.
                //       Is it possible for 'gapStages' to have zero elements?
                var applicableStage = gapStages.FirstOrDefault(stage =>
                    stage.endDate >= (nextDueDate ?? gapStart) + stage.incrementDelay ||
                    stage.endDate == null);
                if (applicableStage == default)
                    break;

                // Calculate the next requirement due date based on the applicable stage.
                // If it falls within the current completion gap (& before the current time), it is a missing requirement.
                nextDueDate = (nextDueDate ?? gapStart) + applicableStage.incrementDelay;

                // Include one more if this is the last gap and we want the next due-by date (not a missing requirement per se).
                // The end of the gap is a hard cut-off, but the current UTC date/time is a +1 cut-off (overshoot by one is needed).
                // Similarly, if the current UTC date/time falls before the end of the gap, use the +1 cut-off instead of the gap end.
                endConditionExceeded = gapEnd == null || utcNow < gapEnd
                    ? nextDueDate - applicableStage.incrementDelay > utcNow
                    : nextDueDate >= gapEnd;
            } while (!endConditionExceeded);

            return dueDatesInGap.ToImmutableList();
        }

        internal static ImmutableList<DateTime>
            CalculateMissingMonitoringRequirementInstancesForChildCareOccurrences(
            ChildCareOccurrenceBasedRecurrencePolicy recurrence,
            DateTime arrangementStartedAtUtc, DateTime? arrangementEndedAtUtc,
            ImmutableList<DateTime> completions, ImmutableSortedSet<ChildLocationHistoryEntry> childLocationHistory,
            DateTime utcNow)
        {
            // Determine the start and end time of each child location history entry
            var childCareOccurrences = childLocationHistory.SelectMany((entry, i) =>
            {
                if (i < childLocationHistory.Count - 1)
                {
                    var nextEntry = childLocationHistory[i + 1];
                    return new[] { (entry: entry, startDate: entry.TimestampUtc, endDate: nextEntry.TimestampUtc as DateTime?) };
                }
                else
                    return new[] { (entry: entry, startDate: entry.TimestampUtc, endDate: null as DateTime?) };
            }).ToImmutableList();

            // Determine which child care occurrences the requirement will apply to.
            var applicableOccurrences = childCareOccurrences
                .Where(x => x.entry.Plan != ChildLocationPlan.WithParent)
                .Where((x, i) => recurrence.Positive
                    ? i % recurrence.Frequency == recurrence.InitialSkipCount
                    : i % recurrence.Frequency != recurrence.InitialSkipCount)
                .ToImmutableList();

            // Determine which child care occurrences did not have a completion within the required delay timespan.
            var missedOccurrences = applicableOccurrences
                .Where(x => !completions.Any(c => c >= x.startDate && c <= x.startDate + recurrence.Delay))
                .ToImmutableList();

            // Return the due-by date of each missed occurrence.
            var missingInstances = missedOccurrences
                .Select(x => x.startDate + recurrence.Delay)
                .ToImmutableList();

            return missingInstances;
        }

        internal static ImmutableList<MissingArrangementRequirement> CalculateMissingCloseoutRequirements(
            ImmutableList<string> requiredCloseoutActionNames, ImmutableList<CompletedRequirementInfo> completedRequirements,
            ImmutableList<ExemptedRequirementInfo> exemptedRequirements, DateTime utcNow) =>
            requiredCloseoutActionNames
                .Where(requiredAction =>
                    !SharedCalculations.RequirementMetOrExempted(requiredAction,
                        policySupersededAtUtc: null, utcNow: utcNow,
                        completedRequirements: completedRequirements,
                        exemptedRequirements: exemptedRequirements))
                .Select(requiredAction => new MissingArrangementRequirement(requiredAction, null, null))
                .ToImmutableList();

        internal static ImmutableList<ArrangementFunction> CalculateMissingFunctionAssignments(
            ImmutableList<ArrangementFunction> volunteerFunctions,
            ImmutableList<FamilyVolunteerAssignment> familyVolunteerAssignments,
            ImmutableList<IndividualVolunteerAssignment> individualVolunteerAssignments) =>
            // NOTE: This calculation assumes that the current assignments are valid,
            //       implying that the assignments were validated when they were made.
            //TODO: Ensure assignments are validated (server-side) when they are made,
            //      and decide whether to flag changes in validity here or elsewhere.
            volunteerFunctions
                .Where(vf => (vf.Requirement == FunctionRequirement.ExactlyOne || vf.Requirement == FunctionRequirement.OneOrMore) &&
                    familyVolunteerAssignments.Where(fva => fva.ArrangementFunction == vf.FunctionName).Count() == 0 &&
                    individualVolunteerAssignments.Where(iva => iva.ArrangementFunction == vf.FunctionName).Count() == 0)
                .ToImmutableList();
    }
}
