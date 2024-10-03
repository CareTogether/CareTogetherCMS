using CareTogether.Resources;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Microsoft.Kiota.Abstractions;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal static class ReferralCalculations
    {
        public static ReferralStatus CalculateReferralStatus(
            ReferralPolicy referralPolicy, ReferralEntry referralEntry, DateTime utcNow, TimeZoneInfo locationTimeZone)
        {
            var missingIntakeRequirements = referralPolicy.RequiredIntakeActionNames.Where(requiredAction =>
                !SharedCalculations.RequirementMetOrExempted(requiredAction,
                    policySupersededAtUtc: null, utcNow: utcNow,
                    completedRequirements: referralEntry.CompletedRequirements,
                    exemptedRequirements: referralEntry.ExemptedRequirements).IsMetOrExempted)
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
                        arrangementPolicy, utcNow, locationTimeZone);
                });

            return new ReferralStatus(
                missingIntakeRequirements,
                missingCustomFields,
                individualArrangements);
        }


        internal static ArrangementStatus CalculateArrangementStatus(ArrangementEntry arrangement, ArrangementPolicy arrangementPolicy,
            DateTime utcNow, TimeZoneInfo locationTimeZone)
        {
            var missingSetupRequirements = CalculateMissingSetupRequirements(
                arrangementPolicy, arrangement, utcNow);
            var missingMonitoringRequirements = CalculateMissingMonitoringRequirements(
                arrangementPolicy, arrangement, utcNow, locationTimeZone);
            var missingCloseoutRequirements = CalculateMissingCloseoutRequirements(
                arrangementPolicy, arrangement, utcNow);
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
            ArrangementPolicy arrangementPolicy, ArrangementEntry arrangement, DateTime utcNow)
        {
            var arrangementLevelResults = arrangementPolicy.RequiredSetupActionNames
                .Where(requiredAction =>
                    !SharedCalculations.RequirementMetOrExempted(requiredAction,
                        policySupersededAtUtc: null, utcNow: utcNow,
                        completedRequirements: arrangement.CompletedRequirements,
                        exemptedRequirements: arrangement.ExemptedRequirements).IsMetOrExempted)
                .Select(requiredAction => new MissingArrangementRequirement(
                    null, null, null, null,
                    requiredAction, null, null))
                .ToImmutableList();

            var familyAssignmentResults = arrangement.FamilyVolunteerAssignments
                .SelectMany(fva =>
                {
                    var functionVariant = arrangementPolicy.ArrangementFunctions
                        .SingleOrDefault(af => af.FunctionName == fva.ArrangementFunction)
                        ?.Variants?.SingleOrDefault(afv => afv.VariantName == fva.ArrangementFunctionVariant);

                    if (functionVariant == null)
                        return ImmutableList<MissingArrangementRequirement>.Empty;

                    return functionVariant.RequiredSetupActionNames
                        .Where(requiredAction =>
                            !SharedCalculations.RequirementMetOrExempted(requiredAction,
                                policySupersededAtUtc: null, utcNow: utcNow,
                                completedRequirements: fva.CompletedRequirements,
                                exemptedRequirements: fva.ExemptedRequirements).IsMetOrExempted)
                        .Select(requiredAction => new MissingArrangementRequirement(
                            fva.ArrangementFunction, fva.ArrangementFunctionVariant, fva.FamilyId, null,
                            requiredAction, null, null))
                        .ToImmutableList();
                })
                .ToImmutableList();

            var individualAssignmentResults = arrangement.IndividualVolunteerAssignments
                .SelectMany(iva =>
                {
                    var functionVariant = arrangementPolicy.ArrangementFunctions
                        .SingleOrDefault(af => af.FunctionName == iva.ArrangementFunction)
                        ?.Variants?.SingleOrDefault(afv => afv.VariantName == iva.ArrangementFunctionVariant);

                    if (functionVariant == null)
                        return ImmutableList<MissingArrangementRequirement>.Empty;

                    return functionVariant.RequiredSetupActionNames
                        .Where(requiredAction =>
                            !SharedCalculations.RequirementMetOrExempted(requiredAction,
                                policySupersededAtUtc: null, utcNow: utcNow,
                                completedRequirements: iva.CompletedRequirements,
                                exemptedRequirements: iva.ExemptedRequirements).IsMetOrExempted)
                        .Select(requiredAction => new MissingArrangementRequirement(
                            iva.ArrangementFunction, iva.ArrangementFunctionVariant, iva.FamilyId, iva.PersonId,
                            requiredAction, null, null))
                        .ToImmutableList();
                })
                .ToImmutableList();

            return arrangementLevelResults
                .Concat(familyAssignmentResults)
                .Concat(individualAssignmentResults)
                .ToImmutableList();
        }

        internal static ImmutableList<MissingArrangementRequirement> CalculateMissingMonitoringRequirements(
            ArrangementPolicy arrangementPolicy, ArrangementEntry arrangement, DateTime utcNow, TimeZoneInfo locationTimeZone)
        {
            var arrangementLevelResults = arrangementPolicy.RequiredMonitoringActions
                .SelectMany(monitoringRequirement =>
                    (arrangement.StartedAtUtc.HasValue
                    ? CalculateMissingMonitoringRequirementInstances(monitoringRequirement.Recurrence,
                        filterToFamilyId: null,
                        arrangement.StartedAtUtc.Value, arrangement.EndedAtUtc,
                        arrangement.CompletedRequirements
                            .Where(x => x.RequirementName == monitoringRequirement.ActionName)
                            .Select(x => x.CompletedAtUtc)
                            .OrderBy(x => x).ToImmutableList(),
                        arrangement.ChildLocationHistory, utcNow, locationTimeZone)
                    : ImmutableList<DateTime>.Empty)
                    .Where(missingDueDate => !arrangement.ExemptedRequirements.Any(exempted =>
                        exempted.RequirementName == monitoringRequirement.ActionName &&
                        (!exempted.DueDate.HasValue || exempted.DueDate == missingDueDate.ToUniversalTime()) &&
                        (exempted.ExemptionExpiresAtUtc == null || exempted.ExemptionExpiresAtUtc > utcNow)))
                    .Select(missingDueDate =>
                        new MissingArrangementRequirement(
                            null, null, null, null,
                            monitoringRequirement.ActionName,
                            DueBy: missingDueDate > utcNow ? missingDueDate : null,
                            PastDueSince: missingDueDate <= utcNow ? missingDueDate : null)))
                .ToImmutableList();

            var familyAssignmentResults = arrangement.FamilyVolunteerAssignments
                .SelectMany(fva =>
                {
                    var functionVariant = arrangementPolicy.ArrangementFunctions
                        .SingleOrDefault(af => af.FunctionName == fva.ArrangementFunction)
                        ?.Variants?.SingleOrDefault(afv => afv.VariantName == fva.ArrangementFunctionVariant);

                    if (functionVariant == null)
                        return ImmutableList<MissingArrangementRequirement>.Empty;

                    return functionVariant.RequiredMonitoringActions
                        .SelectMany(monitoringRequirement =>
                            (arrangement.StartedAtUtc.HasValue
                            ? CalculateMissingMonitoringRequirementInstances(monitoringRequirement.Recurrence,
                                filterToFamilyId: fva.FamilyId,
                                arrangement.StartedAtUtc.Value, arrangement.EndedAtUtc,
                                fva.CompletedRequirements
                                    .Where(x => x.RequirementName == monitoringRequirement.ActionName)
                                    .Select(x => x.CompletedAtUtc)
                                    .OrderBy(x => x).ToImmutableList(),
                                arrangement.ChildLocationHistory, utcNow, locationTimeZone)
                            : ImmutableList<DateTime>.Empty)
                            .Where(missingDueDate => !fva.ExemptedRequirements.Any(exempted =>
                                exempted.RequirementName == monitoringRequirement.ActionName &&
                                (!exempted.DueDate.HasValue || exempted.DueDate == missingDueDate.ToUniversalTime()) &&
                                (exempted.ExemptionExpiresAtUtc == null || exempted.ExemptionExpiresAtUtc > utcNow)))
                            .Select(missingDueDate =>
                                new MissingArrangementRequirement(
                                    fva.ArrangementFunction, fva.ArrangementFunctionVariant, fva.FamilyId, null,
                                    monitoringRequirement.ActionName,
                                    DueBy: missingDueDate > utcNow ? missingDueDate : null,
                                    PastDueSince: missingDueDate <= utcNow ? missingDueDate : null)))
                        .ToImmutableList();
                })
                .ToImmutableList();

            var individualAssignmentResults = arrangement.IndividualVolunteerAssignments
                .SelectMany(iva =>
                {
                    var functionVariant = arrangementPolicy.ArrangementFunctions
                        .SingleOrDefault(af => af.FunctionName == iva.ArrangementFunction)
                        ?.Variants?.SingleOrDefault(afv => afv.VariantName == iva.ArrangementFunctionVariant);

                    if (functionVariant == null)
                        return ImmutableList<MissingArrangementRequirement>.Empty;

                    return functionVariant.RequiredMonitoringActions
                        .SelectMany(monitoringRequirement =>
                            (arrangement.StartedAtUtc.HasValue
                            ? CalculateMissingMonitoringRequirementInstances(monitoringRequirement.Recurrence,
                                filterToFamilyId: iva.FamilyId,
                                arrangement.StartedAtUtc.Value, arrangement.EndedAtUtc,
                                iva.CompletedRequirements
                                    .Where(x => x.RequirementName == monitoringRequirement.ActionName)
                                    .Select(x => x.CompletedAtUtc)
                                    .OrderBy(x => x).ToImmutableList(),
                                arrangement.ChildLocationHistory, utcNow, locationTimeZone)
                            : ImmutableList<DateTime>.Empty)
                            .Where(missingDueDate => !iva.ExemptedRequirements.Any(exempted =>
                                exempted.RequirementName == monitoringRequirement.ActionName &&
                                (!exempted.DueDate.HasValue || exempted.DueDate == missingDueDate.ToUniversalTime()) &&
                                (exempted.ExemptionExpiresAtUtc == null || exempted.ExemptionExpiresAtUtc > utcNow)))
                            .Select(missingDueDate =>
                                new MissingArrangementRequirement(
                                    iva.ArrangementFunction, iva.ArrangementFunctionVariant, iva.FamilyId, iva.PersonId,
                                    monitoringRequirement.ActionName,
                                    DueBy: missingDueDate > utcNow ? missingDueDate : null,
                                    PastDueSince: missingDueDate <= utcNow ? missingDueDate : null)))
                        .ToImmutableList();
                })
                .ToImmutableList();

            return arrangementLevelResults
                .Concat(familyAssignmentResults)
                .Concat(individualAssignmentResults)
                .ToImmutableList();
        }

        // The delay defined in the policies should be considered as "full days" delay. So a delay of 2 days means the
        // requirement can be met at any time in the following 2 days after the startedAt date.
        // For that reason, we convert the datetimes to the client (location) timezone during calculation,
        // to avoid a completion falling in the next day for example.
        internal static ImmutableList<DateTime> CalculateMissingMonitoringRequirementInstances(
             RecurrencePolicy recurrence, Guid? filterToFamilyId,
             DateTime arrangementStartedAtUtc, DateTime? arrangementEndedAtUtc,
             ImmutableList<DateTime> completions, ImmutableSortedSet<ChildLocationHistoryEntry> childLocationHistory,
             DateTime utcNow, TimeZoneInfo locationTimeZone)
        {
            //////////////////////////////////////////////////
            //TODO: Move these timezone conversions out of the ReferralCalculations class and into the policy evaluation engine,
            //      where they can be performed by a helper class.

            // INPUTS: Given in UTC with time --> convert to location time --> extract date-only.
            // OUTPUTS: Calculated in date-only --> convert to location time @ midnight --> return as UTC.

            var currentLocationTime = TimeZoneInfo.ConvertTimeFromUtc(utcNow, locationTimeZone);

            var arrangementStartedAtInLocationTime = TimeZoneInfo.ConvertTimeFromUtc(arrangementStartedAtUtc, locationTimeZone);
            var arrangementStartedDate = DateOnly.FromDateTime(arrangementStartedAtInLocationTime);

            var arrangementEndedAtInLocationTime = arrangementEndedAtUtc.HasValue ? TimeZoneInfo.ConvertTimeFromUtc(arrangementEndedAtUtc.Value, locationTimeZone) : (DateTime?)null;
            var arrangementEndedDate = arrangementEndedAtInLocationTime.HasValue ? DateOnly.FromDateTime(arrangementEndedAtInLocationTime.Value) : (DateOnly?)null;

            var completionDates = completions
                .Select(completionWithTime =>
                {
                    var completionInLocationTime = TimeZoneInfo.ConvertTimeFromUtc(completionWithTime, locationTimeZone);
                    var completionDate = DateOnly.FromDateTime(completionInLocationTime);
                    return completionDate;
                })
                .ToImmutableList();

            var today = DateOnly.FromDateTime(utcNow);

            ImmutableList<DateTime> WrapWithTimeInUtc(ImmutableList<DateOnly> dates)
            {
                return dates.Select(date =>
                {
                    var dateInLocationTime = new DateTime(date, TimeOnly.MinValue);
                    var dateTimeInUtc = TimeZoneInfo.ConvertTimeToUtc(dateInLocationTime, locationTimeZone);
                    return dateTimeInUtc;
                }).ToImmutableList();
            }

            var childLocationHistoryDates = childLocationHistory.Select(childLocation =>
            {
                var timestampInLocationTime = TimeZoneInfo.ConvertTimeFromUtc(childLocation.TimestampUtc, locationTimeZone);
                var childLocationWithTimestampInLocationTime = childLocation with { TimestampUtc = timestampInLocationTime };
                return childLocationWithTimestampInLocationTime;
            }).ToImmutableSortedSet();


            //////////////////////////////////////////////////

            return recurrence switch
            {
                OneTimeRecurrencePolicy oneTime => WrapWithTimeInUtc(
                    CalculateMissingMonitoringRequirementInstancesForOneTimeRecurrence(
                        oneTime, arrangementStartedDate, completionDates, today)),
                DurationStagesRecurrencePolicy durationStages => WrapWithTimeInUtc(
                    CalculateMissingMonitoringRequirementInstancesForDurationRecurrence(
                        durationStages, arrangementStartedDate, arrangementEndedDate, today, completionDates)),
                DurationStagesPerChildLocationRecurrencePolicy durationStagesPerChildLocation => WrapWithTimeInUtc(
                    CalculateMissingMonitoringRequirementInstancesForDurationRecurrencePerChildLocation(
                        durationStagesPerChildLocation, filterToFamilyId, arrangementStartedDate, arrangementEndedDate, today,
                        completionDates, childLocationHistoryDates, locationTimeZone)
                ),
                ChildCareOccurrenceBasedRecurrencePolicy childCareOccurences => WrapWithTimeInUtc(
                    CalculateMissingMonitoringRequirementInstancesForChildCareOccurrences(
                        childCareOccurences, filterToFamilyId, arrangementStartedAtUtc, arrangementEndedAtUtc,
                        completionDates, childLocationHistoryDates, utcNow)
                ),
                _ => throw new NotImplementedException(
                    $"The recurrence policy type '{recurrence.GetType().FullName}' has not been implemented.")
            };
        }

        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementInstancesForOneTimeRecurrence(
            OneTimeRecurrencePolicy recurrence, DateOnly arrangementStartedDate,
            ImmutableList<DateOnly> completions, DateOnly today)
        {
            if (recurrence.Delay.HasValue)
            {
                var dueDate = arrangementStartedDate.AddDays(recurrence.Delay.Value.Days);

                if (completions.Any(completion => completion <= dueDate))
                {
                    return [];
                }
                else
                {
                    return [dueDate];
                }
            }
            else
            {
                if (completions.IsEmpty)
                {
                    return [arrangementStartedDate];
                }
                else
                {
                    return [];
                }
            }
        }

        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementInstancesForDurationRecurrence(
            DurationStagesRecurrencePolicy recurrence,
            DateOnly arrangementStartedDate, DateOnly? arrangementEndedDate, DateOnly today,
            ImmutableList<DateOnly> completionDates)
        {

            // Technically, the RecurrencePolicyStage model currently allows any stage to have an unlimited
            // # of occurrences, but that would be invalid, so check for those cases and throw an exception.
            //TODO: Move this into the policy loading code, or better yet fix the model to make this impossible.
            if (recurrence.Stages.Take(recurrence.Stages.Count - 1).Any(stage => !stage.MaxOccurrences.HasValue))
                throw new InvalidOperationException("A stage other than the last stage in a recurrence policy was found to have an unlimited number of occurrences.");

            // Calculate the start and end dates of each stage based on the recurrence policy and the arrangement start date.
            // A null end date means the stage continues indefinitely, so for simplicity this case will be
            // represented as DateTime.MaxValue.
            // A null start date will only occur if invalid data is provided (i.e., if any stage other than the last one has
            // an unlimited number of occurrences), so this calculation forces start date results to be non-null.
            var arrangementStages = recurrence.Stages
                .Select(stage => (incrementDelay: stage.Delay, totalDuration: stage.Delay * stage.MaxOccurrences))
                .Aggregate(ImmutableList<(TimeSpan incrementDelay, DateOnly startDate, DateOnly endDate)>.Empty,
                    (priorStages, stage) =>
                    {
                        var startDate = priorStages.Count == 0 ? arrangementStartedDate : priorStages.Last().endDate;
                        var endDate = stage.totalDuration.HasValue ? startDate.AddDays(stage.totalDuration.Value.Days) : DateOnly.MaxValue;
                        return priorStages.Add((stage.incrementDelay, startDate, endDate));
                    })
                .Select(result => (
                    result.incrementDelay,
                    timeSpan: new AbsoluteTimeSpan(new DateTime(result.startDate, new TimeOnly()), new DateTime(result.endDate, new TimeOnly()))))
                .ToImmutableList();

            ImmutableList<DateRange> calculateDateRanges(ImmutableList<DateRange> dateRanges, int delay, int occurrences)
            {
                if (occurrences != 0)
                {
                    return calculateDateRanges(
                        dateRanges.Add(
                            new DateRange(
                                dateRanges.Last().End.AddDays(1),
                                dateRanges.Last().End.AddDays(delay)
                            )
                        ),
                        delay,
                        occurrences - 1
                    );
                }

                return dateRanges;
            };

            ImmutableList<DateRange> calculateDateRanges2(DateOnly startDate, int delay, int occurrences, ImmutableList<DateRange>? dateRanges = null)
            {
                if (dateRanges == null)
                {
                    return calculateDateRanges2(startDate, delay, occurrences - 1, [new DateRange(startDate, startDate.AddDays(delay - 1))]);
                }

                if (occurrences != 0)
                {
                    return calculateDateRanges2(
                        startDate,
                        delay,
                        occurrences - 1,
                        dateRanges.Add(
                            new DateRange(
                                dateRanges.Last().End.AddDays(1),
                                dateRanges.Last().End.AddDays(delay)
                            )
                        )
                    );
                }

                return dateRanges;
            };

            var completionWindows = recurrence.Stages
                .Aggregate(ImmutableList<DateRange>.Empty, (windows, stage) =>
                {
                    var isFirst = windows.IsEmpty;
                    var startDate = isFirst ? arrangementStartedDate : windows.Last().End.AddDays(1);
                    var endDate = startDate.AddDays(stage.Delay.Days - (isFirst ? 0 : 1));

                    var dateRange = new DateRange(startDate, endDate);

                    if (stage.MaxOccurrences == null)
                    {
                        var occurrences = (today.DayNumber - endDate.DayNumber) / stage.Delay.Days;

                        return windows.Concat(calculateDateRanges([dateRange], stage.Delay.Days, occurrences)).ToImmutableList();
                    }

                    var totalDuration = stage.Delay * stage.MaxOccurrences;

                    if ((endDate.DayNumber - startDate.DayNumber) == totalDuration.Value.Days)
                    {
                        return windows.Add(dateRange);
                    }

                    return windows.Concat(calculateDateRanges([dateRange], stage.Delay.Days, stage.MaxOccurrences.Value)).ToImmutableList();
                });

            // For each completion, find the time of the following completion (null in the case of the last completion
            // unless the arrangement has ended, in which case use the end of the arrangement).
            // This represents the set of gaps between completions in which there could be missing requirement due dates.
            // Prepend this list with an entry representing the start of the arrangement.
            // Edge cases:
            //   1. There is an edge case where the last completion occurs *after* the end of the arrangement;
            //      in this case, exclude that completion from the list of gaps.
            //      TODO: Should we simply ignore all completions after the end of the arrangement?
            //   2. If a completion occurs *before* the beginning of the arrangement,
            //      it will simply be ignored.
            var validCompletions = completionDates
                .Where(completion => completion >= arrangementStartedDate)
                .ToImmutableList();
            var completionGapsRaw = validCompletions
                .Where((completion, i) =>
                    i + 1 >= validCompletions.Count && arrangementEndedDate.HasValue
                        ? completion < arrangementEndedDate.Value
                        : true)
                .Select((completion, i) =>
                    (start: completion, end: i + 1 >= validCompletions.Count
                        ? (arrangementEndedDate.HasValue ? arrangementEndedDate.Value : DateOnly.MaxValue)
                        : validCompletions[i + 1]))
                .Prepend((start: arrangementStartedDate, end: validCompletions.Count > 0
                    ? validCompletions[0]
                    : (arrangementEndedDate.HasValue ? arrangementEndedDate.Value : DateOnly.MaxValue)));

            var completionGaps = completionGapsRaw
                .Select(gap => new Timeline(new DateTime(gap.start, new TimeOnly()), new DateTime(gap.end, new TimeOnly())))
                .ToImmutableList();

            // var gaps = validCompletions
            //     .Where((completion, i) =>
            //         i + 1 >= validCompletions.Count && arrangementEndedDate.HasValue
            //             ? completion < arrangementEndedDate.Value
            //             : true)
            //     .Select((completion, index) =>
            //         (start: index == 0 ? arrangementStartedDate : validCompletions[index - 1], end: completion))
            //     .ToImmutableList();

            // var completionGaps2 = completionGapsRaw
            //     .Aggregate(ImmutableList<DateRange>.Empty, (dateRanges, gap) =>
            //     {
            //         var isFirst = dateRanges.IsEmpty;

            //         var dateRange = new DateRange(gap.start, gap.end);

            //         return dateRanges.Add(dateRange);
            //     })
            //     .ToImmutableList();

            // var completionWindowsTimeline = new DateOnlyTimeline(completionWindows);

            // var completionGapsTimeline = new DateOnlyTimeline(completionGaps2);

            // var diff = completionGapsTimeline.Difference(completionWindowsTimeline);

            // var completionsTimeline = new DateOnlyTimeline(validCompletions.Select(completion => new DateRange(completion, completion)).ToImmutableList());

            // var test = completionWindowsTimeline.Difference(completionGapsTimeline);

            // var completionDateRanges = completionGapsRaw
            // .Select(gap => new DateRange(gap.start, gap.end))
            // .ToImmutableList();

            var stages = recurrence.Stages
                .Aggregate(ImmutableList<DateRange<RecurrencePolicyStage>>.Empty, (windows, stage) =>
                {
                    var isFirst = windows.IsEmpty;
                    var startDate = isFirst ? arrangementStartedDate : windows.Last().End.AddDays(1);

                    var occurrences = stage.MaxOccurrences ?? ((today.DayNumber - startDate.DayNumber) / stage.Delay.Days) + 2;

                    var totalDuration = stage.Delay * occurrences;
                    var endDate = startDate.AddDays(totalDuration.Days - (isFirst ? 0 : 1));

                    var dateRange = new DateRange<RecurrencePolicyStage>(startDate, endDate, stage);

                    return windows.Add(dateRange);
                })
                .ToImmutableList();

            var stagesTimeline = new DateOnlyTimeline<RecurrencePolicyStage>(stages);




            // completionDateRanges.Aggregate(ImmutableList<DateOnly>.Empty, (dueDates, completionRange) =>
            // {

            //     var applicableArrangementStage = stagesTimeline.ValueAt(completionRange.End);

            //     var startDate = dueDates.IsEmpty ? completionRange.Start : dueDates.Last();

            //     var completionWindow = new DateRange(startDate, startDate.AddDays(applicableArrangementStage.Delay.Days));

            //     var tm1 = new DateOnlyTimeline([completionWindow]);
            //     var tm2 = new DateOnlyTimeline([completionRange]);
            //     var diff = tm1.Difference(tm2);

            //     if (diff == null)
            //     {
            //         return dueDates;
            //     }

            //     return dueDates.Add(completionWindow.End);
            // });

            // var dueDates = validCompletions
            //     .Select((completion, index) => new { Index = index, Value = completion })
            //     .Aggregate(ImmutableList<DateOnly>.Empty, (dueDates, completion) =>
            //     {
            //         var isFirst = completion.Index == 0;

            //         var applicableArrangementStage = stagesTimeline.ValueAt(completion.Value);

            //         var startDate = isFirst ? arrangementStartedDate : validCompletions[completion.Index - 1].AddDays(1);


            //         var completionTimeline = new DateRange(startDate, completion.Value);
            //         var completionWindow = new DateRange(startDate, arrangementStartedDate.AddDays(applicableArrangementStage.Delay.Days));

            //         if (DateOnlyTimeline.UnionOf(ImmutableList.Create(completionTimeline, completionWindow)).Equals(new DateOnlyTimeline([completionWindow])))
            //         {
            //             return dueDates;
            //         }
            //         else
            //         {
            //             return dueDates;
            //         }




            //         var found = stagesTimeline.Ranges.Find(range => range.Contains(completion.Value));

            //         var occurrences = applicableArrangementStage.MaxOccurrences ?? ((today.DayNumber - found.Start.DayNumber) / applicableArrangementStage.Delay.Days) + 2;

            //         var completionWindow2 = new DateRange(arrangementStartedDate, arrangementStartedDate.AddDays(applicableArrangementStage.Delay.Days));

            //         var completionWindows = new DateOnlyTimeline(calculateDateRanges2(found.Start, applicableArrangementStage.Delay.Days, occurrences));

            //         if (!completionWindow.Contains(completion.Value))
            //         {
            //             return dueDates.Add(completionWindow.End);
            //         }

            //         return dueDates;
            //     });

            var slots = recurrence.Stages
                .SelectMany(stage => Enumerable.Repeat<string?>(null, stage.MaxOccurrences ?? 1).ToImmutableList(), (stage, slot) => new { stage, slot });

            ImmutableList<BaseDate> calcMissing(DateOnly initialBaseDate, RecurrencePolicyStage stage, ImmutableList<BaseDate>? dates = null)
            {

                var window = new DateRange(initialBaseDate.AddDays(1), initialBaseDate.AddDays(stage.Delay.Days));

                var completion = validCompletions.Find(window.Contains);

                var newBaseDate = completion != default ? new BaseDate(completion, false) : new BaseDate(window.End, true);

                var newDates = dates == null ? ImmutableList.Create(newBaseDate) : dates.Add(newBaseDate);

                if (newBaseDate.Date >= today || newBaseDate.Date >= arrangementEndedDate)
                {
                    return newDates;
                }

                return calcMissing(newBaseDate.Date, stage, newDates);
            }

            var ueh = slots.Aggregate(ImmutableList<BaseDate>.Empty, (baseDates, slot) =>
            {


                var baseDate = baseDates.IsEmpty ? arrangementStartedDate : baseDates.Last().Date;

                var window = new DateRange(baseDate.AddDays(baseDates.IsEmpty ? 0 : 1), baseDate.AddDays(slot.stage.Delay.Days));

                var completion = validCompletions.Find(completion => window.Contains(completion));

                var newBaseDate = completion != default ? new BaseDate(completion, false) : new BaseDate(window.End, true);

                if (slot.stage.MaxOccurrences == null)
                {
                    return baseDates.Add(newBaseDate).Concat(calcMissing(newBaseDate.Date, slot.stage)).ToImmutableList();
                }

                return baseDates.Add(newBaseDate);
            });

            var imClose = ueh.Where(date => date.IsMissing).Select(item => item.Date).ToImmutableList();

            var imClose2 = imClose.Where(date => date <= today).ToImmutableList();

            var imClose3 = imClose.Count > imClose2.Count ? imClose2.Add(imClose[imClose2.Count]) : imClose2;

            return imClose;

            var baseDates = ImmutableList<DateOnly>.Empty;
            var missingDueDates = ImmutableList<DateOnly>.Empty;
            var currentCompletionIndex = 0;


            RecurrencePolicyStage? applicableArrangementStage = null;
            int? maxOccurrences = null;

            var startDate = arrangementStartedDate;
            var startDateForApplicable = arrangementStartedDate;

            var stop = false;
            do
            {
                var isFirst = baseDates.IsEmpty;

                applicableArrangementStage = stagesTimeline.ValueAt(startDateForApplicable.AddDays(1));
                // applicableArrangementStage = ;

                if (applicableArrangementStage == null)
                {
                    break;
                }

                maxOccurrences = applicableArrangementStage.MaxOccurrences;

                var endDate = startDate.AddDays(applicableArrangementStage.Delay.Days);

                var window = new DateRange(startDate, endDate);

                DateOnly? completion = validCompletions.Count > currentCompletionIndex ? validCompletions[currentCompletionIndex] : null;

                // var dueDate = completion ?? window.End;

                // startDate = dueDate;
                // startDateForApplicable = window.End.AddDays(1);

                // dueDates = dueDates.Add(dueDate);


                if (completion == null || !window.Contains(completion.Value))
                {
                    missingDueDates = missingDueDates.Add(window.End);
                    startDate = window.End;
                    startDateForApplicable = window.End;
                    baseDates = baseDates.Add(window.End);
                    continue;
                }

                startDate = completion.Value;
                baseDates = baseDates.Add(completion.Value);
                startDateForApplicable = window.End;
                currentCompletionIndex = currentCompletionIndex + 1;

                if (!baseDates.IsEmpty && baseDates.Last() >= today)
                {
                    stop = true;
                    // break;
                }


            } while (!stop);

            // return missingDueDates.ToImmutableList();

            // Calculate all missing requirements within each completion gap (there may be none).
            var missingRequirements = completionGaps.SelectMany((gap, index) =>
                CalculateMissingMonitoringRequirementsWithinCompletionGap(today, gap, arrangementStages))
                .ToImmutableList();

            return missingRequirements;
        }
        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementInstancesForDurationRecurrencePerChildLocation(
            DurationStagesPerChildLocationRecurrencePolicy recurrence, Guid? filterToFamilyId,
            DateOnly arrangementStartedDate, DateOnly? arrangementEndedDate, DateOnly today,
            ImmutableList<DateOnly> completionDates, ImmutableSortedSet<ChildLocationHistoryEntry> childLocationHistoryDates, TimeZoneInfo locationTimeZone)
        {
            // Technically, the RecurrencePolicyStage model currently allows any stage to have an unlimited
            // # of occurrences, but that would be invalid, so check for those cases and throw an exception.
            //TODO: Move this into the policy loading code, or better yet fix the model to make this impossible.
            if (recurrence.Stages.Take(recurrence.Stages.Count - 1).Any(stage => !stage.MaxOccurrences.HasValue))
                throw new InvalidOperationException("A stage other than the last stage in a recurrence policy was found to have an unlimited number of occurrences.");

            // Determine the start and end time of each child location history entry.
            var childCareOccurrences = childLocationHistoryDates.SelectMany((entry, i) =>
            {
                if (i < childLocationHistoryDates.Count - 1)
                {
                    var nextEntry = childLocationHistoryDates[i + 1];
                    return new[] { (entry: entry, startDate: entry.TimestampUtc, endDate: nextEntry.TimestampUtc as DateTime?) };
                }
                else
                    return new[] { (entry: entry, startDate: entry.TimestampUtc, endDate: null as DateTime?) };
            }).ToImmutableList();

            // Determine which child care occurrences the requirement will apply to.
            var applicableOccurrences = childCareOccurrences
                .Where(x => x.entry.Plan != ChildLocationPlan.WithParent &&
                    (filterToFamilyId == null || x.entry.ChildLocationFamilyId == filterToFamilyId))
                .ToImmutableList();

            // Group the child care occurrences by child location (i.e., by the family caring for the child).
            // This results in a (discontinuous) timeline of start and end dates/times for the child being in this location.
            var occurrencesByLocation = applicableOccurrences
                .GroupBy(x => x.entry.ChildLocationFamilyId)
                .ToImmutableDictionary(x => x.Key);

            // Build a (possibly discontinuous) timeline for the child's stay in each location.
            // This will simplify subsequent calculations along this timeline.
            var timelinesByLocation = occurrencesByLocation.Select(occurrences =>
            {
                var terminatingStages = occurrences.Value
                    .Where(occurrence => occurrence.endDate != null)
                    .Select(occurrence => new TerminatingTimelineStage(occurrence.startDate, (DateTime)occurrence.endDate!))
                    .ToImmutableList();

                var currentOccurrence = occurrences.Value
                    .SingleOrDefault(occurrence => occurrence.endDate == null);

                var timeline = currentOccurrence == default
                ? new Timeline(terminatingStages)
                : new Timeline(terminatingStages, new NonTerminatingTimelineStage(currentOccurrence.startDate));

                return KeyValuePair.Create(occurrences.Key, timeline);
            }).ToImmutableDictionary();

            // For each discontinuous child location timeline, calculate the adjusted start and end dates of each stage
            // of the recurrence policy.
            // A "max" end date means the stage continues indefinitely (which can only apply to the current child's location).
            var arrangementStagesByLocation = timelinesByLocation.Select(timeline =>
            {
                var arrangementStages = recurrence.Stages
                    .Select(stage => (incrementDelay: stage.Delay, totalDuration: stage.Delay * stage.MaxOccurrences))
                    .Aggregate(ImmutableList<(TimeSpan startDelay, TimeSpan incrementDelay, TimeSpan? totalDuration)>.Empty,
                        (priorStages, stage) => priorStages.Add(
                            (startDelay: new TimeSpan(priorStages.Sum(x => ((TimeSpan)x.totalDuration!).Ticks)),
                            incrementDelay: stage.incrementDelay,
                            totalDuration: stage.totalDuration)))
                    .Select(stage => (incrementDelay: stage.incrementDelay,
                        timeSpan: stage.totalDuration.HasValue
                        ? timeline.Value.MapUnbounded(stage.startDelay, (TimeSpan)stage.totalDuration)
                        : new AbsoluteTimeSpan(timeline.Value.MapUnbounded(stage.startDelay), DateTime.MaxValue)))
                    .ToImmutableList();
                return KeyValuePair.Create(timeline.Key, arrangementStages);
            }).ToImmutableDictionary();

            // Assign completions to their corresponding child location by determining which timeline contains them.
            var completionGapsByLocation = timelinesByLocation.Select(location =>
            {
                var containedCompletions = completionDates
                    .Where(completion => location.Value.Contains(new DateTime(completion, new TimeOnly())))
                    .ToImmutableList();

                // For each completion, find the time of the following completion (null in the case of the last completion
                // unless the location's timeline terminates, in which case use the end of the location's timeline).
                // This represents the set of gaps between completions in which there could be missing requirement due dates.
                // Prepend this list with an entry representing the start of the location's timeline.
                var completionGaps = containedCompletions.Select((completion, i) =>
                    (start: completion, end: i + 1 >= containedCompletions.Count
                        ? DateOnly.FromDateTime(location.Value.End)
                        : containedCompletions[i + 1]))
                    .Prepend((start: arrangementStartedDate, end: containedCompletions.Count > 0
                        ? containedCompletions[0]
                        : DateOnly.FromDateTime(location.Value.End)))
                    .ToImmutableList();

                // Represent gaps as timelines (subsets of their location timeline) to automatically handle
                // any discontinuities in the location's timeline.
                var completionGapTimelines = completionGaps.Select(completion =>
                    location.Value.Subset(new DateTime(completion.start, new TimeOnly()), new DateTime(completion.end, new TimeOnly()))).ToImmutableList();

                return KeyValuePair.Create(location.Key, completionGapTimelines);
            }).ToImmutableDictionary();

            // Calculate all missing requirements within each completion gap timeline (there may be none).
            var missingRequirements = completionGapsByLocation
                .SelectMany(locationGaps =>
                locationGaps.Value.SelectMany(gap =>
                    CalculateMissingMonitoringRequirementsWithinCompletionGap(today, gap,
                    arrangementStagesByLocation[locationGaps.Key])))
                .ToImmutableList();

            return missingRequirements;
        }

        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementsWithinCompletionGap2(
            DateOnly today, DateRange completionGap,
            ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)> arrangementStages)
        {
            // Use the current date as the end value if either the gap has no end (represented by DateTime.MaxValue)
            // or if the current date is before the end of the gap (these logically reduce to the same condition).
            var effectiveCompletionGapEndDate = today <= completionGap.End ? today : completionGap.End;
            var effectiveCompletionGapEnd = effectiveCompletionGapEndDate;

            // Determine which recurrence stages apply to the completion gap.
            // One of three conditions makes a stage apply:
            //  1. It begins during the gap.
            //  2. It ends during the gap.
            //  3. It begins before the gap and either ends after the gap or doesn't end.
            var gapStages = arrangementStages.Where(stage =>
                (DateOnly.FromDateTime(stage.timeSpan.Start) >= completionGap.Start && DateOnly.FromDateTime(stage.timeSpan.Start) <= effectiveCompletionGapEnd) ||
                (DateOnly.FromDateTime(stage.timeSpan.End) >= completionGap.Start && DateOnly.FromDateTime(stage.timeSpan.End) <= effectiveCompletionGapEnd) ||
                (DateOnly.FromDateTime(stage.timeSpan.Start) < completionGap.Start && DateOnly.FromDateTime(stage.timeSpan.End) > effectiveCompletionGapEnd))
                .ToImmutableList();

            // Calculate all missing requirements within the gap, using the stages to determine the
            // increment delays to apply.
            var dueDatesInGap = new List<DateOnly>();
            var nextDueDate = null as DateOnly?;
            var stop = false;
            do
            {
                if (nextDueDate != null)
                    dueDatesInGap.Add(nextDueDate.Value);

                // The applicable stage for this next requirement is either:
                //  1. the first of the gap stages if this is the first requirement being calculated, or
                //  2. the first of the gap stages that would end after this next requirement (self-referencing), or
                //  3. the first of the gap stages that has no end date (i.e., the last stage).
                //     Note that case #3 is just a subset of #2 when "no end date" is represented by DateTime.MaxValue.
                // TODO: An unknown issue is causing this to match no stages in some cases.
                //       Is it possible for 'gapStages' to have zero elements?
                var applicableArrangementStage = gapStages.FirstOrDefault(stage =>
                    DateOnly.FromDateTime(stage.timeSpan.End) >= (nextDueDate ?? completionGap.Start).AddDays(stage.incrementDelay.Days));
                if (applicableArrangementStage == default)
                    break;


                // var completionWindow = new DateRange(startDate, startDate.AddDays(applicableArrangementStage.Delay.Days));

                var startDate = nextDueDate ?? completionGap.Start;
                var window = new DateOnlyTimeline([new DateRange(startDate, startDate.AddDays(applicableArrangementStage.incrementDelay.Days))]);
                var tm2 = new DateOnlyTimeline([completionGap]);
                var diff = window.Difference(tm2);



                var fallsWithin = completionGap.Contains(nextDueDate.HasValue ? nextDueDate.Value : completionGap.Start.AddDays(applicableArrangementStage.incrementDelay.Days));

                // nextDueDate = nextDueDateMap.HasValue ? DateOnly.FromDateTime(nextDueDateMap.Value) : null;
                nextDueDate = !fallsWithin ? completionGap.End.AddDays(applicableArrangementStage.incrementDelay.Days) : null;
                if (nextDueDate == null)
                    break;

                // Include one more if this is the last gap and we want the next due-by date (not a missing requirement per se).
                // The end of the gap is a hard cut-off, but the current UTC date/time is a +1 cut-off (overshoot by one is needed).
                // Similarly, if the current UTC date/time falls before the end of the gap, use the +1 cut-off instead of the gap end.
                stop = today < completionGap.End
                    ? nextDueDate.Value.AddDays(-applicableArrangementStage.incrementDelay.Days) > today
                    : nextDueDate.Value >= completionGap.End;
            } while (!stop);

            return dueDatesInGap.ToImmutableList();
        }


        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementsWithinCompletionGap(
            DateOnly today, Timeline completionGap,
            ImmutableList<(TimeSpan incrementDelay, AbsoluteTimeSpan timeSpan)> arrangementStages)
        {
            // Use the current date as the end value if either the gap has no end (represented by DateTime.MaxValue)
            // or if the current date is before the end of the gap (these logically reduce to the same condition).
            var effectiveCompletionGapEndDate = today <= completionGap.EndDate ? today : completionGap.EndDate;
            var effectiveCompletionGapEnd = new DateTime(effectiveCompletionGapEndDate, new TimeOnly());

            // Determine which recurrence stages apply to the completion gap.
            // One of three conditions makes a stage apply:
            //  1. It begins during the gap.
            //  2. It ends during the gap.
            //  3. It begins before the gap and either ends after the gap or doesn't end.
            var gapStages = arrangementStages.Where(stage =>
                (stage.timeSpan.Start >= completionGap.Start && stage.timeSpan.Start <= effectiveCompletionGapEnd) ||
                (stage.timeSpan.End >= completionGap.Start && stage.timeSpan.End <= effectiveCompletionGapEnd) ||
                (stage.timeSpan.Start < completionGap.Start && stage.timeSpan.End > effectiveCompletionGapEnd))
                .ToImmutableList();

            // Calculate all missing requirements within the gap, using the stages to determine the
            // increment delays to apply.
            var dueDatesInGap = new List<DateOnly>();
            var nextDueDate = null as DateOnly?;
            var endConditionExceeded = false;
            do
            {
                if (nextDueDate != null)
                    dueDatesInGap.Add(nextDueDate.Value);

                // The applicable stage for this next requirement is either:
                //  1. the first of the gap stages if this is the first requirement being calculated, or
                //  2. the first of the gap stages that would end after this next requirement (self-referencing), or
                //  3. the first of the gap stages that has no end date (i.e., the last stage).
                //     Note that case #3 is just a subset of #2 when "no end date" is represented by DateTime.MaxValue.
                // TODO: An unknown issue is causing this to match no stages in some cases.
                //       Is it possible for 'gapStages' to have zero elements?
                var applicableArrangementStage = gapStages.FirstOrDefault(stage =>
                    DateOnly.FromDateTime(stage.timeSpan.End) >= (nextDueDate ?? completionGap.StartDate).AddDays(stage.incrementDelay.Days));
                if (applicableArrangementStage == default)
                    break;

                // Calculate the next requirement due date based on the applicable stage, using the gap's timeline.
                // If it falls within the current completion gap (& before the current time), it is a missing requirement.
                var nextDueDateMap = completionGap.TryMapFrom(
                    nextDueDate.HasValue ? new DateTime(nextDueDate.Value, new TimeOnly()) : new DateTime(completionGap.StartDate, new TimeOnly()),
                    applicableArrangementStage.incrementDelay
                );
                nextDueDate = nextDueDateMap.HasValue ? DateOnly.FromDateTime(nextDueDateMap.Value) : null;
                if (nextDueDate == null)
                    break;

                // Include one more if this is the last gap and we want the next due-by date (not a missing requirement per se).
                // The end of the gap is a hard cut-off, but the current UTC date/time is a +1 cut-off (overshoot by one is needed).
                // Similarly, if the current UTC date/time falls before the end of the gap, use the +1 cut-off instead of the gap end.
                endConditionExceeded = today < completionGap.EndDate
                    ? nextDueDate.Value.AddDays(-applicableArrangementStage.incrementDelay.Days) > today
                    : nextDueDate.Value >= completionGap.EndDate;
            } while (!endConditionExceeded);

            return dueDatesInGap.ToImmutableList();
        }

        internal static ImmutableList<DateOnly>
            CalculateMissingMonitoringRequirementInstancesForChildCareOccurrences(
            ChildCareOccurrenceBasedRecurrencePolicy recurrence, Guid? filterToFamilyId,
            DateTime arrangementStartedAtUtc, DateTime? arrangementEndedAtUtc,
            ImmutableList<DateOnly> completionDates, ImmutableSortedSet<ChildLocationHistoryEntry> childLocationHistory,
            DateTime utcNow)
        {
            // Determine the start and end time of each child location history entry.
            var childCareOccurrences = childLocationHistory.SelectMany((entry, i) =>
            {
                if (i < childLocationHistory.Count - 1)
                {
                    var nextEntry = childLocationHistory[i + 1];
                    return new[] { (entry: entry, startDate: DateOnly.FromDateTime(entry.TimestampUtc), endDate: DateOnly.FromDateTime(nextEntry.TimestampUtc) as DateOnly?) };
                }
                else
                    return new[] { (entry: entry, startDate: DateOnly.FromDateTime(entry.TimestampUtc), endDate: null as DateOnly?) };
            }).ToImmutableList();

            // Determine which child care occurrences the requirement will apply to.
            var applicableOccurrences = childCareOccurrences
                .Where(x => x.entry.Plan != ChildLocationPlan.WithParent &&
                    (filterToFamilyId == null || x.entry.ChildLocationFamilyId == filterToFamilyId))
                .Where((x, i) => recurrence.Positive
                    ? i % recurrence.Frequency == recurrence.InitialSkipCount
                    : i % recurrence.Frequency != recurrence.InitialSkipCount)
                .ToImmutableList();

            // Determine which child care occurrences did not have a completion within the required delay timespan.
            var missedOccurrences = applicableOccurrences
                .Where(x => !completionDates.Any(c => c >= x.startDate && c <= x.startDate.AddDays(recurrence.Delay.Days)))
                .ToImmutableList();

            // Return the due-by date of each missed occurrence.
            var missingInstances = missedOccurrences
                .Select(x => x.startDate.AddDays(recurrence.Delay.Days))
                .ToImmutableList();

            return missingInstances;
        }

        internal static ImmutableList<MissingArrangementRequirement> CalculateMissingCloseoutRequirements(
            ArrangementPolicy arrangementPolicy, ArrangementEntry arrangement, DateTime utcNow)
        {
            var arrangementLevelResults = arrangementPolicy.RequiredCloseoutActionNames
                .Where(requiredAction =>
                    !SharedCalculations.RequirementMetOrExempted(requiredAction,
                        policySupersededAtUtc: null, utcNow: utcNow,
                        completedRequirements: arrangement.CompletedRequirements,
                        exemptedRequirements: arrangement.ExemptedRequirements).IsMetOrExempted)
                .Select(requiredAction => new MissingArrangementRequirement(
                    null, null, null, null,
                    requiredAction, null, null))
                .ToImmutableList();

            var familyAssignmentResults = arrangement.FamilyVolunteerAssignments
                .SelectMany(fva =>
                {
                    var functionVariant = arrangementPolicy.ArrangementFunctions
                        .SingleOrDefault(af => af.FunctionName == fva.ArrangementFunction)
                        ?.Variants?.SingleOrDefault(afv => afv.VariantName == fva.ArrangementFunctionVariant);

                    if (functionVariant == null)
                        return ImmutableList<MissingArrangementRequirement>.Empty;

                    return functionVariant.RequiredCloseoutActionNames
                        .Where(requiredAction =>
                            !SharedCalculations.RequirementMetOrExempted(requiredAction,
                                policySupersededAtUtc: null, utcNow: utcNow,
                                completedRequirements: fva.CompletedRequirements,
                                exemptedRequirements: fva.ExemptedRequirements).IsMetOrExempted)
                        .Select(requiredAction => new MissingArrangementRequirement(
                            fva.ArrangementFunction, fva.ArrangementFunctionVariant, fva.FamilyId, null,
                            requiredAction, null, null))
                        .ToImmutableList();
                })
                .ToImmutableList();

            var individualAssignmentResults = arrangement.IndividualVolunteerAssignments
                .SelectMany(iva =>
                {
                    var functionVariant = arrangementPolicy.ArrangementFunctions
                        .SingleOrDefault(af => af.FunctionName == iva.ArrangementFunction)
                        ?.Variants?.SingleOrDefault(afv => afv.VariantName == iva.ArrangementFunctionVariant);

                    if (functionVariant == null)
                        return ImmutableList<MissingArrangementRequirement>.Empty;

                    return functionVariant.RequiredCloseoutActionNames
                        .Where(requiredAction =>
                            !SharedCalculations.RequirementMetOrExempted(requiredAction,
                                policySupersededAtUtc: null, utcNow: utcNow,
                                completedRequirements: iva.CompletedRequirements,
                                exemptedRequirements: iva.ExemptedRequirements).IsMetOrExempted)
                        .Select(requiredAction => new MissingArrangementRequirement(
                            iva.ArrangementFunction, iva.ArrangementFunctionVariant, iva.FamilyId, iva.PersonId,
                            requiredAction, null, null))
                        .ToImmutableList();
                })
                .ToImmutableList();

            return arrangementLevelResults
                .Concat(familyAssignmentResults)
                .Concat(individualAssignmentResults)
                .ToImmutableList();
        }

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

public class BaseDate
{
    public DateOnly Date { get; set; }
    public bool IsMissing { get; set; }

    public BaseDate(DateOnly baseDate, bool IsMissing)
    {
        Date = baseDate;
        this.IsMissing = IsMissing;
    }
}