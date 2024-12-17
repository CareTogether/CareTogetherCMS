using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Managers;
using CareTogether.Managers.Records;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using CareTogether.Resources.Referrals;
using LazyCache;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OData.Query;
using Microsoft.AspNetCore.OData.Routing.Controllers;
using Nito.AsyncEx;
using NSwag.Annotations;

namespace CareTogether.Api.OData
{
    public sealed record Location([property: Key] Guid Id, Guid OrganizationId, string Name);

    public sealed record Family(
        [property: Key] Guid Id,
        [property: ForeignKey("LocationId")] Location Location,
        Guid LocationId,
        string Name,
        string? PrimaryEmail,
        string? PrimaryPhoneNumber,
        Address? PrimaryAddress,
        string? HomeChurch
    );

    public sealed record Person([property: Key] Guid Id,
        [property: ForeignKey("FamilyId")] Family Family, Guid FamilyId,
        string FirstName, string LastName, PersonType PersonType,
        string? Ethnicity, DateOnly? DateOfBirth);

    public enum PersonType
    {
        Adult,
        Child
    }

    public sealed record Community([property: Key] Guid Id,
        [property: ForeignKey("LocationId")] Location Location, Guid LocationId,
        string Name);

    public sealed record Address(
        string? Line1,
        string? Line2,
        string? City,
        string? County,
        string? State,
        string? PostalCode
    );

    public sealed record FamilyRoleApproval(
        [property: ForeignKey("FamilyId")] Family Family,
        [property: Key] Guid FamilyId,
        [property: ForeignKey("RoleName")] Role Role,
        [property: Key] string RoleName,
        [property: Key] DateOnly Start,
        [property: Key] DateOnly End,
        RoleApprovalStatus? Status
    );

    public sealed record IndividualRoleApproval(
        [property: ForeignKey("PersonId")] Person Person,
        [property: Key] Guid PersonId,
        [property: ForeignKey("RoleName")] Role Role,
        [property: Key] string RoleName,
        [property: ForeignKey("FamilyId")] Family Family,
        Guid FamilyId,
        [property: Key] DateOnly Start,
        [property: Key] DateOnly End,
        RoleApprovalStatus? Status
    );

    public sealed record FamilyRoleRemovedIndividual(
        [property: ForeignKey("PersonId")] Person Person,
        [property: Key] Guid PersonId,
        [property: ForeignKey("RoleName")] Role Role,
        [property: Key] string RoleName,
        [property: ForeignKey("FamilyId")] Family Family,
        Guid FamilyId,
        [property: Key] DateOnly Start,
        [property: Key] DateOnly End
    );

    public sealed record Role([property: Key] string Name);

    public sealed record Referral(
        [property: Key] Guid Id,
        [property: ForeignKey("FamilyId")] Family Family,
        Guid FamilyId,
        DateOnly Opened,
        DateOnly? Closed,
        string? ReferralSource,
        ReferralCloseReason? CloseReason,
        string? PrimaryReasonForReferral
    );

    public sealed record Arrangement(
        [property: Key] Guid Id,
        [property: ForeignKey("TypeName")] ArrangementType Type,
        string TypeName,
        [property: ForeignKey("ReferralId")] Referral Referral,
        Guid ReferralId,
        [property: ForeignKey("PersonId")] Person Person,
        Guid PersonId,
        DateOnly Requested,
        DateTime? StartedUtc,
        DateTime? EndedUtc,
        ArrangementPhase Phase,
        string? Reason
    );

    public sealed record ArrangementType([property: Key] string Type, ChildInvolvement ChildInvolvement);

    public sealed record ChildLocationRecord(
        [property: ForeignKey("ArrangementId")] Arrangement Arrangement,
        [property: Key] Guid ArrangementId,
        [property: ForeignKey("ChildPersonId")] Person Child,
        [property: Key] Guid ChildPersonId,
        [property: ForeignKey("FamilyId")] Family Family,
        [property: Key] Guid FamilyId,
        [property: Key] DateTime StartedAtUtc,
        ChildLocationPlan ChildcarePlan,
        DateTime? EndedAtUtc,
        TimeSpan Duration
    ); // Provide a server-calculated duration that is accurate as of the request time.

    public sealed record FamilyFunctionAssignment(
        [property: ForeignKey("ArrangementId")] Arrangement Arrangement,
        [property: Key] Guid ArrangementId,
        [property: ForeignKey("FamilyId")] Family Family,
        [property: Key] Guid FamilyId,
        [property: Key] string Function
    );

    public sealed record IndividualFunctionAssignment(
        [property: ForeignKey("ArrangementId")] Arrangement Arrangement,
        [property: Key] Guid ArrangementId,
        [property: ForeignKey("PersonId")] Person Person,
        [property: Key] Guid PersonId,
        [property: Key] string Function
    );

    public sealed record CommunityMemberFamily(
        [property: ForeignKey("CommunityId")] Community Community,
        [property: Key] Guid CommunityId,
        [property: ForeignKey("FamilyId")] Family Family,
        [property: Key] Guid FamilyId
    );

    public sealed record CommunityRoleAssignment(
        [property: ForeignKey("CommunityId")] Community Community,
        [property: Key] Guid CommunityId,
        [property: ForeignKey("PersonId")] Person Person,
        [property: Key] Guid PersonId,
        [property: Key] string Role
    );

    public sealed record LiveModel(
        IEnumerable<Location> Locations,
        IEnumerable<Family> Families,
        IEnumerable<Person> People,
        IEnumerable<Community> Communities,
        IEnumerable<Role> Roles,
        IEnumerable<FamilyRoleApproval> FamilyRoleApprovals,
        IEnumerable<IndividualRoleApproval> IndividualRoleApprovals,
        IEnumerable<FamilyRoleRemovedIndividual> FamilyRoleRemovedIndividuals,
        IEnumerable<Referral> Referrals,
        IEnumerable<Arrangement> Arrangements,
        IEnumerable<ArrangementType> ArrangementTypes,
        IEnumerable<ChildLocationRecord> ChildLocationRecords,
        IEnumerable<FamilyFunctionAssignment> FamilyFunctionAssignments,
        IEnumerable<IndividualFunctionAssignment> IndividualFunctionAssignments,
        IEnumerable<CommunityMemberFamily> CommunityMemberFamilies,
        IEnumerable<CommunityRoleAssignment> CommunityRoleAssignments
    );

    [Route("api/odata/live")]
    [OpenApiIgnore]
    [EnableQuery(MaxExpansionDepth = int.MaxValue, MaxAnyAllExpressionDepth = int.MaxValue)]
    [Authorize(Policies.ForbidAnonymous, AuthenticationSchemes = "Basic")]
    public class LiveODataModelController : ODataController
    {
        readonly IAppCache _Cache;

        readonly IPoliciesResource _PoliciesResource;
        readonly IRecordsManager _RecordsManager;

        public LiveODataModelController(
            IPoliciesResource policiesResource,
            IRecordsManager recordsManager,
            IAppCache cache
        )
        {
            _PoliciesResource = policiesResource;
            _RecordsManager = recordsManager;
            _Cache = cache;
        }

        [HttpGet("Location")]
        public async Task<IEnumerable<Location>> GetLocationsAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.Locations;
        }

        [HttpGet("Family")]
        public async Task<IEnumerable<Family>> GetFamiliesAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.Families;
        }

        [HttpGet("Person")]
        public async Task<IEnumerable<Person>> GetPeopleAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.People;
        }

        [HttpGet("Role")]
        public async Task<IEnumerable<Role>> GetRolesAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.Roles;
        }

        [HttpGet("FamilyRoleApprovals")]
        public async Task<IEnumerable<FamilyRoleApproval>> GetFamilyRoleApprovalsAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.FamilyRoleApprovals;
        }

        [HttpGet("IndividualRoleApprovals")]
        public async Task<IEnumerable<IndividualRoleApproval>> GetIndividualRoleApprovalsAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.IndividualRoleApprovals;
        }

        [HttpGet("FamilyRoleRemovedIndividuals")]
        public async Task<IEnumerable<FamilyRoleRemovedIndividual>> GetFamilyRoleRemovedIndividualsAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.FamilyRoleRemovedIndividuals;
        }

        [HttpGet("Referral")]
        public async Task<IEnumerable<Referral>> GetReferralsAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.Referrals;
        }

        [HttpGet("Arrangement")]
        public async Task<IEnumerable<Arrangement>> GetArrangementsAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.Arrangements;
        }

        [HttpGet("ArrangementType")]
        public async Task<IEnumerable<ArrangementType>> GetArrangementTypesAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.ArrangementTypes;
        }

        [HttpGet("ChildLocationRecords")]
        public async Task<IEnumerable<ChildLocationRecord>> GetChildLocationRecordsAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.ChildLocationRecords;
        }

        [HttpGet("FamilyFunctionAssignments")]
        public async Task<IEnumerable<FamilyFunctionAssignment>> GetFamilyFunctionAssignmentsAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.FamilyFunctionAssignments;
        }

        [HttpGet("IndividualFunctionAssignments")]
        public async Task<IEnumerable<IndividualFunctionAssignment>> GetIndividualFunctionAssignmentsAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.IndividualFunctionAssignments;
        }

        [HttpGet("Communities")]
        public async Task<IEnumerable<Community>> GetCommunitiesAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.Communities;
        }

        [HttpGet("CommunityMemberFamilies")]
        public async Task<IEnumerable<CommunityMemberFamily>> GetCommunityMemberFamiliesAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.CommunityMemberFamilies;
        }

        [HttpGet("CommunityRoleAssignments")]
        public async Task<IEnumerable<CommunityRoleAssignment>> GetCommunityRoleAssignmentsAsync()
        {
            LiveModel? liveModel = await RenderLiveModelAsync();
            return liveModel.CommunityRoleAssignments;
        }

        async Task<LiveModel> RenderLiveModelAsync()
        {
            //NOTE: For now, we only grant access to one organization at a time.
            //      In the future (e.g., for research purposes), data access could be broader.
            DataAccessScope? userDataAccessScope = GetUserDataAccessScope();
            Guid organizationId = userDataAccessScope.OrganizationId;
            bool anonymize = userDataAccessScope.Anonymize;

            LiveModel? result = await _Cache.GetOrAddAsync(
                $"LiveODataModelController-RenderLiveModelAsync-{organizationId}-{(anonymize ? "ANON" : "PII")}",
                async cacheEntry =>
                {
                    LiveModel? result = await RenderLiveModelInternalAsync(organizationId, anonymize);

                    cacheEntry.SlidingExpiration = TimeSpan.FromMinutes(1);
                    cacheEntry.AbsoluteExpiration = DateTimeOffset.Now.AddMinutes(5);

                    return result;
                }
            );

            return result!; // If this is actually null, then we are already throwing an exception anyways.
        }

        async Task<LiveModel> RenderLiveModelInternalAsync(Guid organizationId, bool anonymize)
        {
            OrganizationConfiguration? organizationConfiguration = await _PoliciesResource.GetConfigurationAsync(
                organizationId
            );

            (LocationConfiguration location, EffectiveLocationPolicy policy)[]? locationPolicies =
                await organizationConfiguration
                    .Locations.Select(async location =>
                        (location, policy: await _PoliciesResource.GetCurrentPolicy(organizationId, location.Id))
                    )
                    .WhenAll();

            Role[]? roles = locationPolicies
                .SelectMany(locationPolicy =>
                {
                    return locationPolicy
                        .policy.VolunteerPolicy.VolunteerRoles.Select(role => role.Value.VolunteerRoleType)
                        .Concat(
                            locationPolicy.policy.VolunteerPolicy.VolunteerFamilyRoles.Select(role =>
                                role.Value.VolunteerFamilyRoleType
                            )
                        )
                        .Select(roleName => new Role(roleName));
                })
                .Distinct()
                .ToArray();

            // Use a collection of random ZIP codes for anonymization.
            //TODO: Pick something a little more realistic and/or mapping-friendly? :)
            string[] anonymousLocationZipCodes = ["99785", "99778", "99762"];

            Location[]? locations = organizationConfiguration
                .Locations.Select(
                    (location, i) =>
                        new Location(location.Id, organizationId, anonymize ? $"Location {i}" : location.Name)
                )
                .ToArray();

            ((Location location, string anonymousZipCode), RecordsAggregate)[]? visibleAggregatesByLocation =
                await locations
                    .Select(
                        (location, i) => (location, anonymousZipCode: anonymize ? anonymousLocationZipCodes[i] : null)
                    )
                    .ZipSelectManyAsync(location =>
                        _RecordsManager.ListVisibleAggregatesAsync(
                            User,
                            location.location.OrganizationId,
                            location.location.Id
                        )
                    )
                    .ToArrayAsync();

            (Location location, FamilyRecordsAggregate)[]? familiesByLocation = visibleAggregatesByLocation
                .Where(zipResult => zipResult.Item2 is FamilyRecordsAggregate)
                .Select(zipResult => (zipResult.Item1, (FamilyRecordsAggregate)zipResult.Item2))
                .Select(zipResult =>
                    (
                        zipResult.Item1.location,
                        anonymize
                            ? AnonymizeFamilyRecords(zipResult.Item2, zipResult.Item1.anonymousZipCode!)
                            : zipResult.Item2
                    )
                )
                .ToArray();

            (Location location, CommunityRecordsAggregate)[]? communitiesByLocation = visibleAggregatesByLocation
                .Where(zipResult => zipResult.Item2 is CommunityRecordsAggregate)
                .Select(zipResult => (zipResult.Item1, (CommunityRecordsAggregate)zipResult.Item2))
                .Select(zipResult =>
                    (
                        zipResult.Item1.location,
                        anonymize
                            ? AnonymizeCommunityRecords(zipResult.Item2, zipResult.Item1.anonymousZipCode!)
                            : zipResult.Item2
                    )
                )
                .ToArray();

            (CombinedFamilyInfo, Family)[]? familiesWithInfo = familiesByLocation
                .Select(x => RenderFamily(x.Item1, x.Item2.Family))
                .ToArray();
            Family[]? families = familiesWithInfo.Select(family => family.Item2).ToArray();

            Person[]? people = familiesWithInfo.SelectMany(x => RenderPeople(x.Item1, x.Item2)).ToArray();

            (CommunityInfo, Community)[]? communitiesWithInfo = communitiesByLocation
                .Select(x => RenderCommunity(x.location, x.Item2.Community))
                .ToArray();
            Community[]? communities = communitiesWithInfo.Select(community => community.Item2).ToArray();

            FamilyRoleApproval[]? familyRoleApprovals = familiesWithInfo
                .SelectMany(x => RenderFamilyRoleApprovals(x.Item1, x.Item2, roles))
                .ToArray();
            IndividualRoleApproval[]? individualRoleApprovals = familiesWithInfo
                .SelectMany(x => RenderIndividualRoleApprovals(x.Item1, x.Item2, people, roles))
                .ToArray();
            FamilyRoleRemovedIndividual[]? familyRoleRemovedIndividuals = familiesWithInfo
                .SelectMany(x => RenderFamilyRoleRemovedIndividuals(x.Item1, x.Item2, people, roles))
                .ToArray();

            Referral[]? referrals = familiesWithInfo.SelectMany(x => RenderReferrals(x.Item1, x.Item2)).ToArray();

            ArrangementType[]? arrangementTypes = locationPolicies
                .SelectMany(locationPolicy =>
                    locationPolicy.policy.ReferralPolicy.ArrangementPolicies.Select(
                        arrangementPolicy => new ArrangementType(
                            arrangementPolicy.ArrangementType,
                            arrangementPolicy.ChildInvolvement
                        )
                    )
                )
                .DistinctBy(x => x.Type)
                .ToArray();

            Arrangement[]? arrangements = familiesWithInfo
                .SelectMany(x => RenderArrangements(x.Item1, x.Item2, people, referrals, arrangementTypes))
                .ToArray();

            ChildLocationRecord[]? childLocationRecords = familiesWithInfo
                .SelectMany(x => RenderChildLocationRecords(x.Item1, x.Item2, families, people, arrangements))
                .ToArray();

            FamilyFunctionAssignment[]? familyFunctionAssignments = familiesWithInfo
                .SelectMany(x => RenderFamilyFunctionAssignments(x.Item1, x.Item2, families, people, arrangements))
                .ToArray();

            IndividualFunctionAssignment[]? individualFunctionAssignments = familiesWithInfo
                .SelectMany(x => RenderIndividualFunctionAssignments(x.Item1, x.Item2, families, people, arrangements))
                .ToArray();

            CommunityMemberFamily[]? communityMemberFamilies = communitiesWithInfo
                .SelectMany(x => RenderCommunityMemberFamilies(x.Item1, x.Item2, families))
                .ToArray();

            CommunityRoleAssignment[]? communityRoleAssignments = communitiesWithInfo
                .SelectMany(x => RenderCommunityRoleAssignments(x.Item1, x.Item2, people))
                .ToArray();

            return new LiveModel(
                locations,
                families,
                people,
                communities,
                roles,
                familyRoleApprovals,
                individualRoleApprovals,
                familyRoleRemovedIndividuals,
                referrals,
                arrangements,
                arrangementTypes,
                childLocationRecords,
                familyFunctionAssignments,
                individualFunctionAssignments,
                communityMemberFamilies,
                communityRoleAssignments
            );
        }

        DataAccessScope GetUserDataAccessScope()
        {
            Guid singleOrganizationId = Guid.Parse(
                User.Claims.Single(claim => claim.Type == Claims.OrganizationId).Value
            );

            bool isResearcher =
                User.Claims.SingleOrDefault(claim => claim.Type == Claims.Researcher)?.Value == true.ToString();

            return new DataAccessScope(singleOrganizationId, isResearcher);
        }

        FamilyRecordsAggregate AnonymizeFamilyRecords(FamilyRecordsAggregate data, string anonymousZipCode)
        {
            return data with
            {
                Family = data.Family with
                {
                    Family = data.Family.Family with
                    {
                        Adults = data
                            .Family.Family.Adults.Select(
                                (adult, i) =>
                                    (
                                        adult.Item1 with
                                        {
                                            Addresses = adult
                                                .Item1.Addresses.Select(address =>
                                                    address with
                                                    {
                                                        Line1 = null,
                                                        Line2 = null,
                                                        City = null,
                                                        County = null,
                                                        State = null,
                                                        PostalCode = anonymousZipCode,
                                                    }
                                                )
                                                .ToImmutableList(),
                                            Age = adult.Item1.Age switch
                                            {
                                                AgeInYears age => new AgeInYears(
                                                    age.Years,
                                                    new DateTime(age.AsOf.Year, 1, 1)
                                                ),
                                                ExactAge age => new ExactAge(new DateTime(age.DateOfBirth.Year, 1, 1)),
                                                _ => null,
                                            },
                                            Concerns = null,
                                            EmailAddresses = adult
                                                .Item1.EmailAddresses.Select(
                                                    (email, e) => email with { Address = $"anon_{e}@example.com" }
                                                )
                                                .ToImmutableList(),
                                            FirstName = $"ADULT_{i:00}",
                                            LastName = $"FAM_{data.Id.ToString()[..4]}",
                                            Notes = null,
                                            PhoneNumbers = adult
                                                .Item1.PhoneNumbers.Select(
                                                    (phone, p) => phone with { Number = $"555-555-{p:0000}" }
                                                )
                                                .ToImmutableList(),
                                        },
                                        adult.Item2
                                    )
                            )
                            .ToImmutableList(),
                        Children = data
                            .Family.Family.Children.Select(
                                (child, i) =>
                                    child with
                                    {
                                        Addresses = child
                                            .Addresses.Select(address =>
                                                address with
                                                {
                                                    Line1 = null,
                                                    Line2 = null,
                                                    City = null,
                                                    County = null,
                                                    State = null,
                                                    PostalCode = anonymousZipCode,
                                                }
                                            )
                                            .ToImmutableList(),
                                        Age = child.Age switch
                                        {
                                            AgeInYears age => new AgeInYears(
                                                age.Years,
                                                new DateTime(age.AsOf.Year, 1, 1)
                                            ),
                                            ExactAge age => new ExactAge(new DateTime(age.DateOfBirth.Year, 1, 1)),
                                            _ => null,
                                        },
                                        Concerns = null,
                                        EmailAddresses = child
                                            .EmailAddresses.Select(
                                                (email, e) => email with { Address = $"anon_{e}@example.com" }
                                            )
                                            .ToImmutableList(),
                                        FirstName = $"CHILD_{i:00}",
                                        LastName = $"FAM_{data.Id.ToString()[..4]}",
                                        Notes = null,
                                        PhoneNumbers = child
                                            .PhoneNumbers.Select(
                                                (phone, p) => phone with { Number = $"555-555-{p:0000}" }
                                            )
                                            .ToImmutableList(),
                                    }
                            )
                            .ToImmutableList(),
                        CompletedCustomFields = data
                            .Family.Family.CompletedCustomFields.Select(field =>
                                field with
                                {
                                    Value = field.Value switch
                                    {
                                        string s => $"anon_{s.Length}",
                                        _ => field.Value,
                                    },
                                }
                            )
                            .ToImmutableList(),
                        DeletedDocuments = [],
                        UploadedDocuments = [],
                        History = [],
                    },
                    Notes = [],
                    PartneringFamilyInfo =
                        data.Family.PartneringFamilyInfo == null
                            ? null
                            : data.Family.PartneringFamilyInfo with
                            {
                                ClosedReferrals = data
                                    .Family.PartneringFamilyInfo.ClosedReferrals.Select(referral =>
                                        referral with
                                        {
                                            Arrangements = referral
                                                .Arrangements.Select(arrangement =>
                                                    arrangement with
                                                    {
                                                        Comments = null,
                                                        ExemptedRequirements = arrangement
                                                            .ExemptedRequirements.Select(exempted =>
                                                                exempted with
                                                                {
                                                                    AdditionalComments = "",
                                                                }
                                                            )
                                                            .ToImmutableList(),
                                                    }
                                                )
                                                .ToImmutableList(),
                                            Comments = null,
                                            CompletedCustomFields = referral
                                                .CompletedCustomFields.Select(field =>
                                                    field with
                                                    {
                                                        Value = field.Value switch
                                                        {
                                                            string s => $"anon_{s.Length}",
                                                            _ => field.Value,
                                                        },
                                                    }
                                                )
                                                .ToImmutableList(),
                                            ExemptedRequirements = referral
                                                .ExemptedRequirements.Select(exempted =>
                                                    exempted with
                                                    {
                                                        AdditionalComments = "",
                                                    }
                                                )
                                                .ToImmutableList(),
                                        }
                                    )
                                    .ToImmutableList(),
                                History = [],
                                OpenReferral =
                                    data.Family.PartneringFamilyInfo.OpenReferral == null
                                        ? null
                                        : data.Family.PartneringFamilyInfo.OpenReferral with
                                        {
                                            Arrangements = data
                                                .Family.PartneringFamilyInfo.OpenReferral.Arrangements.Select(
                                                    arrangement =>
                                                        arrangement with
                                                        {
                                                            Comments = null,
                                                            ExemptedRequirements = arrangement
                                                                .ExemptedRequirements.Select(exempted =>
                                                                    exempted with
                                                                    {
                                                                        AdditionalComments = "",
                                                                    }
                                                                )
                                                                .ToImmutableList(),
                                                        }
                                                )
                                                .ToImmutableList(),
                                            Comments = null,
                                            CompletedCustomFields = data
                                                .Family.PartneringFamilyInfo.OpenReferral.CompletedCustomFields.Select(
                                                    field =>
                                                        field with
                                                        {
                                                            Value = field.Value switch
                                                            {
                                                                string s => $"anon_{s.Length}",
                                                                _ => field.Value,
                                                            },
                                                        }
                                                )
                                                .ToImmutableList(),
                                            ExemptedRequirements = data
                                                .Family.PartneringFamilyInfo.OpenReferral.ExemptedRequirements.Select(
                                                    exempted => exempted with { AdditionalComments = "" }
                                                )
                                                .ToImmutableList(),
                                        },
                            },
                    UploadedDocuments = [],
                    Users = data.Family.Users.Select(user => user with { UserId = null }).ToImmutableList(),
                    VolunteerFamilyInfo =
                        data.Family.VolunteerFamilyInfo == null
                            ? null
                            : data.Family.VolunteerFamilyInfo with
                            {
                                ExemptedRequirements = data
                                    .Family.VolunteerFamilyInfo.ExemptedRequirements.Select(exempted =>
                                        exempted with
                                        {
                                            AdditionalComments = "",
                                        }
                                    )
                                    .ToImmutableList(),
                                History = [],
                                IndividualVolunteers = data
                                    .Family.VolunteerFamilyInfo.IndividualVolunteers.ToImmutableDictionary(
                                        kvp => kvp.Key,
                                        kvp =>
                                            kvp.Value with
                                            {
                                                ExemptedRequirements = kvp
                                                    .Value.ExemptedRequirements.Select(exempted =>
                                                        exempted with
                                                        {
                                                            AdditionalComments = "",
                                                        }
                                                    )
                                                    .ToImmutableList(),
                                                RoleRemovals = kvp
                                                    .Value.RoleRemovals.Select(removal =>
                                                        removal with
                                                        {
                                                            AdditionalComments = "",
                                                        }
                                                    )
                                                    .ToImmutableList(),
                                            }
                                    )
                                    .ToImmutableDictionary(),
                                RoleRemovals = data
                                    .Family.VolunteerFamilyInfo.RoleRemovals.Select(removal =>
                                        removal with
                                        {
                                            AdditionalComments = "",
                                        }
                                    )
                                    .ToImmutableList(),
                            },
                },
            };
        }

        CommunityRecordsAggregate AnonymizeCommunityRecords(CommunityRecordsAggregate data, string anonymousZipCode)
        {
            return data with
            {
                Community = data.Community with
                {
                    Community = data.Community.Community with
                    {
                        Name = $"Community_{data.Community.Community.Id.ToString()[..4]}",
                        Description = "",
                        UploadedDocuments = [],
                    },
                },
            };
        }

        static (CombinedFamilyInfo, Family) RenderFamily(Location location, CombinedFamilyInfo family)
        {
            Resources.Directory.Person? primaryContactPerson = family
                .Family.Adults.Select(adult => adult.Item1)
                .SingleOrDefault(person => person.Id == family.Family.PrimaryFamilyContactPersonId);

            T? GetFromPrimaryContactIfAvailable<T>(Func<Resources.Directory.Person, T?> selector)
                where T : class
            {
                T? bestResult = primaryContactPerson != null ? selector(primaryContactPerson) : null;
                bestResult ??= family
                    .Family.Adults.Select(adult => selector(adult.Item1))
                    .Where(result => result != null)
                    .FirstOrDefault();
                return bestResult;
            }

            string? familyName =
                primaryContactPerson == null
                    ? "⚠ MISSING PRIMARY CONTACT Family"
                    : $"{primaryContactPerson.FirstName} {primaryContactPerson.LastName} Family";

            string? bestEmail = GetFromPrimaryContactIfAvailable(person =>
                person
                    .EmailAddresses.SingleOrDefault(x => x.Id == primaryContactPerson!.PreferredEmailAddressId)
                    ?.Address
            );

            Address? bestAddress = GetFromPrimaryContactIfAvailable(person =>
            {
                Resources.Directory.Address? primaryAddressInfo = person.Addresses.SingleOrDefault(x =>
                    x.Id == person.CurrentAddressId
                );
                Address? primaryAddress =
                    primaryAddressInfo == null
                        ? null
                        : new Address(
                            primaryAddressInfo.Line1,
                            primaryAddressInfo.Line2,
                            primaryAddressInfo.City,
                            primaryAddressInfo.County,
                            primaryAddressInfo.State,
                            primaryAddressInfo.PostalCode
                        );
                return primaryAddress;
            });

            string? bestPhoneNumber = GetFromPrimaryContactIfAvailable(person =>
                person.PhoneNumbers.SingleOrDefault(x => x.Id == primaryContactPerson!.PreferredPhoneNumberId)?.Number
            );

            // Making this 'custom field' semi-standard across organizations/policies.
            string? homeChurch =
                family
                    .Family.CompletedCustomFields.SingleOrDefault(field => field.CustomFieldName == "Home Church")
                    ?.Value as string;

            return (
                family,
                new Family(
                    family.Family.Id,
                    location,
                    location.Id,
                    familyName,
                    bestEmail,
                    bestPhoneNumber,
                    bestAddress,
                    homeChurch
                )
            );
        }

        static IEnumerable<Person> RenderPeople(CombinedFamilyInfo familyInfo, Family family)
        {
            return familyInfo.Family.Adults
                .Select(adult => new Person(adult.Item1.Id, family, family.Id,
                    adult.Item1.FirstName, adult.Item1.LastName, PersonType.Adult,
                    adult.Item1.Ethnicity,
                    adult.Item1.Age is ExactAge ? DateOnly.FromDateTime((adult.Item1.Age as ExactAge)!.DateOfBirth) : null))
                .Concat(familyInfo.Family.Children
                    .Select(child => new Person(child.Id, family, family.Id,
                        child.FirstName, child.LastName, PersonType.Child,
                        child.Ethnicity,
                        child.Age is ExactAge ? DateOnly.FromDateTime((child.Age as ExactAge)!.DateOfBirth) : null
                    ))
                );
        }

        static (CommunityInfo, Community) RenderCommunity(Location location, CommunityInfo community)
        {
            return (community, new Community(community.Community.Id, location, location.Id, community.Community.Name));
        }

        static IEnumerable<FamilyRoleApproval> RenderFamilyRoleApprovals(
            CombinedFamilyInfo familyInfo,
            Family family,
            Role[] roles
        )
        {
            return familyInfo.VolunteerFamilyInfo?.FamilyRoleApprovals.SelectMany(fra =>
                    fra.Value.EffectiveRoleApprovalStatus?.Ranges.Select(range => new FamilyRoleApproval(
                        family,
                        family.Id,
                        roles.Single(role => role.Name == fra.Key),
                        fra.Key,
                        range.Start,
                        range.End,
                        range.Tag
                    )) ?? []
                ) ?? [];
        }

        static IEnumerable<IndividualRoleApproval> RenderIndividualRoleApprovals(
            CombinedFamilyInfo familyInfo,
            Family family,
            Person[] people,
            Role[] roles
        )
        {
            return familyInfo.VolunteerFamilyInfo?.IndividualVolunteers.SelectMany(individual =>
                    individual.Value.ApprovalStatusByRole.SelectMany(ira =>
                        ira.Value.EffectiveRoleApprovalStatus?.Ranges.Select(range => new IndividualRoleApproval(
                            people.Single(person => person.Id == individual.Key),
                            individual.Key,
                            roles.Single(role => role.Name == ira.Key),
                            ira.Key,
                            family,
                            family.Id,
                            range.Start,
                            range.End,
                            range.Tag
                        )) ?? []
                    ) ?? []
                ) ?? [];
        }

        static IEnumerable<FamilyRoleRemovedIndividual> RenderFamilyRoleRemovedIndividuals(
            CombinedFamilyInfo familyInfo,
            Family family,
            Person[] people,
            Role[] roles
        )
        {
            return familyInfo.VolunteerFamilyInfo?.IndividualVolunteers.SelectMany(individual =>
                    individual
                        .Value.RoleRemovals.Where(removal =>
                            familyInfo.VolunteerFamilyInfo.FamilyRoleApprovals.Keys.Contains(removal.RoleName)
                        )
                        .Select(removal => new FamilyRoleRemovedIndividual(
                            people.Single(person => person.Id == individual.Key),
                            individual.Key,
                            roles.Single(role => role.Name == removal.RoleName),
                            removal.RoleName,
                            family,
                            family.Id,
                            removal.EffectiveSince,
                            removal.EffectiveUntil ?? DateOnly.MaxValue
                        ))
                ) ?? [];
        }

        static IEnumerable<Referral> RenderReferrals(CombinedFamilyInfo familyInfo, Family family)
        {
            ImmutableList<Managers.Referral>? allReferralsInfo = (
                familyInfo.PartneringFamilyInfo?.ClosedReferrals ?? []
            ).AddRange(
                familyInfo.PartneringFamilyInfo?.OpenReferral == null
                    ? []
                    : new[] { familyInfo.PartneringFamilyInfo.OpenReferral }
            );
            return allReferralsInfo.Select(referralInfo => new Referral(
                referralInfo.Id,
                family,
                family.Id,
                DateOnly.FromDateTime(referralInfo.OpenedAtUtc),
                referralInfo.ClosedAtUtc.HasValue ? DateOnly.FromDateTime(referralInfo.ClosedAtUtc.Value) : null,
                // Making this 'custom field' semi-standard across organizations/policies.
                referralInfo
                    .CompletedCustomFields.SingleOrDefault(field => field.CustomFieldName == "Referral Source")
                    ?.Value as string,
                referralInfo.CloseReason,
                referralInfo
                    .CompletedCustomFields.SingleOrDefault(field =>
                        field.CustomFieldName == "Primary Reason for Referral"
                    )
                    ?.Value as string
            ));
        }

        static IEnumerable<Arrangement> RenderArrangements(
            CombinedFamilyInfo familyInfo,
            Family family,
            Person[] people,
            Referral[] referrals,
            ArrangementType[] arrangementTypes
        )
        {
            ImmutableList<Managers.Referral>? allReferralsInfo = (
                familyInfo.PartneringFamilyInfo?.ClosedReferrals ?? []
            ).AddRange(
                familyInfo.PartneringFamilyInfo?.OpenReferral == null
                    ? []
                    : new[] { familyInfo.PartneringFamilyInfo.OpenReferral }
            );
            return allReferralsInfo.SelectMany(referralInfo =>
            {
                Referral? referral = referrals.Single(r => r.Id == referralInfo.Id);
                return referralInfo.Arrangements.Select(arrangement =>
                {
                    Person? arrangementPerson = people.Single(p => p.Id == arrangement.PartneringFamilyPersonId);
                    return new Arrangement(
                        arrangement.Id,
                        arrangementTypes.Single(type => type.Type == arrangement.ArrangementType),
                        arrangement.ArrangementType,
                        referral,
                        referral.Id,
                        arrangementPerson,
                        arrangement.PartneringFamilyPersonId,
                        DateOnly.FromDateTime(arrangement.RequestedAtUtc),
                        arrangement.StartedAtUtc,
                        arrangement.EndedAtUtc,
                        arrangement.Phase,
                        arrangement.Reason
                    );
                });
            });
        }

        static IEnumerable<ChildLocationRecord> RenderChildLocationRecords(
            CombinedFamilyInfo familyInfo,
            Family family,
            Family[] families,
            Person[] people,
            Arrangement[] arrangements
        )
        {
            ImmutableList<Managers.Referral>? allReferralsInfo = (
                familyInfo.PartneringFamilyInfo?.ClosedReferrals ?? []
            ).AddRange(
                familyInfo.PartneringFamilyInfo?.OpenReferral == null
                    ? []
                    : new[] { familyInfo.PartneringFamilyInfo.OpenReferral }
            );
            return allReferralsInfo.SelectMany(referralInfo =>
            {
                return referralInfo.Arrangements.SelectMany(arrangement =>
                {
                    Arrangement? arrangementRecord = arrangements.Single(arr => arr.Id == arrangement.Id);
                    Person? arrangementPerson = people.Single(p => p.Id == arrangement.PartneringFamilyPersonId);
                    return arrangement.ChildLocationHistory.Select(
                        (history, i) =>
                        {
                            Family? receivingFamily = families.Single(f => f.Id == history.ChildLocationFamilyId);
                            ChildLocationHistoryEntry? nextLocation =
                                arrangement.ChildLocationHistory.Count > i + 1
                                    ? arrangement.ChildLocationHistory[i + 1]
                                    : null;
                            DateTime locationEffectiveEndTimestamp =
                                nextLocation?.TimestampUtc ?? arrangement.EndedAtUtc ?? DateTime.UtcNow;
                            TimeSpan effectiveDuration = locationEffectiveEndTimestamp.Subtract(history.TimestampUtc);

                            return new ChildLocationRecord(
                                arrangementRecord,
                                arrangement.Id,
                                arrangementPerson,
                                arrangement.PartneringFamilyPersonId,
                                receivingFamily,
                                history.ChildLocationFamilyId,
                                history.TimestampUtc,
                                history.Plan,
                                nextLocation?.TimestampUtc ?? arrangement.EndedAtUtc?.Subtract(TimeSpan.FromSeconds(1)),
                                effectiveDuration
                            );
                        }
                    );
                });
            });
        }

        static IEnumerable<FamilyFunctionAssignment> RenderFamilyFunctionAssignments(
            CombinedFamilyInfo familyInfo,
            Family family,
            Family[] families,
            Person[] people,
            Arrangement[] arrangements
        )
        {
            ImmutableList<Managers.Referral>? allReferralsInfo = (
                familyInfo.PartneringFamilyInfo?.ClosedReferrals ?? []
            ).AddRange(
                familyInfo.PartneringFamilyInfo?.OpenReferral == null
                    ? []
                    : new[] { familyInfo.PartneringFamilyInfo.OpenReferral }
            );
            return allReferralsInfo.SelectMany(referralInfo =>
            {
                return referralInfo.Arrangements.SelectMany(arrangement =>
                {
                    Arrangement? arrangementRecord = arrangements.Single(arr => arr.Id == arrangement.Id);
                    return arrangement.FamilyVolunteerAssignments.Select(fva => new FamilyFunctionAssignment(
                        arrangementRecord,
                        arrangement.Id,
                        families.Single(f => f.Id == fva.FamilyId),
                        fva.FamilyId,
                        fva.ArrangementFunction
                    ));
                });
            });
        }

        static IEnumerable<IndividualFunctionAssignment> RenderIndividualFunctionAssignments(
            CombinedFamilyInfo familyInfo,
            Family family,
            Family[] families,
            Person[] people,
            Arrangement[] arrangements
        )
        {
            ImmutableList<Managers.Referral>? allReferralsInfo = (
                familyInfo.PartneringFamilyInfo?.ClosedReferrals ?? []
            ).AddRange(
                familyInfo.PartneringFamilyInfo?.OpenReferral == null
                    ? []
                    : new[] { familyInfo.PartneringFamilyInfo.OpenReferral }
            );
            return allReferralsInfo.SelectMany(referralInfo =>
            {
                return referralInfo.Arrangements.SelectMany(arrangement =>
                {
                    Arrangement? arrangementRecord = arrangements.Single(arr => arr.Id == arrangement.Id);
                    return arrangement.IndividualVolunteerAssignments.Select(fva => new IndividualFunctionAssignment(
                        arrangementRecord,
                        arrangement.Id,
                        people.Single(p => p.Id == fva.PersonId),
                        fva.PersonId,
                        fva.ArrangementFunction
                    ));
                });
            });
        }

        static IEnumerable<CommunityMemberFamily> RenderCommunityMemberFamilies(
            CommunityInfo communityInfo,
            Community community,
            Family[] families
        )
        {
            return communityInfo
                .Community.MemberFamilies.Where(familyId => families.Any(f => f.Id == familyId)) // Ignore deleted families
                .Select(familyId => new CommunityMemberFamily(
                    community,
                    community.Id,
                    families.Single(f => f.Id == familyId),
                    familyId
                ));
        }

        static IEnumerable<CommunityRoleAssignment> RenderCommunityRoleAssignments(
            CommunityInfo communityInfo,
            Community community,
            Person[] people
        )
        {
            return communityInfo
                .Community.CommunityRoleAssignments.Where(roleAssignment =>
                    people.Any(p => p.Id == roleAssignment.PersonId)
                ) // Ignore deleted people
                .Select(roleAssignment => new CommunityRoleAssignment(
                    community,
                    community.Id,
                    people.Single(p => p.Id == roleAssignment.PersonId),
                    roleAssignment.PersonId,
                    roleAssignment.CommunityRole
                ));
        }

        sealed record DataAccessScope(Guid OrganizationId, bool Anonymize);
    }
}
