using System;
using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers;
using CareTogether.Resources.Directory;

namespace CareTogether.Engines.Authorization
{
    internal static class ApprovalRenewalDisclosure
    {
        internal static ImmutableList<DisclosedApprovalRenewalCandidate> ForFamily(
            Family disclosedFamily,
            VolunteerFamilyInfo approval,
            ImmutableList<Permission> permissions
        )
        {
            if (!CanViewRenewals(permissions) || approval.InternalRenewalCandidates.IsEmpty)
                return [];

            var adultIds = disclosedFamily.Adults
                .Where(adult => adult.Item1.Active)
                .Select(adult => adult.Item1.Id)
                .ToImmutableHashSet();

            return approval.InternalRenewalCandidates
                .Select(candidate =>
                {
                    var subject = candidate.Obligation.Subject;
                    if (subject.RecordId != disclosedFamily.Id)
                        return null;

                    ApprovalRenewalTarget? target = subject switch
                    {
                        { Kind: ApprovalSubjectKind.Family, PersonId: null } =>
                            new FamilyApprovalRenewalTarget(subject.RecordId),
                        { Kind: ApprovalSubjectKind.Individual, PersonId: Guid personId }
                            when adultIds.Contains(personId) && approval.IndividualVolunteers.ContainsKey(personId) =>
                            new IndividualApprovalRenewalTarget(subject.RecordId, personId),
                        _ => null,
                    };
                    if (target is null)
                        return null;

                    var roles = candidate.AffectedRoles
                        .Where(role => role.Subject.RecordId == disclosedFamily.Id)
                        .Where(role => role.Subject switch
                        {
                            { Kind: ApprovalSubjectKind.Family, PersonId: null } =>
                                approval.FamilyRoleApprovals.ContainsKey(role.RoleName),
                            { Kind: ApprovalSubjectKind.Individual, PersonId: Guid personId }
                                when target is IndividualApprovalRenewalTarget individual && individual.PersonId == personId =>
                                approval.IndividualVolunteers.TryGetValue(personId, out var volunteer)
                                && volunteer.ApprovalStatusByRole.ContainsKey(role.RoleName),
                            _ => false,
                        })
                        .ToImmutableList();
                    return roles.IsEmpty ? null : Map(candidate, target, roles);
                })
                .OfType<DisclosedApprovalRenewalCandidate>()
                .ToImmutableList();
        }

        internal static ImmutableList<DisclosedApprovalRenewalCandidate> ForOrganization(
            Guid communityId,
            OrganizationApprovalInfo approval,
            ImmutableList<Permission> permissions
        )
        {
            if (!CanViewRenewals(permissions) || approval.InternalRenewalCandidates.IsEmpty)
                return [];

            var expected = new ApprovalSubject(ApprovalSubjectKind.Organization, communityId);
            var target = new OrganizationApprovalRenewalTarget(communityId);
            return approval.InternalRenewalCandidates
                .Where(candidate => candidate.Obligation.Subject == expected)
                .Select(candidate =>
                {
                    var roles = candidate.AffectedRoles
                        .Where(role => role.Subject == expected && approval.ApprovalStatusByRole.ContainsKey(role.RoleName))
                        .ToImmutableList();
                    return roles.IsEmpty ? null : Map(candidate, target, roles);
                })
                .OfType<DisclosedApprovalRenewalCandidate>()
                .ToImmutableList();
        }

        private static bool CanViewRenewals(ImmutableList<Permission> permissions) =>
            permissions.Contains(Permission.ViewApprovalStatus)
            && permissions.Contains(Permission.ViewApprovalProgress);

        private static DisclosedApprovalRenewalCandidate Map(
            ApprovalRenewalCandidate candidate,
            ApprovalRenewalTarget target,
            ImmutableList<ApprovalRenewalRole> roles
        ) =>
            new(
                candidate.CandidateKey,
                target,
                candidate.Obligation.ActionName,
                candidate.FirstUncoveredOnUtc,
                candidate.State == ApprovalRenewalState.Upcoming
                    ? DisclosedApprovalRenewalState.Upcoming
                    : DisclosedApprovalRenewalState.Uncovered,
                roles.Select(role => new DisclosedApprovalRenewalRole(
                    role.Subject.Kind switch
                    {
                        ApprovalSubjectKind.Family => ApprovalRenewalRoleScope.Family,
                        ApprovalSubjectKind.Individual => ApprovalRenewalRoleScope.Individual,
                        ApprovalSubjectKind.Organization => ApprovalRenewalRoleScope.Organization,
                        _ => throw new InvalidOperationException("Unknown approval subject kind."),
                    },
                    role.RoleName
                )).ToImmutableList()
            );
    }
}
