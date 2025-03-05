using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources.Policies;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    static class ReferralCalculations
    {
        public static ReferralStatus CalculateReferralStatus(
            ReferralPolicy referralPolicy,
            ReferralEntry referralEntry,
            DateOnly today
        )
        {
            ImmutableList<string> missingIntakeRequirements = referralPolicy
                .RequiredIntakeActionNames.Where(requiredAction =>
                    !SharedCalculations
                        .RequirementMetOrExempted(
                            requiredAction,
                            null,
                            today,
                            referralEntry.CompletedRequirements,
                            referralEntry.ExemptedRequirements
                        )
                        .IsMetOrExempted
                )
                .ToImmutableList();

            ImmutableList<string> missingCustomFields = referralPolicy
                .CustomFields.Where(customField =>
                    !referralEntry.CompletedCustomFields.Any(completed => completed.Key == customField.Name)
                )
                .Select(customField => customField.Name)
                .ToImmutableList();

            ImmutableDictionary<Guid, ArrangementStatus> individualArrangements =
                referralEntry.Arrangements.ToImmutableDictionary(
                    arrangement => arrangement.Key,
                    arrangement =>
                    {
                        ArrangementPolicy arrangementPolicy = referralPolicy.ArrangementPolicies.Single(p =>
                            p.ArrangementType == arrangement.Value.ArrangementType
                        );

                        return CalculateArrangementStatus(arrangement.Value, arrangementPolicy, today);
                    }
                );

            return new ReferralStatus(missingIntakeRequirements, missingCustomFields, individualArrangements);
        }

        internal static ArrangementStatus CalculateArrangementStatus(
            ArrangementEntry arrangement,
            ArrangementPolicy arrangementPolicy,
            DateOnly today
        )
        {
            ImmutableList<MissingArrangementRequirement> missingSetupRequirements = CalculateMissingSetupRequirements(
                arrangementPolicy,
                arrangement,
                today
            );
            ImmutableList<MissingArrangementRequirement> missingMonitoringRequirements =
                CalculateMissingMonitoringRequirements(arrangementPolicy, arrangement, today);
            ImmutableList<MissingArrangementRequirement> missingCloseoutRequirements =
                CalculateMissingCloseoutRequirements(arrangementPolicy, arrangement, today);
            ImmutableList<ArrangementFunction> missingFunctionAssignments = CalculateMissingFunctionAssignments(
                arrangementPolicy.ArrangementFunctions,
                arrangement.FamilyVolunteerAssignments,
                arrangement.IndividualVolunteerAssignments
            );

            ArrangementPhase phase = CalculateArrangementPhase(
                arrangement.StartedAt,
                arrangement.EndedAt,
                arrangement.CancelledAt,
                missingSetupRequirements,
                missingFunctionAssignments
            );

            ImmutableList<MissingArrangementRequirement> missingRequirements = SelectMissingRequirementsForStatus(
                phase,
                missingSetupRequirements,
                missingMonitoringRequirements,
                missingCloseoutRequirements
            );

            return new ArrangementStatus(phase, missingRequirements); //TODO: Shouldn't missing function assignments be returned as well?
        }

        internal static ImmutableList<MissingArrangementRequirement> SelectMissingRequirementsForStatus(
            ArrangementPhase phase,
            ImmutableList<MissingArrangementRequirement> missingSetupRequirements,
            ImmutableList<MissingArrangementRequirement> missingMonitoringRequirements,
            ImmutableList<MissingArrangementRequirement> missingCloseoutRequirements
        )
        {
            return phase switch
            {
                ArrangementPhase.SettingUp => missingSetupRequirements,
                ArrangementPhase.ReadyToStart => ImmutableList<MissingArrangementRequirement>.Empty,
                ArrangementPhase.Started => missingMonitoringRequirements,
                ArrangementPhase.Ended => missingCloseoutRequirements
                    .Concat(missingMonitoringRequirements)
                    .ToImmutableList(),
                ArrangementPhase.Cancelled => ImmutableList<MissingArrangementRequirement>.Empty,
                _ => throw new NotImplementedException($"The arrangement phase '{phase}' has not been implemented."),
            };
        }

        internal static ArrangementPhase CalculateArrangementPhase(
            DateOnly? startedAt,
            DateOnly? endedAt,
            DateOnly? cancelledAt,
            ImmutableList<MissingArrangementRequirement> missingSetupRequirements,
            ImmutableList<ArrangementFunction> missingFunctionAssignments
        )
        {
            return cancelledAt.HasValue ? ArrangementPhase.Cancelled
                : endedAt.HasValue ? ArrangementPhase.Ended
                : startedAt.HasValue ? ArrangementPhase.Started
                : missingSetupRequirements.Count == 0 && missingFunctionAssignments.Count == 0
                    ? ArrangementPhase.ReadyToStart
                : ArrangementPhase.SettingUp;
        }

        internal static ImmutableList<MissingArrangementRequirement> CalculateMissingSetupRequirements(
            ArrangementPolicy arrangementPolicy,
            ArrangementEntry arrangement,
            DateOnly today
        )
        {
            ImmutableList<MissingArrangementRequirement> arrangementLevelResults = arrangementPolicy
                .RequiredSetupActionNames.Where(requiredAction =>
                    !SharedCalculations
                        .RequirementMetOrExempted(
                            requiredAction,
                            null,
                            today,
                            arrangement.CompletedRequirements,
                            arrangement.ExemptedRequirements
                        )
                        .IsMetOrExempted
                )
                .Select(requiredAction => new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    requiredAction,
                    null,
                    null
                ))
                .ToImmutableList();

            ImmutableList<MissingArrangementRequirement> familyAssignmentResults = arrangement
                .FamilyVolunteerAssignments.SelectMany(fva =>
                {
                    ArrangementFunctionVariant? functionVariant = arrangementPolicy
                        .ArrangementFunctions.SingleOrDefault(af => af.FunctionName == fva.ArrangementFunction)
                        ?.Variants?.SingleOrDefault(afv => afv.VariantName == fva.ArrangementFunctionVariant);

                    if (functionVariant == null)
                    {
                        return ImmutableList<MissingArrangementRequirement>.Empty;
                    }

                    return functionVariant
                        .RequiredSetupActionNames.Where(requiredAction =>
                            !SharedCalculations
                                .RequirementMetOrExempted(
                                    requiredAction,
                                    null,
                                    today,
                                    fva.CompletedRequirements,
                                    fva.ExemptedRequirements
                                )
                                .IsMetOrExempted
                        )
                        .Select(requiredAction => new MissingArrangementRequirement(
                            fva.ArrangementFunction,
                            fva.ArrangementFunctionVariant,
                            fva.FamilyId,
                            null,
                            requiredAction,
                            null,
                            null
                        ))
                        .ToImmutableList();
                })
                .ToImmutableList();

            ImmutableList<MissingArrangementRequirement> individualAssignmentResults = arrangement
                .IndividualVolunteerAssignments.SelectMany(iva =>
                {
                    ArrangementFunctionVariant? functionVariant = arrangementPolicy
                        .ArrangementFunctions.SingleOrDefault(af => af.FunctionName == iva.ArrangementFunction)
                        ?.Variants?.SingleOrDefault(afv => afv.VariantName == iva.ArrangementFunctionVariant);

                    if (functionVariant == null)
                    {
                        return ImmutableList<MissingArrangementRequirement>.Empty;
                    }

                    return functionVariant
                        .RequiredSetupActionNames.Where(requiredAction =>
                            !SharedCalculations
                                .RequirementMetOrExempted(
                                    requiredAction,
                                    null,
                                    today,
                                    iva.CompletedRequirements,
                                    iva.ExemptedRequirements
                                )
                                .IsMetOrExempted
                        )
                        .Select(requiredAction => new MissingArrangementRequirement(
                            iva.ArrangementFunction,
                            iva.ArrangementFunctionVariant,
                            iva.FamilyId,
                            iva.PersonId,
                            requiredAction,
                            null,
                            null
                        ))
                        .ToImmutableList();
                })
                .ToImmutableList();

            return arrangementLevelResults
                .Concat(familyAssignmentResults)
                .Concat(individualAssignmentResults)
                .ToImmutableList();
        }

        internal static ImmutableList<MissingArrangementRequirement> CalculateMissingMonitoringRequirements(
            ArrangementPolicy arrangementPolicy,
            ArrangementEntry arrangement,
            DateOnly today
        )
        {
            ImmutableList<MissingArrangementRequirement> arrangementLevelResults = arrangementPolicy
                .RequiredMonitoringActions.SelectMany(monitoringRequirement =>
                    (
                        arrangement.StartedAt.HasValue
                            ? CalculateMissingMonitoringRequirementInstances(
                                monitoringRequirement.Recurrence,
                                null,
                                arrangement.StartedAt.Value,
                                arrangement.EndedAt,
                                arrangement
                                    .CompletedRequirements.Where(x =>
                                        x.RequirementName == monitoringRequirement.ActionName
                                    )
                                    .Select(x => x.CompletedAt)
                                    .OrderBy(x => x)
                                    .ToImmutableList(),
                                arrangement.ChildLocationHistory,
                                today
                            )
                            : ImmutableList<DateOnly>.Empty
                    )
                        .Where(missingDueDate =>
                            !arrangement.ExemptedRequirements.Any(exempted =>
                                exempted.RequirementName == monitoringRequirement.ActionName
                                && (!exempted.DueDate.HasValue || exempted.DueDate == missingDueDate)
                                && (exempted.ExemptionExpiresAt == null || exempted.ExemptionExpiresAt > today)
                            )
                        )
                        .Select(missingDueDate => new MissingArrangementRequirement(
                            null,
                            null,
                            null,
                            null,
                            monitoringRequirement.ActionName,
                            missingDueDate > today ? missingDueDate : null,
                            missingDueDate <= today ? missingDueDate : null
                        ))
                )
                .ToImmutableList();

            ImmutableList<MissingArrangementRequirement> familyAssignmentResults = arrangement
                .FamilyVolunteerAssignments.SelectMany(fva =>
                {
                    ArrangementFunctionVariant? functionVariant = arrangementPolicy
                        .ArrangementFunctions.SingleOrDefault(af => af.FunctionName == fva.ArrangementFunction)
                        ?.Variants?.SingleOrDefault(afv => afv.VariantName == fva.ArrangementFunctionVariant);

                    if (functionVariant == null)
                    {
                        return ImmutableList<MissingArrangementRequirement>.Empty;
                    }

                    return functionVariant
                        .RequiredMonitoringActions.SelectMany(monitoringRequirement =>
                            (
                                arrangement.StartedAt.HasValue
                                    ? CalculateMissingMonitoringRequirementInstances(
                                        monitoringRequirement.Recurrence,
                                        fva.FamilyId,
                                        arrangement.StartedAt.Value,
                                        arrangement.EndedAt,
                                        fva.CompletedRequirements.Where(x =>
                                                x.RequirementName == monitoringRequirement.ActionName
                                            )
                                            .Select(x => x.CompletedAt)
                                            .OrderBy(x => x)
                                            .ToImmutableList(),
                                        arrangement.ChildLocationHistory,
                                        today
                                    )
                                    : ImmutableList<DateOnly>.Empty
                            )
                                .Where(missingDueDate =>
                                    !fva.ExemptedRequirements.Any(exempted =>
                                        exempted.RequirementName == monitoringRequirement.ActionName
                                        && (!exempted.DueDate.HasValue || exempted.DueDate == missingDueDate)
                                        && (exempted.ExemptionExpiresAt == null || exempted.ExemptionExpiresAt > today)
                                    )
                                )
                                .Select(missingDueDate => new MissingArrangementRequirement(
                                    fva.ArrangementFunction,
                                    fva.ArrangementFunctionVariant,
                                    fva.FamilyId,
                                    null,
                                    monitoringRequirement.ActionName,
                                    missingDueDate > today ? missingDueDate : null,
                                    missingDueDate <= today ? missingDueDate : null
                                ))
                        )
                        .ToImmutableList();
                })
                .ToImmutableList();

            ImmutableList<MissingArrangementRequirement> individualAssignmentResults = arrangement
                .IndividualVolunteerAssignments.SelectMany(iva =>
                {
                    ArrangementFunctionVariant? functionVariant = arrangementPolicy
                        .ArrangementFunctions.SingleOrDefault(af => af.FunctionName == iva.ArrangementFunction)
                        ?.Variants?.SingleOrDefault(afv => afv.VariantName == iva.ArrangementFunctionVariant);

                    if (functionVariant == null)
                    {
                        return ImmutableList<MissingArrangementRequirement>.Empty;
                    }

                    return functionVariant
                        .RequiredMonitoringActions.SelectMany(monitoringRequirement =>
                            (
                                arrangement.StartedAt.HasValue
                                    ? CalculateMissingMonitoringRequirementInstances(
                                        monitoringRequirement.Recurrence,
                                        iva.FamilyId,
                                        arrangement.StartedAt.Value,
                                        arrangement.EndedAt,
                                        iva.CompletedRequirements.Where(x =>
                                                x.RequirementName == monitoringRequirement.ActionName
                                            )
                                            .Select(x => x.CompletedAt)
                                            .OrderBy(x => x)
                                            .ToImmutableList(),
                                        arrangement.ChildLocationHistory,
                                        today
                                    )
                                    : ImmutableList<DateOnly>.Empty
                            )
                                .Where(missingDueDate =>
                                    !iva.ExemptedRequirements.Any(exempted =>
                                        exempted.RequirementName == monitoringRequirement.ActionName
                                        && (!exempted.DueDate.HasValue || exempted.DueDate == missingDueDate)
                                        && (exempted.ExemptionExpiresAt == null || exempted.ExemptionExpiresAt > today)
                                    )
                                )
                                .Select(missingDueDate => new MissingArrangementRequirement(
                                    iva.ArrangementFunction,
                                    iva.ArrangementFunctionVariant,
                                    iva.FamilyId,
                                    iva.PersonId,
                                    monitoringRequirement.ActionName,
                                    missingDueDate > today ? missingDueDate : null,
                                    missingDueDate <= today ? missingDueDate : null
                                ))
                        )
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
        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementInstances(
            RecurrencePolicy recurrence,
            Guid? filterToFamilyId,
            DateOnly arrangementStartedAtDate,
            DateOnly? arrangementEndedAtDate,
            ImmutableList<DateOnly> completions,
            ImmutableList<ChildLocation> childLocationHistory,
            DateOnly today
        )
        {
            return recurrence switch
            {
                OneTimeRecurrencePolicy oneTime => CalculateMissingMonitoringRequirementInstancesForOneTimeRecurrence(
                    oneTime,
                    arrangementStartedAtDate,
                    completions
                ),
                DurationStagesRecurrencePolicy durationStages =>
                    CalculateMissingMonitoringRequirementInstancesForDurationRecurrence(
                        durationStages,
                        arrangementStartedAtDate,
                        arrangementEndedAtDate,
                        today,
                        completions
                    ),
                DurationStagesPerChildLocationRecurrencePolicy durationStagesPerChildLocation =>
                    CalculateMissingMonitoringRequirementInstancesForDurationRecurrencePerChildLocation(
                        durationStagesPerChildLocation,
                        filterToFamilyId,
                        arrangementStartedAtDate,
                        arrangementEndedAtDate,
                        today,
                        completions,
                        childLocationHistory
                    ),
                ChildCareOccurrenceBasedRecurrencePolicy childCareOccurences =>
                    CalculateMissingMonitoringRequirementInstancesForChildCareOccurrences(
                        childCareOccurences,
                        filterToFamilyId,
                        completions,
                        childLocationHistory
                    ),
                _ => throw new NotImplementedException(
                    $"The recurrence policy type '{recurrence.GetType().FullName}' has not been implemented."
                ),
            };
        }

        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementInstancesForOneTimeRecurrence(
            OneTimeRecurrencePolicy recurrence,
            DateOnly arrangementStartedDate,
            ImmutableList<DateOnly> completions
        )
        {
            if (recurrence.Delay.HasValue)
            {
                DateOnly dueDate = arrangementStartedDate.AddDays(recurrence.Delay.Value.Days);

                if (completions.Any(completion => completion <= dueDate))
                {
                    return [];
                }

                return [dueDate];
            }

            if (completions.IsEmpty)
            {
                return [arrangementStartedDate];
            }

            return [];
        }

        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementInstancesForDurationRecurrence(
            DurationStagesRecurrencePolicy recurrence,
            DateOnly arrangementStartedDate,
            DateOnly? arrangementEndedDate,
            DateOnly today,
            ImmutableList<DateOnly> completionDates
        )
        {
            // Technically, the RecurrencePolicyStage model currently allows any stage to have an unlimited
            // # of occurrences, but that would be invalid, so check for those cases and throw an exception.
            //TODO: Move this into the policy loading code, or better yet fix the model to make this impossible.
            if (recurrence.Stages.Take(recurrence.Stages.Count - 1).Any(stage => !stage.MaxOccurrences.HasValue))
            {
                throw new InvalidOperationException(
                    "A stage other than the last stage in a recurrence policy was found to have an unlimited number of occurrences."
                );
            }

            DateOnlyTimeline searchableTimeline = new([new DateRange(arrangementStartedDate)]);

            ImmutableList<DateOnly> dueDates = CalculateDueDatesInTimeline(
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
            ImmutableList<DateRange<Guid>> dateRanges = GenerateDateRanges(childLocations).ToImmutableList();

            ImmutableList<DateRange> filteredDateRanges = (
                filterToFamilyId != null ? dateRanges.Where(item => item.Tag == filterToFamilyId) : dateRanges
            )
                .Select(item => new DateRange(item.Start, item.End))
                .ToImmutableList();

            if (filteredDateRanges.IsEmpty)
            {
                return null;
            }

            return DateOnlyTimeline.FromOverlappingDateRanges(filteredDateRanges);
        }

        static IEnumerable<DateRange<Guid>> GenerateDateRanges(ImmutableList<ChildLocation> childLocations)
        {
            (DateOnly Date, Guid ChildLocationFamilyId)? previousChildLocation = null;

            foreach (ChildLocation childLocation in childLocations)
            {
                if (!previousChildLocation.HasValue && !childLocation.Paused)
                {
                    previousChildLocation = (childLocation.Date, childLocation.ChildLocationFamilyId);
                    continue;
                }

                if (previousChildLocation.HasValue && !childLocation.Paused)
                {
                    yield return new DateRange<Guid>(
                        previousChildLocation.Value.Date,
                        childLocation.Date,
                        previousChildLocation.Value.ChildLocationFamilyId
                    );

                    previousChildLocation = (childLocation.Date, childLocation.ChildLocationFamilyId);
                    continue;
                }

                if (previousChildLocation.HasValue && childLocation.Paused)
                {
                    yield return new DateRange<Guid>(
                        previousChildLocation.Value.Date,
                        childLocation.Date,
                        previousChildLocation.Value.ChildLocationFamilyId
                    );
                    previousChildLocation = null;
                    continue;
                }
            }

            if (previousChildLocation.HasValue)
            {
                yield return new DateRange<Guid>(
                    previousChildLocation.Value.Date,
                    previousChildLocation.Value.ChildLocationFamilyId
                );
            }
        }

        internal static DateOnlyTimeline? GetWindowForExpectedCompletion(
            DateOnly startDate,
            TimeSpan windowLength,
            DateOnlyTimeline searchableTimeline
        )
        {
            DateOnlyTimeline baseWindowTimeline = new([new DateRange(startDate)]);

            DateOnlyTimeline? searchableTimelineFromWindowStartDate = baseWindowTimeline.IntersectionWith(
                searchableTimeline
            );

            DateOnlyTimeline? window = searchableTimelineFromWindowStartDate?.TakeDays(windowLength.Days);

            if (window == default || window.TotalDaysInclusive() < windowLength.Days)
            {
                return null;
            }

            bool isDiscontinuousWindow = window.Ranges.Count > 1;

            // If resulting window is discontinuous, it means there's a pause in the timeline.
            // Currently, the app adds 1 more day to the window length if there was a pause.
            // So this condition is for backwards compatibility purpose.
            if (isDiscontinuousWindow)
            {
                DateRange lastDayRange = new(window.End.AddDays(1), window.End.AddDays(1));

                return new DateOnlyTimeline(window.Ranges.Add(lastDayRange));
            }

            return window;
        }

        internal static DateOfInterest CalculateNextDateOfInterest(
            DateOnlyTimeline window,
            ImmutableList<DateOnly> completions
        )
        {
            DateOnly completion = completions.Find(window.Contains);

            bool completionIsMissing = completion == default;

            if (!completionIsMissing)
            {
                return new DateOfInterest(completion, false);
            }

            return new DateOfInterest(window.Ranges.Last().End, true);
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
                DateOnlyTimeline? nextWindow = GetWindowForExpectedCompletion(
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
                DateOfInterest nextDateOfInterest = CalculateNextDateOfInterest(nextWindow, completions);

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
            ImmutableList<DateOnly> validCompletions = completionDates
                .Where(completion => completion >= searchableTimeline.Start)
                .ToImmutableList();

            // Checking for a completion at the start date first simplifies the rest of the calculation.
            // For example, when there's just one policy stage with MaxOccurrences = null, the resulting dates are offsetted,
            // creating the need to make the recursive calculation aware if it's the first calculation, i. e. start date and delay are offset or not,
            // so the rest of the calculation have a different offset, compensanting the first offset.
            // Another problem is a stack overflow (infinite recursion), creating the need of always passing a new list of completions,
            // removing the ones that were already checked.
            DateOnly completionOnDayOne = validCompletions.Find(item => item == searchableTimeline.Start);
            IEnumerable<RecurrencePolicyStage> applicableStages =
                completionOnDayOne != default && recurrenceStages.Count > 1
                    ? recurrenceStages.Skip(1)
                    : recurrenceStages;

            // Generates slots in which we need to look for a completion. Each stage generates a number of slots
            // equal to its MaxOccurrences, or just 1 if MaxOccurrences is null (which should be the last stage, or the only one).
            // A slot doesn't have a start/end date because there's no way of determining all the start/end dates beforehand, it depends on previus
            // calculated dates of interest (either a completion or due date).
            IEnumerable<RecurrencePolicyStage> slots = applicableStages.SelectMany(stage =>
                Enumerable.Repeat(stage, stage.MaxOccurrences ?? 1).ToImmutableList()
            );

            // For each slot, find a list of all dates of interest (meaning dates of completion or due dates, which are used
            // to calculate the next window).
            ImmutableList<DateOfInterest> datesOfInterest = slots.Aggregate(
                ImmutableList<DateOfInterest>.Empty,
                (dates, slot) =>
                {
                    DateOnly lastDateOfInterest = dates.LastOrDefault()?.Date ?? searchableTimeline.Start;

                    IEnumerable<DateOfInterest> allPossibleNextDatesIterator = IterateDatesOfInterest(
                        lastDateOfInterest,
                        validCompletions,
                        slot.Delay,
                        searchableTimeline
                    );

                    IEnumerable<DateOfInterest> nextDates =
                        slot.MaxOccurrences == null
                            ? allPossibleNextDatesIterator.TakeWhilePlusOne(nextDateOfInterest =>
                                nextDateOfInterest.Date <= (arrangementEndedDate ?? today)
                            )
                            : allPossibleNextDatesIterator.Take(1);

                    ImmutableList<DateOfInterest> aggregatedDates = dates.Concat(nextDates).ToImmutableList();

                    return aggregatedDates;
                }
            );

            ImmutableList<DateOnly> dueDates = datesOfInterest
                .Where(date => date.IsMissing)
                .Select(item => item.Date)
                .ToImmutableList();

            if (arrangementEndedDate != null)
            {
                return dueDates.TakeWhile(date => date <= arrangementEndedDate).ToImmutableList();
            }

            ImmutableList<DateOnly> dueDatesUntilToday = dueDates
                .TakeWhilePlusOne(date => date <= today)
                .ToImmutableList();

            return dueDatesUntilToday;
        }

        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementInstancesForDurationRecurrencePerChildLocation(
            DurationStagesPerChildLocationRecurrencePolicy recurrence,
            Guid? filterToFamilyId,
            DateOnly arrangementStartedDate,
            DateOnly? arrangementEndedDate,
            DateOnly today,
            ImmutableList<DateOnly> completionDates,
            ImmutableList<ChildLocation> childLocationHistory
        )
        {
            // Technically, the RecurrencePolicyStage model currently allows any stage to have an unlimited
            // # of occurrences, but that would be invalid, so check for those cases and throw an exception.
            //TODO: Move this into the policy loading code, or better yet fix the model to make this impossible.
            if (recurrence.Stages.Take(recurrence.Stages.Count - 1).Any(stage => !stage.MaxOccurrences.HasValue))
            {
                throw new InvalidOperationException(
                    "A stage other than the last stage in a recurrence policy was found to have an unlimited number of occurrences."
                );
            }

            if (childLocationHistory.IsEmpty)
            {
                return ImmutableList<DateOnly>.Empty;
            }

            // Get a possibly discontinuous timeline in which we will look for completions
            DateOnlyTimeline? searchableTimeline = CreateChildLocationBasedTimeline(
                childLocationHistory.ToImmutableList(),
                filterToFamilyId
            );

            // It is possible that a child went to a volunteer and returned before the end of the 'window'
            // in which a completion is expected, in this case we don't return a due date.
            if (searchableTimeline == null)
            {
                return ImmutableList<DateOnly>.Empty;
            }

            ImmutableList<DateOnly> dueDates = CalculateDueDatesInTimeline(
                recurrence.Stages,
                completionDates,
                searchableTimeline,
                today,
                arrangementEndedDate
            );

            return dueDates;
        }

        internal static ImmutableList<DateOnly> CalculateMissingMonitoringRequirementInstancesForChildCareOccurrences(
            ChildCareOccurrenceBasedRecurrencePolicy recurrence,
            Guid? filterToFamilyId,
            ImmutableList<DateOnly> completionDates,
            ImmutableList<ChildLocation> childLocationHistory
        )
        {
            // Determine which child care occurrences the requirement will apply to.
            ImmutableList<ChildLocation> applicableOccurrences = childLocationHistory
                .Where(x => !x.Paused && (filterToFamilyId == null || x.ChildLocationFamilyId == filterToFamilyId))
                .Where(
                    (x, i) =>
                        recurrence.Positive
                            ? i % recurrence.Frequency == recurrence.InitialSkipCount
                            : i % recurrence.Frequency != recurrence.InitialSkipCount
                )
                .ToImmutableList();

            // Determine which child care occurrences did not have a completion within the required delay timespan.
            ImmutableList<ChildLocation> missedOccurrences = applicableOccurrences
                .Where(x => !completionDates.Any(c => c >= x.Date && c <= x.Date.AddDays(recurrence.Delay.Days)))
                .ToImmutableList();

            // Return the due-by date of each missed occurrence.
            ImmutableList<DateOnly> missingInstances = missedOccurrences
                .Select(x => x.Date.AddDays(recurrence.Delay.Days))
                .ToImmutableList();

            return missingInstances;
        }

        internal static ImmutableList<MissingArrangementRequirement> CalculateMissingCloseoutRequirements(
            ArrangementPolicy arrangementPolicy,
            ArrangementEntry arrangement,
            DateOnly today
        )
        {
            ImmutableList<MissingArrangementRequirement> arrangementLevelResults = arrangementPolicy
                .RequiredCloseoutActionNames.Where(requiredAction =>
                    !SharedCalculations
                        .RequirementMetOrExempted(
                            requiredAction,
                            null,
                            today,
                            arrangement.CompletedRequirements,
                            arrangement.ExemptedRequirements
                        )
                        .IsMetOrExempted
                )
                .Select(requiredAction => new MissingArrangementRequirement(
                    null,
                    null,
                    null,
                    null,
                    requiredAction,
                    null,
                    null
                ))
                .ToImmutableList();

            ImmutableList<MissingArrangementRequirement> familyAssignmentResults = arrangement
                .FamilyVolunteerAssignments.SelectMany(fva =>
                {
                    ArrangementFunctionVariant? functionVariant = arrangementPolicy
                        .ArrangementFunctions.SingleOrDefault(af => af.FunctionName == fva.ArrangementFunction)
                        ?.Variants?.SingleOrDefault(afv => afv.VariantName == fva.ArrangementFunctionVariant);

                    if (functionVariant == null)
                    {
                        return ImmutableList<MissingArrangementRequirement>.Empty;
                    }

                    return functionVariant
                        .RequiredCloseoutActionNames.Where(requiredAction =>
                            !SharedCalculations
                                .RequirementMetOrExempted(
                                    requiredAction,
                                    null,
                                    today,
                                    fva.CompletedRequirements,
                                    fva.ExemptedRequirements
                                )
                                .IsMetOrExempted
                        )
                        .Select(requiredAction => new MissingArrangementRequirement(
                            fva.ArrangementFunction,
                            fva.ArrangementFunctionVariant,
                            fva.FamilyId,
                            null,
                            requiredAction,
                            null,
                            null
                        ))
                        .ToImmutableList();
                })
                .ToImmutableList();

            ImmutableList<MissingArrangementRequirement> individualAssignmentResults = arrangement
                .IndividualVolunteerAssignments.SelectMany(iva =>
                {
                    ArrangementFunctionVariant? functionVariant = arrangementPolicy
                        .ArrangementFunctions.SingleOrDefault(af => af.FunctionName == iva.ArrangementFunction)
                        ?.Variants?.SingleOrDefault(afv => afv.VariantName == iva.ArrangementFunctionVariant);

                    if (functionVariant == null)
                    {
                        return ImmutableList<MissingArrangementRequirement>.Empty;
                    }

                    return functionVariant
                        .RequiredCloseoutActionNames.Where(requiredAction =>
                            !SharedCalculations
                                .RequirementMetOrExempted(
                                    requiredAction,
                                    null,
                                    today,
                                    iva.CompletedRequirements,
                                    iva.ExemptedRequirements
                                )
                                .IsMetOrExempted
                        )
                        .Select(requiredAction => new MissingArrangementRequirement(
                            iva.ArrangementFunction,
                            iva.ArrangementFunctionVariant,
                            iva.FamilyId,
                            iva.PersonId,
                            requiredAction,
                            null,
                            null
                        ))
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
            ImmutableList<IndividualVolunteerAssignment> individualVolunteerAssignments
        )
        {
            // NOTE: This calculation assumes that the current assignments are valid,
            //       implying that the assignments were validated when they were made.
            //TODO: Ensure assignments are validated (server-side) when they are made,
            //      and decide whether to flag changes in validity here or elsewhere.
            return volunteerFunctions
                .Where(vf =>
                    (
                        vf.Requirement == FunctionRequirement.ExactlyOne
                        || vf.Requirement == FunctionRequirement.OneOrMore
                    )
                    && familyVolunteerAssignments.Where(fva => fva.ArrangementFunction == vf.FunctionName).Count() == 0
                    && individualVolunteerAssignments.Where(iva => iva.ArrangementFunction == vf.FunctionName).Count()
                        == 0
                )
                .ToImmutableList();
        }
    }
}
