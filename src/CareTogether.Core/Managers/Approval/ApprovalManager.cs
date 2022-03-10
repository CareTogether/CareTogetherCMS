using CareTogether.Engines.Authorization;
using CareTogether.Resources;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers.Approval
{
    public sealed class ApprovalManager : IApprovalManager
    {
        private readonly IAuthorizationEngine authorizationEngine;
        private readonly IApprovalsResource approvalsResource;
        private readonly CombinedFamilyInfoFormatter combinedFamilyInfoFormatter;


        public ApprovalManager(IAuthorizationEngine authorizationEngine, IApprovalsResource approvalsResource,
            CombinedFamilyInfoFormatter combinedFamilyInfoFormatter)
        {
            this.authorizationEngine = authorizationEngine;
            this.approvalsResource = approvalsResource;
            this.combinedFamilyInfoFormatter = combinedFamilyInfoFormatter;
        }


        public async Task<CombinedFamilyInfo> ExecuteVolunteerFamilyCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerFamilyCommand command)
        {
            command = command switch
            {
                CompleteVolunteerFamilyRequirement c => c with { CompletedRequirementId = Guid.NewGuid() },
                _ => command
            };

            if (!await authorizationEngine.AuthorizeVolunteerFamilyCommandAsync(
                organizationId, locationId, user, command))
                throw new Exception("The user is not authorized to perform this command.");

            _ = await approvalsResource.ExecuteVolunteerFamilyCommandAsync(organizationId, locationId, command, user.UserId());

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, command.FamilyId, user);
            return familyResult;
        }

        public async Task<CombinedFamilyInfo> ExecuteVolunteerCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, VolunteerCommand command)
        {
            command = command switch
            {
                CompleteVolunteerRequirement c => c with { CompletedRequirementId = Guid.NewGuid() },
                _ => command
            };

            if (!await authorizationEngine.AuthorizeVolunteerCommandAsync(
                organizationId, locationId, user, command))
                throw new Exception("The user is not authorized to perform this command.");

            _ = await approvalsResource.ExecuteVolunteerCommandAsync(organizationId, locationId, command, user.UserId());

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, command.FamilyId, user);
            return familyResult;
        }
    }
}
