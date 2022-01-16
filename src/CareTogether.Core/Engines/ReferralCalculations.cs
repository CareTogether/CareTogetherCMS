using CareTogether.Resources;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Engines
{
    internal static class ReferralCalculations
    {
        public static ArrangementStatus CalculateArrangementStatus(ArrangementEntry arrangement, ArrangementPolicy arrangementPolicy,
            DateTime utcNow)
        {
            var missingSetupRequirements = CalculateMissingSetupRequirements(arrangement, arrangementPolicy);
            var missingMonitoringRequirements = CalculateMissingMonitoringRequirements(arrangement, arrangementPolicy, utcNow);
            var missingCloseoutRequirements = CalculateMissingCloseoutRequirements(arrangement, arrangementPolicy);
            var missingFunctionAssignments = CalculateMissingFunctionAssignments(arrangement, arrangementPolicy);

            var phase = CalculateArrangementPhase(arrangement, missingSetupRequirements, missingFunctionAssignments);

            var missingRequirements = SelectMissingRequirements(phase,
                missingSetupRequirements, missingMonitoringRequirements, missingCloseoutRequirements);

            return new ArrangementStatus(phase,
                missingRequirements);
        }


        internal static ImmutableList<string> SelectMissingRequirements(ArrangementPhase phase,
            ImmutableList<string> missingSetupRequirements,
            ImmutableList<string> missingMonitoringRequirements,
            ImmutableList<string> missingCloseoutRequirements) => phase switch
            {
                ArrangementPhase.SettingUp => missingSetupRequirements,
                ArrangementPhase.ReadyToStart => ImmutableList<string>.Empty,
                ArrangementPhase.Started => missingMonitoringRequirements,
                ArrangementPhase.Ended => missingCloseoutRequirements,
                _ => throw new NotImplementedException($"The arrangement phase '{phase}' has not been implemented.")
            };

        internal static ArrangementPhase CalculateArrangementPhase(ArrangementEntry arrangement,
            ImmutableList<string> missingSetupRequirements,
            ImmutableList<VolunteerFunction> missingFunctionAssignments) =>
            missingSetupRequirements.Count > 0 || missingFunctionAssignments.Count > 0
                ? ArrangementPhase.SettingUp
                : !arrangement.StartedAtUtc.HasValue
                ? ArrangementPhase.ReadyToStart
                : !arrangement.EndedAtUtc.HasValue
                ? ArrangementPhase.Started
                : ArrangementPhase.Ended;

        internal static ImmutableList<string> CalculateMissingSetupRequirements(ArrangementEntry arrangement,
            ArrangementPolicy arrangementPolicy) =>
            arrangementPolicy.RequiredSetupActionNames.Where(requiredAction =>
                !arrangement.CompletedRequirements.Any(completed => completed.RequirementName == requiredAction))
                .ToImmutableList();

        internal static ImmutableList<string> CalculateMissingMonitoringRequirements(ArrangementEntry arrangement,
            ArrangementPolicy arrangementPolicy, DateTime utcNow) =>
            arrangementPolicy.RequiredMonitoringActionNames.SelectMany(monitoringRequirement =>
                (arrangement.StartedAtUtc.HasValue
                ? CalculateMissingMonitoringRequirementInstances(monitoringRequirement.Recurrence, arrangement.StartedAtUtc.Value,
                    arrangement.CompletedRequirements
                    .Where(x => x.RequirementName == monitoringRequirement.ActionName)
                    .Select(x => x.CompletedAtUtc)
                    .OrderBy(x => x).ToImmutableList(),
                    utcNow)
                : ImmutableList<DateTime>.Empty)
                .Select(missingDueDate => (monitoringRequirement.ActionName, DueDate: missingDueDate)))
                .OrderBy(missingRequirement => missingRequirement.DueDate)
                .Select(missingRequirement => missingRequirement.ActionName) //TODO: Remove this when the return type supports the date!
                .ToImmutableList();

        internal static ImmutableList<DateTime> CalculateMissingMonitoringRequirementInstances(
            RecurrencePolicy recurrence, DateTime arrangementStartedAtUtc, ImmutableList<DateTime> completions, DateTime utcNow)
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

            // For each completion, find the time of the following completion (null in the case of the last completion).
            // This represents the set of gaps between completions in which there could be missing requirement due dates.
            // Prepend this list with an entry representing the start of the arrangement.
            var completionGaps = completions.Select((completion, i) =>
                (start: completion, end: i + 1 >= completions.Count ? null as DateTime? : completions[i + 1]))
                .Prepend((arrangementStartedAtUtc, completions.Count > 0 ? completions[0] : null))
                .ToImmutableList();

            // Calculate all missing requirements within each completion gap (there may be none).
            var missingRequirements = completionGaps.SelectMany(gap =>
            {
                // Use the current date as the end value if either the gap has no end or if the
                // current date is before the end of the gap.
                var effectiveEnd = !gap.end.HasValue || utcNow <= gap.end ? utcNow : gap.end.Value;

                // Determine which recurrence stages apply to the completion gap.
                // One of three conditions makes a stage apply:
                //  1. It begins during the gap.
                //  2. It ends during the gap.
                //  3. It begins before the gap and either ends after the gap or doesn't end.
                var gapStages = arrangementStages.Where(stage =>
                    (stage.startDate >= gap.start && stage.startDate <= effectiveEnd) ||
                    (stage.endDate >= gap.start && stage.endDate <= effectiveEnd) ||
                    (stage.startDate < gap.start && (stage.endDate > effectiveEnd || !stage.endDate.HasValue)))
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
                    var applicableStage = gapStages.First(stage =>
                        nextDueDate == null ||
                        stage.endDate > nextDueDate + stage.incrementDelay ||
                        stage.endDate == null);

                    // Calculate the next requirement due date based on the applicable stage.
                    // If it falls within the current completion gap (& before the current time), it is a missing requirement.
                    nextDueDate = (nextDueDate ?? gap.start) + applicableStage.incrementDelay;

                    // Include one more if this is the last gap and we want the next due-by date (not a missing requirement per se).
                    // The end of the gap is a hard cut-off, but the current UTC date/time is a +1 cut-off (overshoot by one is needed).
                    endConditionExceeded = gap.end != null
                        ? nextDueDate < gap.end
                        : nextDueDate - applicableStage.incrementDelay < utcNow;
                } while (!endConditionExceeded);

                return dueDatesInGap;
            }).ToImmutableList();

            return missingRequirements;
        }

        internal static ImmutableList<string> CalculateMissingCloseoutRequirements(ArrangementEntry arrangement,
            ArrangementPolicy arrangementPolicy) =>
            arrangementPolicy.RequiredCloseoutActionNames.Where(requiredAction =>
                !arrangement.CompletedRequirements.Any(completed => completed.RequirementName == requiredAction))
                .ToImmutableList();

        internal static ImmutableList<VolunteerFunction> CalculateMissingFunctionAssignments(ArrangementEntry arrangement,
            ArrangementPolicy arrangementPolicy) =>
            arrangementPolicy.VolunteerFunctions
                .Where(vf => (vf.Requirement == FunctionRequirement.ExactlyOne || vf.Requirement == FunctionRequirement.OneOrMore) &&
                    arrangement.FamilyVolunteerAssignments.Where(fva => fva.ArrangementFunction == vf.ArrangementFunction).Count() == 0 &&
                    arrangement.IndividualVolunteerAssignments.Where(iva => iva.ArrangementFunction == vf.ArrangementFunction).Count() == 0)
                .ToImmutableList();
    }
}
