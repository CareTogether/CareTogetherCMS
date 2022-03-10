using CareTogether.Engines.Authorization;
using CareTogether.Resources;
using CareTogether.Resources.Referrals;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers.Referrals
{
    public sealed class ReferralsManager : IReferralsManager
    {
        private readonly IAuthorizationEngine authorizationEngine;
        private readonly IReferralsResource referralsResource;
        private readonly CombinedFamilyInfoFormatter combinedFamilyInfoFormatter;


        public ReferralsManager(IAuthorizationEngine authorizationEngine, IReferralsResource referralsResource,
            CombinedFamilyInfoFormatter combinedFamilyInfoFormatter)
        {
            this.authorizationEngine = authorizationEngine;
            this.referralsResource = referralsResource;
            this.combinedFamilyInfoFormatter = combinedFamilyInfoFormatter;
        }


        public async Task<CombinedFamilyInfo> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command)
        {
            command = command switch
            {
                CreateReferral c => c with { ReferralId = Guid.NewGuid() },
                CompleteReferralRequirement c => c with { CompletedRequirementId = Guid.NewGuid() },
                UpdateCustomReferralField c => c with { CompletedCustomFieldId = Guid.NewGuid() },
                _ => command
            };

            if (!await authorizationEngine.AuthorizeReferralCommandAsync(
                organizationId, locationId, user, command))
                throw new Exception("The user is not authorized to perform this command.");
            
            _ = await referralsResource.ExecuteReferralCommandAsync(organizationId, locationId, command, user.UserId());

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, command.FamilyId, user);
            return familyResult;
        }

        public async Task<CombinedFamilyInfo> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementCommand command)
        {
            command = command switch
            {
                CreateArrangement c => c with { ArrangementId = Guid.NewGuid() },
                CompleteArrangementRequirement c => c with { CompletedRequirementId = Guid.NewGuid() },
                _ => command
            };

            if (!await authorizationEngine.AuthorizeArrangementCommandAsync(
                organizationId, locationId, user, command))
                throw new Exception("The user is not authorized to perform this command.");
            
            _ = await referralsResource.ExecuteArrangementCommandAsync(organizationId, locationId, command, user.UserId());

            var familyResult = await combinedFamilyInfoFormatter.RenderCombinedFamilyInfoAsync(organizationId, locationId, command.FamilyId, user);
            return familyResult;
        }
    }
}
