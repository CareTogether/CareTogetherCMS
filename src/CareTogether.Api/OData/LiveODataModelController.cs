using CareTogether.Managers;
using CareTogether.Managers.Directory;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using NSwag.Annotations;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Api.OData
{
    public sealed record Location(Guid Id,
        Guid OrganizationId, string Name);

    public sealed record Family(Guid Id,
        [property: ForeignKey("LocationId")] Location Location, Guid LocationId, string Name,
        string? PrimaryEmail, string? PrimaryPhoneNumber, Address? PrimaryAddress);

    public sealed record Person(Guid Id,
        [property: ForeignKey("FamilyId")] Family Family, Guid FamilyId,
        string FirstName, string LastName,
        string? Ethnicity, DateOnly? DateOfBirth);

    public sealed record Address(
        string Line1, string? Line2, string City, string State, string PostalCode);

    public sealed record FamilyRoleApproval(
        [property: ForeignKey("FamilyId")] Family Family, [property: Key] Guid FamilyId,
        [property: ForeignKey("RoleName")] Role Role, [property: Key] string RoleName,
        ApprovalStage ApprovalStage);

    public sealed record IndividualRoleApproval(
        [property: ForeignKey("PersonId")] Person Person, [property: Key] Guid PersonId,
        [property: ForeignKey("RoleName")] Role Role, [property: Key] string RoleName,
        ApprovalStage ApprovalStage);

    public sealed record Role([property: Key] string Name);

    public sealed record ApprovalStage([property: Key] string Name, int Order);

    public sealed record Referral(Guid Id,
        [property: ForeignKey("FamilyId")] Family Family, Guid FamilyId,
        DateOnly Opened, DateOnly? Closed,
        ReferralCloseReason? CloseReason);

    public sealed record Arrangement(Guid Id, string Type,
        [property: ForeignKey("ReferralId")] Referral Referral, Guid ReferralId,
        [property: ForeignKey("PersonId")] Person Person, Guid PersonId,
        DateOnly Requested, DateTime? StartedUtc, DateTime? EndedUtc,
        string Phase);


    public sealed record LiveModel(IEnumerable<Location> Locations,
        IEnumerable<Family> Families, IEnumerable<Person> People,
        IEnumerable<Role> Roles, IEnumerable<ApprovalStage> ApprovalStages,
        IEnumerable<FamilyRoleApproval> FamilyRoleApprovals,
        IEnumerable<IndividualRoleApproval> IndividualRoleApprovals,
        IEnumerable<Referral> Referrals,
        IEnumerable<Arrangement> Arrangements);


    [Route("api/odata/live")]
    [OpenApiIgnore]
    [EnableQuery(MaxExpansionDepth = int.MaxValue, MaxAnyAllExpressionDepth = int.MaxValue)]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = "Basic")]
    public class LiveODataModelController : ODataController
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IDirectoryManager directoryManager;

        public LiveODataModelController(IPoliciesResource policiesResource,
            IDirectoryManager directoryManager)
        {
            this.policiesResource = policiesResource;
            this.directoryManager = directoryManager;
        }


        [HttpGet("Location")]
        public async Task<IEnumerable<Location>> GetLocationsAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.Locations;
        }

        [HttpGet("Family")]
        public async Task<IEnumerable<Family>> GetFamiliesAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.Families;
        }

        [HttpGet("Person")]
        public async Task<IEnumerable<Person>> GetPeopleAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.People;
        }

        [HttpGet("Role")]
        public async Task<IEnumerable<Role>> GetRolesAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.Roles;
        }

        [HttpGet("FamilyRoleApprovals")]
        public async Task<IEnumerable<FamilyRoleApproval>> GetFamilyRoleApprovalsAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.FamilyRoleApprovals;
        }

        [HttpGet("IndividualRoleApprovals")]
        public async Task<IEnumerable<IndividualRoleApproval>> GetIndividualRoleApprovalsAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.IndividualRoleApprovals;
        }

        [HttpGet("ApprovalStage")]
        public async Task<IEnumerable<ApprovalStage>> GetApprovalStagesAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.ApprovalStages;
        }

        [HttpGet("Referral")]
        public async Task<IEnumerable<Referral>> GetReferralsAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.Referrals;
        }

        [HttpGet("Arrangement")]
        public async Task<IEnumerable<Arrangement>> GetArrangementsAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.Arrangements;
        }


        private async Task<LiveModel> RenderLiveModelAsync()
        {
            var organizationId = GetUserSingleOrganizationId();

            var organizationConfiguration = await policiesResource.GetConfigurationAsync(organizationId);

            var roles = await organizationConfiguration.Locations
                .SelectManyAsync(async location =>
                {
                    var policy = await policiesResource.GetCurrentPolicy(organizationId, location.Id);
                    return policy.VolunteerPolicy.VolunteerRoles.Select(role => role.Value.VolunteerRoleType)
                        .Concat(policy.VolunteerPolicy.VolunteerFamilyRoles.Select(role => role.Value.VolunteerFamilyRoleType))
                        .Select(roleName => new Role(roleName));
                }).Distinct().ToArrayAsync();

            var approvalStages = Enum.GetNames<Engines.RoleApprovalStatus>()
                .Select(ras => new ApprovalStage(ras, (int)Enum.Parse<Engines.RoleApprovalStatus>(ras))).ToArray();

            var locations = organizationConfiguration.Locations
                .Select(location => new Location(location.Id, organizationId, location.Name))
                .ToArray();

            var familiesByLocation = await locations.ZipSelectManyAsync(location =>
                directoryManager.ListVisibleFamiliesAsync(User, location.OrganizationId, location.Id))
                .ToArrayAsync();

            var familiesWithInfo = familiesByLocation.Select(x => RenderFamily(x.Item1, x.Item2)).ToArray();
            var families = familiesWithInfo.Select(family => family.Item2).ToArray();

            var people = familiesWithInfo.SelectMany(x => RenderPeople(x.Item1, x.Item2)).ToArray();

            var familyRoleApprovals = familiesWithInfo
                .SelectMany(x => RenderFamilyRoleApprovals(x.Item1, x.Item2, roles, approvalStages)).ToArray();
            var individualRoleApprovals = familiesWithInfo
                .SelectMany(x => RenderIndividualRoleApprovals(x.Item1, x.Item2, people, roles, approvalStages)).ToArray();

            var referrals = familiesWithInfo.SelectMany(x => RenderReferrals(x.Item1, x.Item2)).ToArray();

            var arrangements = familiesWithInfo.SelectMany(x => RenderArrangements(x.Item1, x.Item2, people, referrals)).ToArray();

            return new LiveModel(locations, families, people,
                roles, approvalStages, familyRoleApprovals, individualRoleApprovals,
                referrals, arrangements);
        }

        private Guid GetUserSingleOrganizationId()
        {
            var singleOrganizationId = User.Claims.Single(claim => claim.Type == Claims.OrganizationId);
            return Guid.Parse(singleOrganizationId.Value);
        }

        private static (CombinedFamilyInfo, Family) RenderFamily(Location location, CombinedFamilyInfo family)
        {
            var primaryContactPerson = family.Family.Adults
                .Single(adult => adult.Item1.Id == family.Family.PrimaryFamilyContactPersonId).Item1;

            var familyName = $"{primaryContactPerson.FirstName} {primaryContactPerson.LastName} Family";

            var primaryEmail = primaryContactPerson.EmailAddresses
                .SingleOrDefault(x => x.Id == primaryContactPerson.PreferredEmailAddressId)?.Address;
            var primaryAddressInfo = primaryContactPerson.Addresses
                .SingleOrDefault(x => x.Id == primaryContactPerson.CurrentAddressId);
            var primaryAddress = primaryAddressInfo == null ? null :
                new Address(primaryAddressInfo.Line1, primaryAddressInfo.Line2,
                    primaryAddressInfo.City, primaryAddressInfo.State, primaryAddressInfo.PostalCode);
            var primaryPhoneNumber = primaryContactPerson.PhoneNumbers
                .SingleOrDefault(x => x.Id == primaryContactPerson.PreferredPhoneNumberId)?.Number;

            return (family, new Family(family.Family.Id, location, location.Id, familyName,
                primaryEmail, primaryPhoneNumber, primaryAddress));
        }

        private static IEnumerable<Person> RenderPeople(CombinedFamilyInfo familyInfo, Family family)
        {
            return familyInfo.Family.Adults
                .Select(adult => new Person(adult.Item1.Id, family, family.Id,
                    adult.Item1.FirstName, adult.Item1.LastName,
                    adult.Item1.Ethnicity,
                    adult.Item1.Age is ExactAge ? DateOnly.FromDateTime((adult.Item1.Age as ExactAge)!.DateOfBirth) : null))
                .Concat(familyInfo.Family.Children
                    .Select(child => new Person(child.Id, family, family.Id,
                        child.FirstName, child.LastName,
                        child.Ethnicity,
                        child.Age is ExactAge ? DateOnly.FromDateTime((child.Age as ExactAge)!.DateOfBirth) : null)));
        }

        private static IEnumerable<FamilyRoleApproval> RenderFamilyRoleApprovals(
            CombinedFamilyInfo familyInfo, Family family, Role[] roles, ApprovalStage[] approvalStages)
        {
            return familyInfo.VolunteerFamilyInfo?.FamilyRoleApprovals
                .SelectMany(fra => fra.Value.Select(approval =>
                    new FamilyRoleApproval(family, family.Id,
                        roles.Single(role => role.Name == fra.Key), fra.Key,
                        approvalStages.Single(ras => ras.Name == approval.ApprovalStatus.ToString()))))
                ?? Enumerable.Empty<FamilyRoleApproval>();
        }

        private static IEnumerable<IndividualRoleApproval> RenderIndividualRoleApprovals(
            CombinedFamilyInfo familyInfo, Family family, Person[] people, Role[] roles, ApprovalStage[] approvalStages)
        {
            return familyInfo.VolunteerFamilyInfo?.IndividualVolunteers
                .SelectMany(individual => individual.Value.IndividualRoleApprovals
                    .SelectMany(ira => ira.Value.Select(approval =>
                        new IndividualRoleApproval(people.Single(person => person.Id == individual.Key), individual.Key,
                            roles.Single(role => role.Name == ira.Key), ira.Key,
                            approvalStages.Single(ras => ras.Name == approval.ApprovalStatus.ToString())))))
                ?? Enumerable.Empty<IndividualRoleApproval>();
        }

        private static IEnumerable<Referral> RenderReferrals(
            CombinedFamilyInfo familyInfo, Family family)
        {
            var allReferralsInfo = (familyInfo.PartneringFamilyInfo?.ClosedReferrals ?? ImmutableList.Create<Managers.Referral>()).AddRange(
                familyInfo.PartneringFamilyInfo?.OpenReferral == null
                ? Array.Empty<Managers.Referral>() : new[] { familyInfo.PartneringFamilyInfo.OpenReferral });
            return allReferralsInfo.Select(referralInfo => new Referral(referralInfo.Id, family, family.Id,
                DateOnly.FromDateTime(referralInfo.OpenedAtUtc),
                referralInfo.ClosedAtUtc.HasValue ? DateOnly.FromDateTime(referralInfo.ClosedAtUtc.Value) : null,
                referralInfo.CloseReason));
        }

        private static IEnumerable<Arrangement> RenderArrangements(
            CombinedFamilyInfo familyInfo, Family family, Person[] people, Referral[] referrals)
        {
            var allReferralsInfo = (familyInfo.PartneringFamilyInfo?.ClosedReferrals ?? ImmutableList.Create<Managers.Referral>()).AddRange(
                familyInfo.PartneringFamilyInfo?.OpenReferral == null
                ? Array.Empty<Managers.Referral>() : new[] { familyInfo.PartneringFamilyInfo.OpenReferral });
            return allReferralsInfo.SelectMany(referralInfo =>
            {
                var referral = referrals.Single(r => r.Id == referralInfo.Id);
                return referralInfo.Arrangements.Select(arrangement =>
                {
                    var arrangementPerson = people.Single(p => p.Id == arrangement.PartneringFamilyPersonId);
                    return new Arrangement(arrangement.Id, arrangement.ArrangementType, referral, referral.Id,
                        arrangementPerson, arrangement.PartneringFamilyPersonId,
                        DateOnly.FromDateTime(arrangement.RequestedAtUtc),
                        arrangement.StartedAtUtc, arrangement.EndedAtUtc, arrangement.Phase.ToString());
                });
            });
        }
    }
}
