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
                        oneTime, arrangementStartedDate, completionDates)),
                DurationStagesRecurrencePolicy durationStages => WrapWithTimeInUtc(
                    CalculateMissingMonitoringRequirementInstancesForDurationRecurrence(
                        durationStages, arrangementStartedDate, arrangementEndedDate, today, completionDates)),
                DurationStagesPerChildLocationRecurrencePolicy durationStagesPerChildLocation => WrapWithTimeInUtc(
                    CalculateMissingMonitoringRequirementInstancesForDurationRecurrencePerChildLocation(
                        durationStagesPerChildLocation, filterToFamilyId, arrangementStartedDate, arrangementEndedDate, today,
                        completionDates, childLocationHistoryDates)
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

            // Repeat each stage the number of times specified by MaxOccurrences, or once if MaxOccurrences is null.
            // An instance of a stage is a slot in which we need to look for a completion.
            var slots = recurrence.Stages
                .SelectMany(stage =>
                    Enumerable
                        .Repeat(stage, stage.MaxOccurrences ?? 1)
                        .ToImmutableList());

            // For each slot, find a list of all the due dates.
            var analyzedDates = slots
                .Aggregate(ImmutableList<DateOfInterest>.Empty, (dates, slot) =>
                {
                    var baseDate = dates.IsEmpty ? arrangementStartedDate : dates.Last().Date;
                    var isFirst = dates.IsEmpty;

                    var nextDates = CalculateDatesOfInterest(
                        validCompletions,
                        arrangementStartedDate: isFirst ? arrangementStartedDate : null,
                        arrangementEndedDate,
                        today,
                        baseDate,
                        slot.Delay,
                        slot.MaxOccurrences != null);

                    return dates
                        .Concat(nextDates)
                        .ToImmutableList();
                });


            var missingDates = analyzedDates.Where(date => date.IsMissing).Select(item => item.Date).ToImmutableList();

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

        /// <summary>
        /// Generate a timeline (a window) in which we expect to find a completion.
        /// This can be a continuous or discontinuous timeline.
        /// </summary>
        /// <param name="headRange">Starts at the beginning of the arrangement and goes to __________</param>
        /// <param name="fromDate"></param>
        /// <param name="delay"></param>
        /// <param name="childLocationHistoryEntries"></param>
        /// <returns></returns>
        internal static DateOnlyTimeline? GetWindowForExpectedCompletion(
            DateRange? headRange,
            DateOnly fromDate,
            TimeSpan delay,
            ImmutableList<ChildLocationHistoryEntry>? childLocationHistoryEntries = null
        )
        {
            var defaultDateRange = new DateRange(fromDate.AddDays(1), fromDate.AddDays(delay.Days));

            var window = new DateOnlyTimeline(
                headRange != null
                    ? ImmutableList.Create([headRange.Value, defaultDateRange])
                    : [defaultDateRange]
            );

            if (childLocationHistoryEntries == null)
            {
                return window;
            }

            var nextChildLocationWithinWindow = childLocationHistoryEntries?.Find(item => window.Contains(DateOnly.FromDateTime(item.TimestampUtc)));
            var childWentToParent = nextChildLocationWithinWindow?.Plan == ChildLocationPlan.WithParent;

            if (nextChildLocationWithinWindow == null || !childWentToParent)
            {
                return window;
            }

            var discontinuousRanges = GetDiscontinuousWindow(fromDate.AddDays(1), delay, childLocationHistoryEntries);

            if (discontinuousRanges.Count < 1)
            {
                return null;
            }

            if (headRange != null)
            {
                return new DateOnlyTimeline(discontinuousRanges.Prepend(headRange.Value).ToImmutableList());
            }

            return new DateOnlyTimeline(discontinuousRanges);
        }

        internal static ImmutableList<DateRange> GetDiscontinuousWindow(
            DateOnly startDate,
            TimeSpan remainingDelay,
            ImmutableList<ChildLocationHistoryEntry> childLocationHistoryEntries,
            bool? isPaused = false,
            ImmutableList<DateRange>? dateRanges = null
        )
        {
            ImmutableList<DateRange> nonNullDateRanges = dateRanges ?? ImmutableList<DateRange>.Empty;

            int delay = remainingDelay.Days - 1;
            var defaultWindow = new DateRange(startDate, startDate.AddDays(delay));

            bool findWithParentCriterea(ChildLocationHistoryEntry item)
            {
                // TODO (WIP): The first condition is apparently not needed (passed on current tests), analyzing if there's a case where this is needed
                return defaultWindow.Contains(DateOnly.FromDateTime(item.TimestampUtc)) && item.Plan == ChildLocationPlan.WithParent;
            }

            bool findWithVolunteerCriterea(ChildLocationHistoryEntry item)
            {
                // TODO (WIP): The first condition is apparently not needed (passed on current tests), analyzing if there's a case where this is needed
                return DateOnly.FromDateTime(item.TimestampUtc) > startDate && item.Plan != ChildLocationPlan.WithParent;
            }

            var childLocationIndex = childLocationHistoryEntries.FindIndex(isPaused == true ? findWithVolunteerCriterea : findWithParentCriterea);

            if (childLocationIndex < 0 && isPaused == true)
            {
                return ImmutableList<DateRange>.Empty;
            }

            if (childLocationIndex < 0)
            {
                return nonNullDateRanges.Add(defaultWindow);
            }

            var childLocation = childLocationHistoryEntries.ElementAt(childLocationIndex);
            var remainingLocations = childLocationHistoryEntries.Skip(childLocationIndex + 1).ToImmutableList();
            DateOnly childLocationDate = DateOnly.FromDateTime(childLocation.TimestampUtc);
            int daysFromStartDateToChildLocationDate = childLocationDate.AddDays(-startDate.DayNumber + 1).DayNumber;
            var newRemainingDelay = isPaused == true ? remainingDelay : TimeSpan.FromDays(remainingDelay.Days - daysFromStartDateToChildLocationDate);

            return GetDiscontinuousWindow(
                startDate: childLocationDate.AddDays(1),
                remainingDelay: newRemainingDelay,
                childLocationHistoryEntries: remainingLocations,
                isPaused: !isPaused,
                dateRanges: isPaused == true ? nonNullDateRanges : nonNullDateRanges.Add(new DateRange(startDate, childLocationDate))
            );
        }

        internal static (DateOfInterest, ImmutableList<DateOnly>)? CalculateNextDateOfInterest(
            DateOnly? arrangementStartedDate,
            DateOnly date,
            TimeSpan delay,
            ImmutableList<DateOnly> completions,
            ImmutableList<ChildLocationHistoryEntry>? childLocationHistoryDates = null
        )
        {
            // This is the window in which we expect to find a completion.
            // This can be a continuous or discontinuous timeline.
            // The end of the window represents the due date for this slot.
            var window = GetWindowForExpectedCompletion(
                //TODO: This feels unnecessary? Analyzing the start of the arrangement separately feels like it should just be another range.
                headRange: arrangementStartedDate != null ? new DateRange(arrangementStartedDate.Value, arrangementStartedDate.Value) : null,
                fromDate: date,
                delay,
                childLocationHistoryDates
            );

            if (window == null)
            {
                return null;
            }

            var completion = completions.Find(window.Contains);

            //TODO: Explain the need for this -- a stack overflow (infinite recursion) if a completion
            //      occurs on the arrangement start date and the window is not advanced?
            //      IDEA: If we check for that scenario separately, then we could simplify the rest of the logic.
            var remainingCompletions = completions.Where(item => item != completion).ToImmutableList();

            var completionIsMissing = completion == default;

            if (!completionIsMissing)
            {
                return (new DateOfInterest(completion, isMissing: false), remainingCompletions);
            }

            return (new DateOfInterest(window.Ranges.Last().End, isMissing: true), remainingCompletions);
        }

        internal static ImmutableList<DateOfInterest> CalculateDatesOfInterest(
            ImmutableList<DateOnly> completions,
            DateOnly? arrangementStartedDate,
            DateOnly? arrangementEndedDate,
            DateOnly today,
            DateOnly initialDate,
            TimeSpan delay,
            bool analyzeOnce, //IDEA: Instead, have two separate versions: one that recurses and one that does not.
            ImmutableList<DateOfInterest>? analyzedDates = null,
            ImmutableList<ChildLocationHistoryEntry>? childLocationHistoryDates = null
        )
        {
            //IDEA: Instead of passing the child location history in, generate the "searchable timeline" first
            //      and pass it in.
            ImmutableList<DateOfInterest> CalculateDatesOfInterestInner(
                DateOnly? arrangementStartedDate,
                DateOnly initialDate,
                ImmutableList<DateOnly> completions,
                bool analyzeOnce,
                ImmutableList<DateOfInterest>? analyzedDates = null
            )
            {
                // Search for a completion from the 'initialDate' for this iteration to the next due date.
                // Note that this timeline could be discontinuous based on child location history.
                var result = CalculateNextDateOfInterest(arrangementStartedDate, initialDate, delay, completions, childLocationHistoryDates);

                if (result == null)
                {
                    return analyzedDates ?? ImmutableList<DateOfInterest>.Empty;
                }

                var (analyzedDate, remainingCompletions) = result.Value;

                var newAnalyzedDates = analyzedDates == null ? [analyzedDate] : analyzedDates.Add(analyzedDate);

                if (analyzeOnce || analyzedDate.Date >= arrangementEndedDate)
                {
                    return newAnalyzedDates;
                }

                if (analyzedDate.Date >= today)
                {
                    // When 'today' is reached, we only need one more due date
                    return CalculateDatesOfInterestInner(null, analyzedDate.Date, remainingCompletions, analyzeOnce: true, newAnalyzedDates);
                }

                // This is for when a slot is the last one (so MaxOccurrences is null), so it will continually generate due dates until 'today' or the end of the arrangement
                return CalculateDatesOfInterestInner(null, analyzedDate.Date, remainingCompletions, analyzeOnce, newAnalyzedDates);
            }

            return CalculateDatesOfInterestInner(arrangementStartedDate, initialDate, completions, analyzeOnce, analyzedDates);
        }

        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementInstancesForDurationRecurrencePerChildLocation(
            DurationStagesPerChildLocationRecurrencePolicy recurrence, Guid? filterToFamilyId,
            DateOnly arrangementStartedDate, DateOnly? arrangementEndedDate, DateOnly today,
            ImmutableList<DateOnly> completionDates, ImmutableSortedSet<ChildLocationHistoryEntry> childLocationHistoryDates)
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

            var slots = recurrence.Stages
                .SelectMany(stage => Enumerable.Repeat<string?>(null, stage.MaxOccurrences ?? 1).ToImmutableList(), (stage, slot) => new { stage, slot });

            var analyzedDates = slots.Aggregate(ImmutableList<DateOfInterest>.Empty, (dates, slot) =>
            {
                var initialDate = dates.IsEmpty ? arrangementStartedDate : dates.Last().Date;
                var isFirst = dates.IsEmpty;

                return dates.Concat(
                    CalculateDatesOfInterest(
                        validCompletions,
                        arrangementStartedDate: isFirst ? arrangementStartedDate : null,
                        arrangementEndedDate,
                        today,
                        initialDate,
                        delay: slot.stage.Delay,
                        analyzeOnce: slot.stage.MaxOccurrences != null,
                        analyzedDates: null,
                        childLocationHistoryDates: childLocationHistoryDates.ToImmutableList()
                    )
                ).ToImmutableList();
            });

            var missingDates = analyzedDates.Where(date => date.IsMissing).Select(item => item.Date).ToImmutableList();

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

//TODO: Convert from a class to a record
public class DateOfInterest
{
    public DateOnly Date { get; set; }
    public bool IsMissing { get; set; }
    // public bool WentHome { get; set; }

    public DateOfInterest(DateOnly date, bool isMissing)
    {
        Date = date;
        IsMissing = isMissing;
    }
}