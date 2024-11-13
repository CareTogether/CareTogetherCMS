using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
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
             ImmutableList<DateTime> completions, ImmutableSortedSet<ChildLocationHistoryEntry> childLocationHistoryEntries,
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

            var childLocationHistory = childLocationHistoryEntries.Select(childLocationEntry =>
            {
                var timestampInLocationTime = TimeZoneInfo.ConvertTimeFromUtc(childLocationEntry.TimestampUtc, locationTimeZone);
                var childLocationDate = DateOnly.FromDateTime(timestampInLocationTime);
                return new ChildLocation(
                    childLocationEntry.ChildLocationFamilyId,
                    childLocationDate,
                    Paused: childLocationEntry.Plan == ChildLocationPlan.WithParent
                );
            }).ToImmutableSortedSet();


            //////////////////////////////////////////////////

            return recurrence switch
            {
                OneTimeRecurrencePolicy oneTime => WrapWithTimeInUtc(
                    CalculateMissingMonitoringRequirementInstancesForOneTimeRecurrence(
                        oneTime, arrangementStartedDate, completionDates)),
                DurationStagesRecurrencePolicy durationStages => WrapWithTimeInUtc(
                    CalculateMissingMonitoringRequirementInstancesForDurationRecurrence(
                        durationStages, arrangementStartedDate, arrangementEndedDate, today, completionDates)),
                DurationStagesPerChildLocationRecurrencePolicy durationStagesPerChildLocation => WrapWithTimeInUtc(
                    CalculateMissingMonitoringRequirementInstancesForDurationRecurrencePerChildLocation(
                        durationStagesPerChildLocation, filterToFamilyId, arrangementStartedDate, arrangementEndedDate, today,
                        completionDates, childLocationHistory)
                ),
                ChildCareOccurrenceBasedRecurrencePolicy childCareOccurences => WrapWithTimeInUtc(
                    CalculateMissingMonitoringRequirementInstancesForChildCareOccurrences(
                        childCareOccurences, filterToFamilyId, completionDates, childLocationHistory)
                ),
                _ => throw new NotImplementedException(
                    $"The recurrence policy type '{recurrence.GetType().FullName}' has not been implemented.")
            };
        }

        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementInstancesForOneTimeRecurrence(
            OneTimeRecurrencePolicy recurrence, DateOnly arrangementStartedDate,
            ImmutableList<DateOnly> completions)
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

            var searchableTimeline = new DateOnlyTimeline([new DateRange(arrangementStartedDate)]);

            var dueDates = CalculateDueDatesInTimeline(
                recurrence.Stages,
                completionDates,
                searchableTimeline,
                today,
                arrangementEndedDate
            );

            return dueDates;
        }

        internal static DateOnlyTimeline? CreateChildLocationBasedTimeline(
            ImmutableList<ChildLocation> childLocations,
            Guid? filterToFamilyId = null
        )
        {
            var dateRanges = GenerateDateRanges(childLocations).ToImmutableList();

            var filteredDateRanges = (
                    filterToFamilyId != null
                        ? dateRanges
                            .Where(item => item.Tag == filterToFamilyId)
                        : dateRanges
                )
                .Select(item => new DateRange(item.Start, item.End))
                .ToImmutableList();

            if (filteredDateRanges.IsEmpty)
            {
                return null;
            }

            return new DateOnlyTimeline(filteredDateRanges);
        }

        private static IEnumerable<DateRange<Guid>> GenerateDateRanges(ImmutableList<ChildLocation> childLocations)
        {
            DateOnly? startDate = null;
            Guid? tag = null;

            foreach (var childLocation in childLocations)
            {
                if (!startDate.HasValue && !childLocation.Paused)
                {
                    startDate = childLocation.Date;
                    tag = childLocation.ChildLocationFamilyId;
                    continue;
                }

                if (startDate.HasValue && tag.HasValue && childLocation.Paused)
                {
                    yield return new DateRange<Guid>(startDate.Value, childLocation.Date, tag.Value);
                    startDate = null;
                    continue;
                }
            }

            if (startDate.HasValue && tag.HasValue)
            {
                yield return new DateRange<Guid>(startDate.Value, tag.Value);
            }
        }


        internal static DateOnlyTimeline? GetWindowForExpectedCompletion(
            DateOnly startDate,
            TimeSpan windowLength,
            DateOnlyTimeline searchableTimeline
        )
        {
            var baseWindowTimeline = new DateOnlyTimeline([new DateRange(startDate)]);

            var searchableTimelineFromWindowStartDate = baseWindowTimeline.IntersectionWith(searchableTimeline);

            var window = searchableTimelineFromWindowStartDate?.TakeDays(windowLength.Days);

            if (window == default || window.TotalDaysInclusive() < windowLength.Days)
            {
                return null;
            }

            var isDiscontinuousWindow = window.Ranges.Count > 1;

            // If resulting window is discontinuous, it means there's a pause in the timeline.
            // Currently, the app adds 1 more day to the window length if there was a pause.
            // So this condition is for backwards compatibility purpose.
            if (isDiscontinuousWindow)
            {
                var lastDayRange = new DateRange(window.End.AddDays(1), window.End.AddDays(1));

                return new DateOnlyTimeline(window.Ranges.Add(lastDayRange));
            }

            return window;
        }

        internal static DateOfInterest CalculateNextDateOfInterest(
            DateOnlyTimeline window,
            ImmutableList<DateOnly> completions
        )
        {
            var completion = completions.Find(window.Contains);

            var completionIsMissing = completion == default;

            if (!completionIsMissing)
            {
                return new DateOfInterest(completion, IsMissing: false);
            }

            return new DateOfInterest(window.Ranges.Last().End, IsMissing: true);
        }

        internal static IEnumerable<DateOfInterest> IterateDatesOfInterest(
            DateOnly lastDateOfInterest,
            ImmutableList<DateOnly> completions,
            TimeSpan windowLength,
            DateOnlyTimeline searchableTimeline
       )
        {
            DateOnly nextWindowStartDate = lastDateOfInterest.AddDays(1);

            while (true)
            {
                // This is the window in which we expect to find a completion.
                // This can be a continuous or discontinuous timeline (based on child location history).
                // The end of the window represents the due date for this slot.
                var nextWindow = GetWindowForExpectedCompletion(
                    nextWindowStartDate,
                    windowLength,
                    searchableTimeline
                );

                // This case only happens if a policy gets 'paused'
                // (when a child location changes to WithParent) during the policy window.
                if (nextWindow == null)
                {
                    yield break;
                }

                // Search for a completion inside current window.
                // Note that this timeline could be discontinuous based on child location history.
                var nextDateOfInterest = CalculateNextDateOfInterest(
                    nextWindow, completions);

                yield return nextDateOfInterest;

                nextWindowStartDate = nextDateOfInterest.Date.AddDays(1);
            }
        }

        internal static ImmutableList<DateOnly> CalculateDueDatesInTimeline(
            ImmutableList<RecurrencePolicyStage> recurrenceStages,
            ImmutableList<DateOnly> completionDates,
            DateOnlyTimeline searchableTimeline,
            DateOnly today,
            DateOnly? arrangementEndedDate
        )
        {
            var validCompletions = completionDates
                .Where(completion => completion >= searchableTimeline.Start)
                .ToImmutableList();

            // Checking for a completion at the start date first simplifies the rest of the calculation.
            // For example, when there's just one policy stage with MaxOccurrences = null, the resulting dates are offsetted,
            // creating the need to make the recursive calculation aware if it's the first calculation, i. e. start date and delay are offset or not,
            // so the rest of the calculation have a different offset, compensanting the first offset.
            // Another problem is a stack overflow (infinite recursion), creating the need of always passing a new list of completions,
            // removing the ones that were already checked.
            var completionOnDayOne = validCompletions.Find(item => item == searchableTimeline.Start);
            var applicableStages = completionOnDayOne != default && recurrenceStages.Count > 1
                ? recurrenceStages.Skip(1)
                : recurrenceStages;

            // Generates slots in which we need to look for a completion. Each stage generates a number of slots
            // equal to its MaxOccurrences, or just 1 if MaxOccurrences is null (which should be the last stage, or the only one).
            // A slot doesn't have a start/end date because there's no way of determining all the start/end dates beforehand, it depends on previus
            // calculated dates of interest (either a completion or due date).
            var slots = applicableStages
                .SelectMany(stage =>
                    Enumerable
                        .Repeat(stage, stage.MaxOccurrences ?? 1)
                        .ToImmutableList());


            // For each slot, find a list of all dates of interest (meaning dates of completion or due dates, which are used
            // to calculate the next window).
            var datesOfInterest = slots
                .Aggregate(ImmutableList<DateOfInterest>.Empty, (dates, slot) =>
                    {
                        var lastDateOfInterest = dates.LastOrDefault()?.Date ?? searchableTimeline.Start;

                        var allPossibleNextDatesIterator = IterateDatesOfInterest(
                            lastDateOfInterest,
                            validCompletions,
                            slot.Delay,
                            searchableTimeline
                        );

                        var nextDates = slot.MaxOccurrences == null
                            ? allPossibleNextDatesIterator.TakeWhilePlusOne(nextDateOfInterest =>
                                nextDateOfInterest.Date <= (arrangementEndedDate ?? today))
                            : allPossibleNextDatesIterator.Take(1);

                        var aggregatedDates = dates
                            .Concat(nextDates)
                            .ToImmutableList();

                        return aggregatedDates;
                    });

            var dueDates = datesOfInterest.Where(date => date.IsMissing).Select(item => item.Date).ToImmutableList();

            if (arrangementEndedDate != null)
            {
                return dueDates.TakeWhile(date => date <= arrangementEndedDate).ToImmutableList();
            }

            var dueDatesUntilToday = dueDates.TakeWhilePlusOne(date => date <= today).ToImmutableList();

            return dueDatesUntilToday;
        }

        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementInstancesForDurationRecurrencePerChildLocation(
            DurationStagesPerChildLocationRecurrencePolicy recurrence, Guid? filterToFamilyId,
            DateOnly arrangementStartedDate, DateOnly? arrangementEndedDate, DateOnly today,
            ImmutableList<DateOnly> completionDates, ImmutableSortedSet<ChildLocation> childLocationHistory)
        {
            // Technically, the RecurrencePolicyStage model currently allows any stage to have an unlimited
            // # of occurrences, but that would be invalid, so check for those cases and throw an exception.
            //TODO: Move this into the policy loading code, or better yet fix the model to make this impossible.
            if (recurrence.Stages.Take(recurrence.Stages.Count - 1).Any(stage => !stage.MaxOccurrences.HasValue))
                throw new InvalidOperationException("A stage other than the last stage in a recurrence policy was found to have an unlimited number of occurrences.");

            if (childLocationHistory.IsEmpty)
            {
                return ImmutableList<DateOnly>.Empty;
            }

            // Get a possibly discontinuous timeline in which we will look for completions
            var searchableTimeline = CreateChildLocationBasedTimeline(
                childLocationHistory.ToImmutableList(),
                filterToFamilyId
            );

            // It is possible that a child went to a volunteer and returned before the end of the 'window'
            // in which a completion is expected, in this case we don't return a due date. 
            if (searchableTimeline == null)
            {
                return ImmutableList<DateOnly>.Empty;
            }

            var dueDates = CalculateDueDatesInTimeline(
                recurrence.Stages,
                completionDates,
                searchableTimeline,
                today,
                arrangementEndedDate
            );

            return dueDates;
        }

        internal static ImmutableList<DateOnly>
            CalculateMissingMonitoringRequirementInstancesForChildCareOccurrences(
            ChildCareOccurrenceBasedRecurrencePolicy recurrence, Guid? filterToFamilyId,
            ImmutableList<DateOnly> completionDates, ImmutableSortedSet<ChildLocation> childLocationHistory)
        {
            // Determine which child care occurrences the requirement will apply to.
            var applicableOccurrences = childLocationHistory
                .Where(x => !x.Paused &&
                    (filterToFamilyId == null || x.ChildLocationFamilyId == filterToFamilyId))
                .Where((x, i) => recurrence.Positive
                    ? i % recurrence.Frequency == recurrence.InitialSkipCount
                    : i % recurrence.Frequency != recurrence.InitialSkipCount)
                .ToImmutableList();

            // Determine which child care occurrences did not have a completion within the required delay timespan.
            var missedOccurrences = applicableOccurrences
                .Where(x => !completionDates.Any(c => c >= x.Date && c <= x.Date.AddDays(recurrence.Delay.Days)))
                .ToImmutableList();

            // Return the due-by date of each missed occurrence.
            var missingInstances = missedOccurrences
                .Select(x => x.Date.AddDays(recurrence.Delay.Days))
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
