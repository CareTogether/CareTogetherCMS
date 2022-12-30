using CareTogether.Engines;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers;
using CareTogether.Managers.Directory;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Nito.AsyncEx;
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
    public sealed record Location([property: Key] Guid Id,
        Guid OrganizationId, string Name);

    public sealed record Family([property: Key] Guid Id,
        [property: ForeignKey("LocationId")] Location Location, Guid LocationId, string Name,
        string? PrimaryEmail, string? PrimaryPhoneNumber, Address? PrimaryAddress);

    public sealed record Person([property: Key] Guid Id,
        [property: ForeignKey("FamilyId")] Family Family, Guid FamilyId,
        string FirstName, string LastName,
        string? Ethnicity, DateOnly? DateOfBirth);

    public sealed record Address(
        string Line1, string? Line2, string City, string State, string PostalCode);

    public sealed record FamilyRoleApproval(
        [property: ForeignKey("FamilyId")] Family Family, [property: Key] Guid FamilyId,
        [property: ForeignKey("RoleName")] Role Role, [property: Key] string RoleName,
        RoleApprovalStatus ApprovalStatus);

    public sealed record IndividualRoleApproval(
        [property: ForeignKey("PersonId")] Person Person, [property: Key] Guid PersonId,
        [property: ForeignKey("RoleName")] Role Role, [property: Key] string RoleName,
        RoleApprovalStatus ApprovalStatus);

    public sealed record Role([property: Key] string Name);

    public sealed record Referral([property: Key] Guid Id,
        [property: ForeignKey("FamilyId")] Family Family, Guid FamilyId,
        DateOnly Opened, DateOnly? Closed,
        ReferralCloseReason? CloseReason);

    public sealed record Arrangement([property: Key] Guid Id,
        [property: ForeignKey("TypeName")] ArrangementType Type, string TypeName,
        [property: ForeignKey("ReferralId")] Referral Referral, Guid ReferralId,
        [property: ForeignKey("PersonId")] Person Person, Guid PersonId,
        DateOnly Requested, DateTime? StartedUtc, DateTime? EndedUtc,
        ArrangementPhase Phase);

    public sealed record ArrangementType([property: Key] string Type,
        ChildInvolvement ChildInvolvement);

    public sealed record ChildLocationRecord(
        [property: ForeignKey("ArrangementId")] Arrangement Arrangement, [property: Key] Guid ArrangementId,
        [property: ForeignKey("ChildPersonId")] Person Child, [property: Key] Guid ChildPersonId,
        [property: ForeignKey("FamilyId")] Family Family, [property: Key] Guid FamilyId,
        [property: Key] DateTime StartedAtUtc,
        ChildLocationPlan ChildcarePlan,
        DateTime? EndedAtUtc, TimeSpan Duration); // Provide a server-calculated duration that is accurate as of the request time.

    public sealed record FamilyFunctionAssignment(
        [property: ForeignKey("ArrangementId")] Arrangement Arrangement, [property: Key] Guid ArrangementId,
        [property: ForeignKey("FamilyId")] Family Family, [property: Key] Guid FamilyId,
        [property: Key] string Function);

    public sealed record IndividualFunctionAssignment(
        [property: ForeignKey("ArrangementId")] Arrangement Arrangement, [property: Key] Guid ArrangementId,
        [property: ForeignKey("PersonId")] Person Person, [property: Key] Guid PersonId,
        [property: Key] string Function);


    public sealed record LiveModel(IEnumerable<Location> Locations,
        IEnumerable<Family> Families, IEnumerable<Person> People,
        IEnumerable<Role> Roles,
        IEnumerable<FamilyRoleApproval> FamilyRoleApprovals,
        IEnumerable<IndividualRoleApproval> IndividualRoleApprovals,
        IEnumerable<Referral> Referrals,
        IEnumerable<Arrangement> Arrangements,
        IEnumerable<ArrangementType> ArrangementTypes,
        IEnumerable<ChildLocationRecord> ChildLocationRecords,
        IEnumerable<FamilyFunctionAssignment> FamilyFunctionAssignments,
        IEnumerable<IndividualFunctionAssignment> IndividualFunctionAssignments);


    [Route("api/odata/live")]
    [OpenApiIgnore]
    [EnableQuery(MaxExpansionDepth = int.MaxValue, MaxAnyAllExpressionDepth = int.MaxValue)]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = "Basic")]
    public class LiveODataModelController : ODataController
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IRecordsManager directoryManager;

        public LiveODataModelController(IPoliciesResource policiesResource,
            IRecordsManager directoryManager)
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

        [HttpGet("ArrangementType")]
        public async Task<IEnumerable<ArrangementType>> GetArrangementTypesAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.ArrangementTypes;
        }

        [HttpGet("ChildLocationRecords")]
        public async Task<IEnumerable<ChildLocationRecord>> GetChildLocationRecordsAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.ChildLocationRecords;
        }

        [HttpGet("FamilyFunctionAssignments")]
        public async Task<IEnumerable<FamilyFunctionAssignment>> GetFamilyFunctionAssignmentsAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.FamilyFunctionAssignments;
        }

        [HttpGet("IndividualFunctionAssignments")]
        public async Task<IEnumerable<IndividualFunctionAssignment>> GetIndividualFunctionAssignmentsAsync()
        {
            var liveModel = await RenderLiveModelAsync();
            return liveModel.IndividualFunctionAssignments;
        }


        private async Task<LiveModel> RenderLiveModelAsync()
        {
            var organizationId = GetUserSingleOrganizationId();

            var organizationConfiguration = await policiesResource.GetConfigurationAsync(organizationId);

            var locationPolicies = await organizationConfiguration.Locations
                .Select(async location => (location, policy: await policiesResource.GetCurrentPolicy(organizationId, location.Id)))
                .WhenAll();

            var roles = locationPolicies
                .SelectMany(locationPolicy =>
                {
                    return locationPolicy.policy.VolunteerPolicy.VolunteerRoles.Select(role => role.Value.VolunteerRoleType)
                        .Concat(locationPolicy.policy.VolunteerPolicy.VolunteerFamilyRoles.Select(role => role.Value.VolunteerFamilyRoleType))
                        .Select(roleName => new Role(roleName));
                }).Distinct().ToArray();

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
                .SelectMany(x => RenderFamilyRoleApprovals(x.Item1, x.Item2, roles)).ToArray();
            var individualRoleApprovals = familiesWithInfo
                .SelectMany(x => RenderIndividualRoleApprovals(x.Item1, x.Item2, people, roles)).ToArray();

            var referrals = familiesWithInfo.SelectMany(x => RenderReferrals(x.Item1, x.Item2)).ToArray();

            var arrangementTypes = locationPolicies.SelectMany(locationPolicy =>
                locationPolicy.policy.ReferralPolicy.ArrangementPolicies
                    .Select(arrangementPolicy => new ArrangementType(arrangementPolicy.ArrangementType, arrangementPolicy.ChildInvolvement)))
                .DistinctBy(x => x.Type)
                .ToArray();

            var arrangements = familiesWithInfo.SelectMany(x => RenderArrangements(x.Item1, x.Item2, people, referrals, arrangementTypes)).ToArray();

            var childLocationRecords = familiesWithInfo.SelectMany(x => RenderChildLocationRecords(x.Item1, x.Item2, families, people, arrangements)).ToArray();

            var familyFunctionAssignments = familiesWithInfo.SelectMany(x => RenderFamilyFunctionAssignments(x.Item1, x.Item2, families, people, arrangements)).ToArray();

            var individualFunctionAssignments = familiesWithInfo.SelectMany(x => RenderIndividualFunctionAssignments(x.Item1, x.Item2, families, people, arrangements)).ToArray();

            return new LiveModel(locations, families, people,
                roles, familyRoleApprovals, individualRoleApprovals,
                referrals, arrangements, arrangementTypes,
                childLocationRecords, familyFunctionAssignments, individualFunctionAssignments);
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
            CombinedFamilyInfo familyInfo, Family family, Role[] roles)
        {
            return familyInfo.VolunteerFamilyInfo?.FamilyRoleApprovals
                .SelectMany(fra =>
                {
                    var bestCurrentApproval = fra.Value
                        .Where(rva => rva.ExpiresAt == null || rva.ExpiresAt > DateTime.Now)
                        .MaxBy(rva => rva.ApprovalStatus);
                    return bestCurrentApproval == null
                        ? Enumerable.Empty<FamilyRoleApproval>()
                        : new[]
                        {
                            new FamilyRoleApproval(family, family.Id,
                                roles.Single(role => role.Name == fra.Key), fra.Key,
                                bestCurrentApproval.ApprovalStatus)
                        };
                })
                ?? Enumerable.Empty<FamilyRoleApproval>();
        }

        private static IEnumerable<IndividualRoleApproval> RenderIndividualRoleApprovals(
            CombinedFamilyInfo familyInfo, Family family, Person[] people, Role[] roles)
        {
            return familyInfo.VolunteerFamilyInfo?.IndividualVolunteers
                .SelectMany(individual => individual.Value.IndividualRoleApprovals
                    .SelectMany(ira =>
                    {
                        var bestCurrentApproval = ira.Value
                            .Where(rva => rva.ExpiresAt == null || rva.ExpiresAt > DateTime.Now)
                            .MaxBy(rva => rva.ApprovalStatus);
                        return bestCurrentApproval == null
                            ? Enumerable.Empty<IndividualRoleApproval>()
                            : new[]
                            {
                                new IndividualRoleApproval(
                                    people.Single(person => person.Id == individual.Key), individual.Key,
                                    roles.Single(role => role.Name == ira.Key), ira.Key,
                                    bestCurrentApproval.ApprovalStatus)
                            };
                    }))
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
            CombinedFamilyInfo familyInfo, Family family, Person[] people, Referral[] referrals, ArrangementType[] arrangementTypes)
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
                    return new Arrangement(arrangement.Id,
                        arrangementTypes.Single(type => type.Type == arrangement.ArrangementType), arrangement.ArrangementType,
                        referral, referral.Id,
                        arrangementPerson, arrangement.PartneringFamilyPersonId,
                        DateOnly.FromDateTime(arrangement.RequestedAtUtc),
                        arrangement.StartedAtUtc, arrangement.EndedAtUtc, arrangement.Phase);
                });
            });
        }

        private static IEnumerable<ChildLocationRecord> RenderChildLocationRecords(
            CombinedFamilyInfo familyInfo, Family family, Family[] families, Person[] people, Arrangement[] arrangements)
        {
            var allReferralsInfo = (familyInfo.PartneringFamilyInfo?.ClosedReferrals ?? ImmutableList.Create<Managers.Referral>()).AddRange(
                familyInfo.PartneringFamilyInfo?.OpenReferral == null
                ? Array.Empty<Managers.Referral>() : new[] { familyInfo.PartneringFamilyInfo.OpenReferral });
            return allReferralsInfo.SelectMany(referralInfo =>
            {
                return referralInfo.Arrangements.SelectMany(arrangement =>
                {
                    var arrangementRecord = arrangements.Single(arr => arr.Id == arrangement.Id);
                    var arrangementPerson = people.Single(p => p.Id == arrangement.PartneringFamilyPersonId);
                    return arrangement.ChildLocationHistory.Select((history, i) =>
                    {
                        var receivingFamily = families.Single(f => f.Id == history.ChildLocationFamilyId);
                        var nextLocation = arrangement.ChildLocationHistory.Count > i + 1
                            ? arrangement.ChildLocationHistory[i + 1]
                            : null;
                        var locationEffectiveEndTimestamp = nextLocation?.TimestampUtc
                            ?? arrangement.EndedAtUtc
                            ?? DateTime.UtcNow;
                        var effectiveDuration = locationEffectiveEndTimestamp.Subtract(history.TimestampUtc);

                        return new ChildLocationRecord(
                            arrangementRecord, arrangement.Id,
                            arrangementPerson, arrangement.PartneringFamilyPersonId,
                            receivingFamily, history.ChildLocationFamilyId,
                            history.TimestampUtc, history.Plan,
                            EndedAtUtc: nextLocation?.TimestampUtc,
                            Duration: effectiveDuration);
                    });
                });
            });
        }

        private static IEnumerable<FamilyFunctionAssignment> RenderFamilyFunctionAssignments(
            CombinedFamilyInfo familyInfo, Family family, Family[] families, Person[] people, Arrangement[] arrangements)
        {
            var allReferralsInfo = (familyInfo.PartneringFamilyInfo?.ClosedReferrals ?? ImmutableList.Create<Managers.Referral>()).AddRange(
                familyInfo.PartneringFamilyInfo?.OpenReferral == null
                ? Array.Empty<Managers.Referral>() : new[] { familyInfo.PartneringFamilyInfo.OpenReferral });
            return allReferralsInfo.SelectMany(referralInfo =>
            {
                return referralInfo.Arrangements.SelectMany(arrangement =>
                {
                    var arrangementRecord = arrangements.Single(arr => arr.Id == arrangement.Id);
                    return arrangement.FamilyVolunteerAssignments.Select(fva =>
                        new FamilyFunctionAssignment(arrangementRecord, arrangement.Id,
                            families.Single(f => f.Id == fva.FamilyId), fva.FamilyId,
                            fva.ArrangementFunction));
                });
            });
        }

        private static IEnumerable<IndividualFunctionAssignment> RenderIndividualFunctionAssignments(
            CombinedFamilyInfo familyInfo, Family family, Family[] families, Person[] people, Arrangement[] arrangements)
        {
            var allReferralsInfo = (familyInfo.PartneringFamilyInfo?.ClosedReferrals ?? ImmutableList.Create<Managers.Referral>()).AddRange(
                familyInfo.PartneringFamilyInfo?.OpenReferral == null
                ? Array.Empty<Managers.Referral>() : new[] { familyInfo.PartneringFamilyInfo.OpenReferral });
            return allReferralsInfo.SelectMany(referralInfo =>
            {
                return referralInfo.Arrangements.SelectMany(arrangement =>
                {
                    var arrangementRecord = arrangements.Single(arr => arr.Id == arrangement.Id);
                    return arrangement.IndividualVolunteerAssignments.Select(fva =>
                        new IndividualFunctionAssignment(arrangementRecord, arrangement.Id,
                            people.Single(p => p.Id == fva.PersonId), fva.PersonId,
                            fva.ArrangementFunction));
                });
            });
        }
    }
}
