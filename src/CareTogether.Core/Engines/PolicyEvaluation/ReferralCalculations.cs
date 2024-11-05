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
                return new ChildLocation(Date: childLocationDate, Plan: childLocationEntry.Plan);
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
                        childCareOccurences, filterToFamilyId, arrangementStartedAtUtc, arrangementEndedAtUtc,
                        completionDates, childLocationHistoryEntries, utcNow)
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

            //////////////////////////////////
            //TODO (WIP): from here the logic is very similar to CalculateMissingMonitoringRequirementInstancesForDurationRecurrencePerChildLocation, better to move this to some reusable function!?

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

            // Checking for a completion at the start date first simplifies the rest of the calculation
            // (For example, when there's just one policy stage with MaxOccurrences = null, the resulting dates are offsetted).
            var completionOnDayOne = validCompletions.Find(item => item == arrangementStartedDate);
            var applicableStages = completionOnDayOne != default && recurrence.Stages.Count() > 1
                ? recurrence.Stages.Skip(1)
                : recurrence.Stages;

            // TODO:
            // Repeat each stage the number of times specified by MaxOccurrences, or once if MaxOccurrences is null.
            // An instance of a stage is a slot in which we need to look for a completion.
            // ----
            // Generates slots in which we need to look for a completion. Each stage generates a number of slots
            // equal to its MaxOccurrences, or just 1 if MaxOccurrences is null (which should be the last stage, or the only one).
            // A slot isn't a defined DateRange or Timeline because there's no way of determining all the start/end dates beforehand.
            var slots = applicableStages
                .SelectMany(stage =>
                    Enumerable
                        .Repeat(stage, stage.MaxOccurrences ?? 1)
                        .ToImmutableList());

            // For each slot, find a list of all dates of interest.
            var datesOfInterest = slots
                .Aggregate(ImmutableList<DateOfInterest>.Empty, (dates, slot) =>
                    {
                        var lastDateOfInterest = dates.LastOrDefault()?.Date ?? arrangementStartedDate;

                        var allPossibleNextDatesIterator = IterateDatesOfInterest(
                                lastDateOfInterest, validCompletions, slot.Delay);

                        var nextDates = slot.MaxOccurrences == null
                            ? allPossibleNextDatesIterator.TakeWhilePlusOne(nextDateOfInterest =>
                                nextDateOfInterest.Date <= (arrangementEndedDate ?? today))
                            : allPossibleNextDatesIterator.Take(1);

                        var aggregatedDates = dates
                            .Concat(nextDates)
                            .ToImmutableList();

                        return aggregatedDates;
                    });


            var missingDates = datesOfInterest.Where(date => date.IsMissing).Select(item => item.Date).ToImmutableList();

            if (arrangementEndedDate != null)
            {
                var result = missingDates.Where(date => date <= arrangementEndedDate);

                return result.ToImmutableList();
            }

            var missingDatesUntilToday = missingDates.Where(date => date <= today).ToImmutableList();

            if (missingDates.Count > missingDatesUntilToday.Count)
            {
                var missingDatesUntilTodayPlusOneMore = missingDatesUntilToday.Add(missingDates[missingDatesUntilToday.Count]);

                return missingDatesUntilTodayPlusOneMore;
            }

            return missingDates;

            //////////////////////////////////
        }

        /// <summary>
        /// Generate a timeline (a window) in which we expect to find a completion.
        /// This can be a continuous or discontinuous timeline.
        /// </summary>
        /// <param name="lastDateOfInterest">The last date of interest is either the last completion date or last due date. It is used to calculate the start date of the next window.</param>
        /// <param name="delay"></param>
        /// <param name="childLocationHistory"></param>
        /// <returns></returns>
        internal static DateOnlyTimeline? GetWindowForExpectedCompletion(
            DateOnly lastDateOfInterest,
            TimeSpan delay,
            ImmutableList<ChildLocation>? childLocationHistory = null
        )
        {
            if (childLocationHistory == null)
            {
                var window = new DateOnlyTimeline([
                    new DateRange(lastDateOfInterest.AddDays(1), lastDateOfInterest.AddDays(delay.Days))
                ]);

                return window;
            }

            var discontinuousRanges = GetPossiblyDiscontinuousWindowBasedOnChildLocations(lastDateOfInterest, delay, childLocationHistory);

            if (discontinuousRanges == null)
            {
                return null;
            }

            return new DateOnlyTimeline(discontinuousRanges);
        }

        internal static ImmutableList<DateRange>? GetPossiblyDiscontinuousWindowBasedOnChildLocations(
            DateOnly lastDateOfInterest,
            TimeSpan remainingDelay,
            ImmutableList<ChildLocation> childLocationHistory,
            bool? isPaused = false,
            ImmutableList<DateRange>? dateRanges = null
        )
        {
            ImmutableList<DateRange> nonNullDateRanges = dateRanges ?? ImmutableList<DateRange>.Empty;
            var windowStartDate = lastDateOfInterest.AddDays(1);

            int delay = remainingDelay.Days - 1;
            var defaultWindow = new DateRange(windowStartDate, windowStartDate.AddDays(delay));

            bool findWithParentCriteria(ChildLocation item)
            {
                // TODO (WIP): The first condition is apparently not needed (passed on current tests), analyzing if there's a case where this is needed
                return defaultWindow.Contains(item.Date) && item.Plan == ChildLocationPlan.WithParent;
            }

            bool findWithVolunteerCriteria(ChildLocation item)
            {
                // TODO (WIP): The first condition is apparently not needed (passed on current tests), analyzing if there's a case where this is needed
                return item.Date > windowStartDate && item.Plan != ChildLocationPlan.WithParent;
            }

            var childLocationIndex = childLocationHistory.FindIndex(isPaused == true ? findWithVolunteerCriteria : findWithParentCriteria);

            // A policy is only elapsed while the child is with a volunteer, so if the child is currently with parent,
            // the policy is 'paused', and we don't generate a duedate.
            if (childLocationIndex < 0 && isPaused == true)
            {
                return null;
            }

            if (childLocationIndex < 0)
            {
                return nonNullDateRanges.Add(defaultWindow);
            }

            var childLocation = childLocationHistory.ElementAt(childLocationIndex);
            DateOnly childLocationDate = childLocation.Date;
            int daysFromStartDateToChildLocationDate = childLocationDate.AddDays(-windowStartDate.DayNumber + 1).DayNumber;
            var newRemainingDelay = isPaused == true ? remainingDelay : TimeSpan.FromDays(remainingDelay.Days - daysFromStartDateToChildLocationDate);

            var remainingLocations = childLocationHistory.Skip(childLocationIndex + 1).ToImmutableList();

            return GetPossiblyDiscontinuousWindowBasedOnChildLocations(
                lastDateOfInterest: childLocationDate,
                remainingDelay: newRemainingDelay,
                childLocationHistory: remainingLocations,
                isPaused: !isPaused,
                dateRanges: isPaused == true ? nonNullDateRanges : nonNullDateRanges.Add(new DateRange(windowStartDate, childLocationDate))
            );
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
            TimeSpan delay,
            //IDEA: Instead of passing the child location history in, generate the "searchable timeline" first
            //      and pass it in. It is a list of dates/windows in which there is a 'pause' inside a date range.
            ImmutableList<ChildLocation>? childLocationHistoryDates = null
        )
        {
            DateOnly nextWindowSearchFromDate = lastDateOfInterest;
            while (true)
            {
                // This is the window in which we expect to find a completion.
                // This can be a continuous or discontinuous timeline (based on child location history).
                // The end of the window represents the due date for this slot.
                var window = GetWindowForExpectedCompletion(
                    nextWindowSearchFromDate, delay, childLocationHistoryDates);

                // This case only happens if a policy gets 'paused'
                // (when a child location changes to WithParent) during the policy window.
                if (window == null)
                {
                    yield break;
                }

                // Search for a completion inside current window.
                // Note that this timeline could be discontinuous based on child location history.
                var nextDateOfInterest = CalculateNextDateOfInterest(
                    window, completions);

                yield return nextDateOfInterest;

                nextWindowSearchFromDate = nextDateOfInterest.Date;
            }
        }

        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementInstancesForDurationRecurrencePerChildLocation(
            DurationStagesPerChildLocationRecurrencePolicy recurrence, Guid? filterToFamilyId,
            DateOnly arrangementStartedDate, DateOnly? arrangementEndedDate, DateOnly today,
            ImmutableList<DateOnly> completionDates, ImmutableSortedSet<ChildLocation> childLocationHistoryDates)
        {
            // Technically, the RecurrencePolicyStage model currently allows any stage to have an unlimited
            // # of occurrences, but that would be invalid, so check for those cases and throw an exception.
            //TODO: Move this into the policy loading code, or better yet fix the model to make this impossible.
            if (recurrence.Stages.Take(recurrence.Stages.Count - 1).Any(stage => !stage.MaxOccurrences.HasValue))
                throw new InvalidOperationException("A stage other than the last stage in a recurrence policy was found to have an unlimited number of occurrences.");

            if (childLocationHistoryDates.IsEmpty)
            {
                return ImmutableList<DateOnly>.Empty;
            }

            //////////////////////////////////
            //TODO (WIP): from here the logic is very similar to CalculateMissingMonitoringRequirementInstancesForDurationRecurrence, better to move this to some reusable function!?

            var validCompletions = completionDates
                .Where(completion => completion >= arrangementStartedDate)
                .ToImmutableList();

            // Checking for a completion at the start date first simplifies the rest of the calculation.
            // For example, when there's just one policy stage with MaxOccurrences = null, the resulting dates are offsetted,
            // creating the need to make the recursive calculation aware if it's the first calculation, i. e. start date and delay are offset or not,
            // so the rest of the calculation have a different offset, compensanting the first offset.
            // Another problem is a stack overflow (infinite recursion), creating the need of always passing a new list of completions,
            // removing the ones that were already checked.
            var completionOnDayOne = validCompletions.Find(item => item == arrangementStartedDate);
            var applicableStages = completionOnDayOne != default && recurrence.Stages.Count > 1
                ? recurrence.Stages.Skip(1)
                : recurrence.Stages;

            // TODO:
            // Repeat each stage the number of times specified by MaxOccurrences, or once if MaxOccurrences is null.
            // An instance of a stage is a slot in which we need to look for a completion.
            // ----
            // Generates slots in which we need to look for a completion. Each stage generates a number of slots
            // equal to its MaxOccurrences, or just 1 if MaxOccurrences is null (which should be the last stage, or the only one).
            // A slot doesn't have a start/end date because there's no way of determining all the start/end dates beforehand, it depends on previus
            // calculated dates of interest (either a completion or due date).
            var slots = applicableStages
                .SelectMany(stage =>
                    Enumerable
                        .Repeat(stage, stage.MaxOccurrences ?? 1)
                        .ToImmutableList());

            // For each slot, find a list of all dates of interest.
            var datesOfInterest = slots
                .Aggregate(ImmutableList<DateOfInterest>.Empty, (dates, slot) =>
                    {
                        var lastDateOfInterest = dates.LastOrDefault()?.Date ?? arrangementStartedDate;

                        var allPossibleNextDatesIterator = IterateDatesOfInterest(
                                lastDateOfInterest, validCompletions, slot.Delay,
                                childLocationHistoryDates.ToImmutableList());

                        var nextDates = slot.MaxOccurrences == null
                            ? allPossibleNextDatesIterator.TakeWhilePlusOne(nextDateOfInterest =>
                                nextDateOfInterest.Date <= (arrangementEndedDate ?? today))
                            : allPossibleNextDatesIterator.Take(1);

                        var aggregatedDates = dates
                            .Concat(nextDates)
                            .ToImmutableList();

                        return aggregatedDates;
                    });

            var missingDates = datesOfInterest.Where(date => date.IsMissing).Select(item => item.Date).ToImmutableList();

            if (arrangementEndedDate != null)
            {
                return missingDates.Where(date => date <= arrangementEndedDate).ToImmutableList();
            }

            var missingDatesUntilToday = missingDates.Where(date => date <= today).ToImmutableList();

            if (missingDates.Count > missingDatesUntilToday.Count)
            {
                var missingDatesUntilTodayPlusOneMore = missingDatesUntilToday.Add(missingDates[missingDatesUntilToday.Count]);
                return missingDatesUntilTodayPlusOneMore;
            }

            return missingDates;

            //////////////////////////////////
        }

        //TODO: Move to a helper class ('Extensions.cs' or 'IEnumerableExtensions.cs') and create its own small unit test suite.
        public static IEnumerable<T> TakeWhilePlusOne<T>(this IEnumerable<T> source, Func<T, bool> predicate)
        {
            using (var enumerator = source.GetEnumerator())
            {
                while (enumerator.MoveNext())
                {
                    var current = enumerator.Current;
                    if (predicate(current))
                    {
                        yield return current;
                    }
                    else
                    {
                        yield return current;
                        break;
                    }
                }
            }
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
