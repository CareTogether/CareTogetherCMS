using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using Timelines;

namespace CareTogether.Engines.PolicyEvaluation
{
    internal enum ApprovalSubjectKind
    {
        Family,
        Individual,
        Organization,
    }

    internal enum ApprovalRenewalState
    {
        Upcoming,
        Uncovered,
    }

    internal sealed record ApprovalSubject(ApprovalSubjectKind Kind, Guid RecordId, Guid? PersonId = null);
    internal sealed record ApprovalRenewalObligation(ApprovalSubject Subject, string ActionName);
    internal sealed record ApprovalRenewalRole(ApprovalSubject Subject, string RoleName);

    internal sealed record ApprovalRenewalCandidate(
        string CandidateKey,
        ApprovalRenewalObligation Obligation,
        DateOnly FirstUncoveredOnUtc,
        ApprovalRenewalState State,
        ImmutableList<ApprovalRenewalRole> AffectedRoles
    );

    internal static class ApprovalRenewalCalculations
    {
        private sealed record Requirement(ApprovalSubject Subject, string ActionName, DateOnlyTimeline? WhenMet);
        private sealed record Workflow(
            DateTime? SupersededAtUtc,
            DateOnlyTimeline<RoleApprovalStatus>? Status,
            IEnumerable<Requirement> Requirements
        );
        private sealed record Gap(ApprovalRenewalObligation Obligation, DateOnly Day, ApprovalRenewalRole Role);

        internal static ImmutableList<ApprovalRenewalCandidate> ForFamily(
            EffectiveLocationPolicy policy,
            Guid tenantId,
            Guid locationId,
            Family familyRecord,
            FamilyApprovalStatus approvals,
            DateOnly todayUtc
        )
        {
            if (!familyRecord.Active) return [];
            var family = new ApprovalSubject(ApprovalSubjectKind.Family, familyRecord.Id);
            ApprovalSubject PersonSubject(Guid personId) =>
                new(ApprovalSubjectKind.Individual, familyRecord.Id, personId);

            var familyGaps = approvals.FamilyRoleApprovals.SelectMany(role =>
                FindRoleGaps(
                    policy,
                    new(family, role.Key),
                    role.Value.EffectiveRoleApprovalStatus,
                    role.Value.RoleVersionApprovals.Select(version => new Workflow(
                        version.SupersededAtUtc,
                        version.Status,
                        version.Requirements
                            .Where(requirement => RequiredForApproval(requirement.Stage, requirement.IsRequired))
                            .SelectMany(requirement => requirement.StatusDetails.Select(detail =>
                                new Requirement(
                                    detail.PersonId is Guid personId ? PersonSubject(personId) : family,
                                    requirement.ActionName,
                                    detail.WhenMet
                                )
                            ))
                    )),
                    todayUtc
                )
            );

            var activeAdults = familyRecord.Adults.Where(adult => adult.Item1.Active)
                .Select(adult => adult.Item1.Id).ToImmutableHashSet();
            var individualGaps = approvals.IndividualApprovals.Where(person => activeAdults.Contains(person.Key)).SelectMany(person =>
            {
                var subject = PersonSubject(person.Key);
                return person.Value.ApprovalStatusByRole.SelectMany(role =>
                    FindRoleGaps(policy, new(subject, role.Key), role.Value.EffectiveRoleApprovalStatus,
                        role.Value.RoleVersionApprovals.Select(version =>
                            new Workflow(version.SupersededAtUtc, version.Status,
                                version.Requirements
                                    .Where(requirement => RequiredForApproval(requirement.Stage, requirement.IsRequired))
                                    .Select(requirement => new Requirement(subject, requirement.ActionName, requirement.WhenMet)))),
                        todayUtc));
            });

            return Group(tenantId, locationId, todayUtc, familyGaps.Concat(individualGaps));
        }

        internal static ImmutableList<ApprovalRenewalCandidate> ForOrganization(
            EffectiveLocationPolicy policy, Guid tenantId, Guid locationId,
            Guid communityId, OrganizationApprovalStatus approvals, DateOnly todayUtc
        )
        {
            var subject = new ApprovalSubject(ApprovalSubjectKind.Organization, communityId);
            return Group(tenantId, locationId, todayUtc, approvals.ApprovalStatusByRole.SelectMany(role =>
                FindRoleGaps(policy, new(subject, role.Key), role.Value.EffectiveRoleApprovalStatus,
                    role.Value.RoleVersionApprovals.Select(version =>
                        new Workflow(version.SupersededAtUtc, version.Status,
                            version.Requirements
                                .Where(requirement => RequiredForApproval(requirement.Stage))
                                .Select(requirement => new Requirement(subject, requirement.ActionName, requirement.WhenMet)))),
                    todayUtc)));
        }

        private static bool RequiredForApproval(RequirementStage stage, bool? isRequired = null) =>
            isRequired != false && stage is RequirementStage.Application or RequirementStage.Approval;

        private static bool IsEffectiveApproval(RoleApprovalStatus? status) =>
            status is RoleApprovalStatus.Approved or RoleApprovalStatus.Onboarded;

        private static DateOnly? FindEffectiveLoss(DateOnlyTimeline<RoleApprovalStatus>? timeline, DateOnly today)
        {
            if (timeline is null) return null;
            var ranges = timeline.Ranges;
            var index = ranges.FindIndex(range => range.Contains(today));
            if (index < 0) return null;

            while (index + 1 < ranges.Count && IsEffectiveApproval(ranges[index].Tag)
                && ranges[index + 1].Start.DayNumber - ranges[index].End.DayNumber == 1)
                index++;

            return index > 0 && ranges[index].Tag == RoleApprovalStatus.Expired
                && IsEffectiveApproval(ranges[index - 1].Tag)
                && ranges[index].Start.DayNumber - ranges[index - 1].End.DayNumber == 1
                ? ranges[index].Start : null;
        }

        private static IEnumerable<Gap> FindRoleGaps(
            EffectiveLocationPolicy policy, ApprovalRenewalRole role,
            DateOnlyTimeline<RoleApprovalStatus>? effectiveStatus, IEnumerable<Workflow> workflows,
            DateOnly today
        )
        {
            if (FindEffectiveLoss(effectiveStatus, today) is not DateOnly lossDay) return [];
            var lastEffectiveDay = lossDay.AddDays(-1);
            var promptDay = lossDay > today ? lossDay : today;
            var versions = workflows.ToImmutableList();
            var active = versions
                .Where(version => version.SupersededAtUtc is null || DateOnly.FromDateTime(version.SupersededAtUtc.Value) > promptDay)
                .Select(version => (Version: version, Status: version.Status?.ValueAt(promptDay) ?? default))
                .ToImmutableList();
            if (active.IsEmpty) return [];

            var maxStatus = active.Max(version => version.Status);
            if (maxStatus is RoleApprovalStatus.Inactive or RoleApprovalStatus.Denied) return [];

            ApprovalRenewalObligation? Key(Requirement requirement) =>
                SharedCalculations.FindActionDefinition(policy, requirement.ActionName)?.Key is { } action
                    ? new ApprovalRenewalObligation(requirement.Subject, action)
                    : null;

            var blockers = active.Where(version => version.Status == maxStatus)
                .Select(version => version.Version.Requirements
                    .Where(requirement => requirement.WhenMet?.Contains(promptDay) != true)
                    .ToImmutableList())
                .ToImmutableList();
            var supported = blockers[0].Select(Key).ToImmutableHashSet();
            if (supported.Contains(null) || blockers.Any(alternative => !supported.SetEquals(alternative.Select(Key)))) return [];

            bool LostCoverage(Requirement requirement) =>
                requirement.WhenMet?.Contains(lastEffectiveDay) == true
                && !requirement.WhenMet.Contains(lossDay)
                && !requirement.WhenMet.Ranges.Any(range => range.Start > lossDay && range.Start <= promptDay);

            var eligibleLosses = blockers
                .Select(path => path.Where(LostCoverage).Select(Key).ToImmutableHashSet())
                .Aggregate((left, right) => left.Intersect(right));

            var losses = versions
                .Where(version => IsEffectiveApproval(version.Status?.ValueAt(lastEffectiveDay)))
                .SelectMany(version => version.Requirements)
                .Where(LostCoverage)
                .Select(Key).OfType<ApprovalRenewalObligation>();

            return losses.Where(eligibleLosses.Contains).Distinct().Select(key => new Gap(key, lossDay, role));
        }

        private static ImmutableList<ApprovalRenewalCandidate> Group(
            Guid tenantId, Guid locationId, DateOnly today, IEnumerable<Gap> gaps
        ) =>
            gaps.GroupBy(gap => gap.Obligation)
                .Select(group =>
                {
                    var day = group.Min(gap => gap.Day);
                    var subject = group.Key.Subject;
                    return new ApprovalRenewalCandidate(
                        $"approval-renewal:v1:{tenantId:D}:{locationId:D}:{subject.Kind}:{subject.RecordId:D}:{subject.PersonId:D}:{group.Key.ActionName}",
                        group.Key, day,
                        day > today ? ApprovalRenewalState.Upcoming : ApprovalRenewalState.Uncovered,
                        group.Where(gap => gap.Day == day).Select(gap => gap.Role).Distinct()
                            .OrderBy(role => role.Subject.Kind)
                            .ThenBy(role => role.Subject.RecordId)
                            .ThenBy(role => role.Subject.PersonId)
                            .ThenBy(role => role.RoleName, StringComparer.Ordinal)
                            .ToImmutableList());
                })
                .OrderBy(candidate => candidate.FirstUncoveredOnUtc)
                .ThenBy(candidate => candidate.CandidateKey, StringComparer.Ordinal)
                .ToImmutableList();
    }
}
