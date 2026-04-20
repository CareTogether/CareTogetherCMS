using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;
using CareTogether.Engines.Authorization;
using CareTogether.Resources.Accounts;
using CareTogether.Resources.Approvals;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.FeatureManagement;
using Microsoft.Kiota.Abstractions;
using Nito.AsyncEx;

namespace CareTogether.Api.Controllers
{
    public sealed record CurrentFeatureFlags(
        bool InviteUser,
        bool FamilyScreenV2,
        bool FamilyScreenPageVersionSwitch
    );

    public sealed record PutLocationPayload(
        LocationConfiguration locationConfiguration,
        Guid? copyPoliciesFromLocationId
    );

    [ApiController]
    [Authorize(
        Policies.ForbidAnonymous,
        AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme
    )]
    public class ConfigurationController : ControllerBase
    {
        private readonly IPoliciesResource policiesResource;
        private readonly IDirectoryResource directoryResource;
        private readonly IAccountsResource accountsResource;
        private readonly IApprovalsResource approvalsResource;
        private readonly IFeatureManager featureManager;
        private readonly IAuthorizationEngine authorizationEngine;

        public ConfigurationController(
            IPoliciesResource policiesResource,
            IDirectoryResource directoryResource,
            IAccountsResource accountsResource,
            IApprovalsResource approvalsResource,
            IFeatureManager featureManager,
            IAuthorizationEngine authorizationEngine
        )
        {
            //TODO: Delegate this controller's methods to a manager service
            this.policiesResource = policiesResource;
            this.directoryResource = directoryResource;
            this.accountsResource = accountsResource;
            this.approvalsResource = approvalsResource;
            this.featureManager = featureManager;
            this.authorizationEngine = authorizationEngine;
        }

        [HttpGet("/api/{organizationId:guid}/[controller]")]
        public async Task<ActionResult<OrganizationConfiguration>> GetOrganizationConfiguration(
            Guid organizationId
        )
        {
            var result = await policiesResource.GetConfigurationAsync(organizationId);
            return Ok(result);
        }

        [HttpPut("/api/{organizationId:guid}/[controller]/roles/{roleName}")]
        public async Task<ActionResult<OrganizationConfiguration>> PutRoleDefinition(
            Guid organizationId,
            string roleName,
            [FromBody] RoleDefinition role
        )
        {
            if (!User.IsInRole(SystemConstants.ORGANIZATION_ADMINISTRATOR))
                return Forbid();
            var result = await policiesResource.UpsertRoleDefinitionAsync(
                organizationId,
                roleName,
                role
            );
            return Ok(result);
        }

        private async Task<Person> CopyOverPersonRelatedRecords(
            Guid organizationId,
            Guid newLocationId,
            Person person
        )
        {
            var newAddresses =
                person
                    .Addresses.Select(address =>
                        (
                            NewAddress: address with
                            {
                                Id = Guid.NewGuid(),
                            },
                            IsCurrent: address.Id == person.CurrentAddressId
                        )
                    )
                    .ToImmutableList() ?? ImmutableList<(Address, bool)>.Empty;

            var newEmailAddresses =
                person
                    .EmailAddresses.Select(emailAddress =>
                        (
                            NewEmailAddresses: emailAddress with
                            {
                                Id = Guid.NewGuid(),
                            },
                            IsPreferred: emailAddress.Id == person.PreferredEmailAddressId
                        )
                    )
                    .ToImmutableList() ?? ImmutableList<(EmailAddress, bool)>.Empty;

            var newPhoneNumbers =
                person
                    .PhoneNumbers.Select(phoneNumber =>
                        (
                            NewPhoneNumber: phoneNumber with
                            {
                                Id = Guid.NewGuid(),
                            },
                            IsPreferred: phoneNumber.Id == person.PreferredPhoneNumberId
                        )
                    )
                    .ToImmutableList() ?? ImmutableList<(PhoneNumber, bool)>.Empty;

            var currentAddressIdEntry = newAddresses.FirstOrDefault(a => a.IsCurrent);
            var preferredEmailAddressIdEntry = newEmailAddresses.FirstOrDefault(a => a.IsPreferred);
            var preferredPhoneNumberIdEntry = newPhoneNumbers.FirstOrDefault(a => a.IsPreferred);

            var newPerson = person with
            {
                Id = Guid.NewGuid(),
                Addresses = newAddresses.Select(a => a.NewAddress).ToImmutableList(),
                CurrentAddressId =
                    currentAddressIdEntry != default ? currentAddressIdEntry.NewAddress.Id : null,
                EmailAddresses = newEmailAddresses
                    .Select(a => a.NewEmailAddresses)
                    .ToImmutableList(),
                PreferredEmailAddressId =
                    preferredEmailAddressIdEntry != default
                        ? preferredEmailAddressIdEntry.NewEmailAddresses.Id
                        : null,
                PhoneNumbers = newPhoneNumbers.Select(a => a.NewPhoneNumber).ToImmutableList(),
                PreferredPhoneNumberId =
                    preferredEmailAddressIdEntry != default
                        ? preferredPhoneNumberIdEntry.NewPhoneNumber.Id
                        : null,
            };

            var createPersonResult = await directoryResource.ExecutePersonCommandAsync(
                organizationId,
                newLocationId,
                new CreatePerson(
                    newPerson.Id,
                    newPerson.FirstName,
                    newPerson.LastName,
                    newPerson.Gender,
                    newPerson.Age,
                    newPerson.Ethnicity,
                    newPerson.Addresses,
                    newPerson.CurrentAddressId,
                    newPerson.PhoneNumbers,
                    newPerson.PreferredPhoneNumberId,
                    newPerson.EmailAddresses,
                    newPerson.PreferredEmailAddressId,
                    newPerson.Concerns,
                    newPerson.Notes
                ),
                User.UserId()
            );

            foreach (var addressEntry in newAddresses)
            {
                await directoryResource.ExecutePersonCommandAsync(
                    organizationId,
                    newLocationId,
                    new AddPersonAddress(
                        newPerson.Id,
                        addressEntry.NewAddress,
                        addressEntry.IsCurrent
                    ),
                    User.UserId()
                );
            }

            foreach (var emailEntry in newEmailAddresses)
            {
                await directoryResource.ExecutePersonCommandAsync(
                    organizationId,
                    newLocationId,
                    new AddPersonEmailAddress(
                        newPerson.Id,
                        emailEntry.NewEmailAddresses,
                        emailEntry.IsPreferred
                    ),
                    User.UserId()
                );
            }

            foreach (var phoneEntry in newPhoneNumbers)
            {
                await directoryResource.ExecutePersonCommandAsync(
                    organizationId,
                    newLocationId,
                    new AddPersonPhoneNumber(
                        newPerson.Id,
                        phoneEntry.NewPhoneNumber,
                        phoneEntry.IsPreferred
                    ),
                    User.UserId()
                );
            }

            return createPersonResult;
        }

        private async Task<(Family, Guid)> CopyOverUserRecords(
            Guid organizationId,
            Guid newLocationId,
            Family referenceFamily,
            Guid referencePersonId
        )
        {
            var adults = await referenceFamily
                .Adults.Select(async adult =>
                {
                    var person = adult.Item1;

                    var createPersonResult = await CopyOverPersonRelatedRecords(
                        organizationId,
                        newLocationId,
                        person
                    );

                    return (createPersonResult, adult.Item2, oldPersonId: person.Id);
                })
                .WhenAll();

            var newReferencePersonId = adults
                .First(adult => adult.oldPersonId == referencePersonId)
                .createPersonResult.Id;

            var children = await referenceFamily
                .Children.Select(async child =>
                {
                    var person = child;

                    var createPersonResult = await CopyOverPersonRelatedRecords(
                        organizationId,
                        newLocationId,
                        person
                    );

                    return (createPersonResult, oldPersonId: person.Id);
                })
                .WhenAll();

            var custodialRelationships = referenceFamily
                .CustodialRelationships.Select(relationship =>
                    (
                        relationship with
                        {
                            ChildId = children
                                .First(child => child.oldPersonId == relationship.ChildId)
                                .createPersonResult.Id,
                            PersonId = adults
                                .First(adult => adult.oldPersonId == relationship.PersonId)
                                .Item1.Id,
                        }
                    )
                )
                .ToImmutableList();

            var createFamilyResult = await directoryResource.ExecuteFamilyCommandAsync(
                organizationId,
                newLocationId,
                new CreateFamily(
                    Guid.NewGuid(),
                    adults
                        .First(adult =>
                            adult.oldPersonId == referenceFamily.PrimaryFamilyContactPersonId
                        )
                        .Item1.Id,
                    adults.Select(adult => (adult.Item1.Id, adult.Item2)).ToImmutableList(),
                    children.Select(child => child.createPersonResult.Id).ToImmutableList(),
                    custodialRelationships
                ),
                User.UserId()
            );

            return (createFamilyResult, newReferencePersonId);
        }

        [HttpPut("/api/{organizationId:guid}/[controller]")]
        public async Task<ActionResult<OrganizationConfiguration>> PutLocationDefinition(
            Guid organizationId,
            [FromBody] PutLocationPayload newLocationPayload
        )
        {
            var newLocationConfiguration = newLocationPayload.locationConfiguration;
            var copyPoliciesFromLocationId = newLocationPayload.copyPoliciesFromLocationId;

            if (!User.IsInRole(SystemConstants.ORGANIZATION_ADMINISTRATOR))
                return Forbid();

            if (newLocationConfiguration.Id != default)
            {
                var updatedLocation = await policiesResource.UpsertLocationDefinitionAsync(
                    organizationId,
                    newLocationConfiguration
                );

                return Ok(updatedLocation.OrganizationConfiguration);
            }

            if (copyPoliciesFromLocationId == Guid.Empty)
                return BadRequest(
                    "copyPoliciesFromLocationId is required for creating a new Location."
                );

            var referenceLocation = (
                await policiesResource.GetConfigurationAsync(organizationId)
            ).Locations.Find(location => location.Id == copyPoliciesFromLocationId);

            if (referenceLocation == null)
                return BadRequest("Could not find location to copy policies from.");

            var referenceLocationId = referenceLocation.Id ?? Guid.Empty;

            var personId = User.PersonId(organizationId, referenceLocationId);

            if (personId == null)
                return BadRequest("User does not have a person ID for the specified location.");

            var referenceFamily = await directoryResource.FindPersonFamilyAsync(
                organizationId,
                referenceLocationId,
                personId.Value
            );

            var referencePerson = referenceFamily
                ?.Adults.Find(adult => adult.Item1.Id == personId.Value)
                .Item1;

            if (referenceFamily == null || referencePerson == null)
                return BadRequest(
                    "Could not find records to copy from. Ensure the user has a family and person record in the specified location."
                );

            var result = await policiesResource.UpsertLocationDefinitionAsync(
                organizationId,
                referenceLocation with
                {
                    Id = Guid.Empty,
                    Name = newLocationConfiguration.Name,
                }
            );

            var referenceEffectivePolicy = await policiesResource.GetCurrentPolicy(
                organizationId,
                referenceLocationId
            );

            await policiesResource.UpsertEffectiveLocationPolicyAsync(
                organizationId,
                result.LocationConfiguration.Id ?? Guid.Empty,
                referenceEffectivePolicy
            );

            var (newFamily, newReferencePersonId) = await CopyOverUserRecords(
                organizationId,
                result.LocationConfiguration.Id ?? Guid.Empty,
                referenceFamily,
                referencePerson.Id
            );
            await approvalsResource.ExecuteVolunteerFamilyCommandAsync(
                organizationId,
                result.LocationConfiguration.Id ?? Guid.Empty,
                new ActivateVolunteerFamily(newFamily.Id),
                User.UserId()
            );

            await accountsResource.ExecutePersonAccessCommandAsync(
                organizationId,
                result.LocationConfiguration.Id ?? Guid.Empty,
                new ChangePersonRoles(
                    newReferencePersonId,
                    [SystemConstants.ORGANIZATION_ADMINISTRATOR]
                ),
                User.UserId()
            );

            await accountsResource.ExecuteAccountCommandAsync(
                new LinkPersonToAcccount(
                    User.UserId(),
                    organizationId,
                    result.LocationConfiguration.Id ?? Guid.Empty,
                    newReferencePersonId
                ),
                User.UserId()
            );

            return Ok(result.OrganizationConfiguration);
        }

        [HttpDelete("/api/{organizationId:guid}/[controller]/roles/{roleName}")]
        public async Task<ActionResult<OrganizationConfiguration>> DeleteRoleDefinition(
            Guid organizationId,
            string roleName
        )
        {
            if (!User.IsInRole(SystemConstants.ORGANIZATION_ADMINISTRATOR))
                return Forbid();
            var result = await policiesResource.DeleteRoleDefinitionAsync(organizationId, roleName);
            return Ok(result);
        }

        [HttpGet("/api/{organizationId:guid}/{locationId:guid}/[controller]/policy")]
        public async Task<ActionResult<EffectiveLocationPolicy>> GetEffectiveLocationPolicy(
            Guid organizationId,
            Guid locationId
        )
        {
            var result = await policiesResource.GetCurrentPolicy(organizationId, locationId);
            return Ok(result);
        }

        [HttpPut("/api/{organizationId:guid}/{locationId:guid}/[controller]/policy")]
public async Task<ActionResult<EffectiveLocationPolicy>> PutEffectiveLocationPolicy(
    Guid organizationId,
    Guid locationId,
    [FromBody] EffectiveLocationPolicy policy
)
{
    if (!User.IsInRole(SystemConstants.ORGANIZATION_ADMINISTRATOR))
        return Forbid();

    var result = await policiesResource.UpsertEffectiveLocationPolicyAsync(
        organizationId,
        locationId,
        policy
    );

    return Ok(result);
}

        [HttpGet("/api/{organizationId:guid}/{locationId:guid}/[controller]/flags")]
        public async Task<ActionResult<CurrentFeatureFlags>> GetLocationFlags(Guid organizationId)
        {
            var result = new CurrentFeatureFlags(
                InviteUser: await featureManager.IsEnabledAsync(nameof(FeatureFlags.InviteUser)),
                FamilyScreenV2: await featureManager.IsEnabledAsync(
                    nameof(FeatureFlags.FamilyScreenV2)
                ),
                FamilyScreenPageVersionSwitch: await featureManager.IsEnabledAsync(
                    nameof(FeatureFlags.FamilyScreenPageVersionSwitch)
                )
            );
            return Ok(result);
        }
    }
}
