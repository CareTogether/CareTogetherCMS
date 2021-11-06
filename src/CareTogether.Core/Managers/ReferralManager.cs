using CareTogether.Engines;
using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed class ReferralManager : IReferralManager
    {
        private readonly IAuthorizationEngine authorizationEngine;
        private readonly IPolicyEvaluationEngine policyEvaluationEngine;
        private readonly IDirectoryResource directoryResource;
        private readonly IReferralsResource referralsResource;


        public ReferralManager(IPolicyEvaluationEngine policyEvaluationEngine, IAuthorizationEngine authorizationEngine,
            IDirectoryResource directoryResource, IReferralsResource referralsResource)
        {
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.authorizationEngine = authorizationEngine;
            this.directoryResource = directoryResource;
            this.referralsResource = referralsResource;
        }


        public async Task<CombinedFamilyInfo> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command)
        {
            command = command switch
            {
                CreateReferral c => c with { ReferralId = Guid.NewGuid() },
                _ => command
            };

            var referralEntry = await referralsResource.GetReferralAsync(organizationId, locationId, command.ReferralId);
            
            var families = directoryResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var referral = ToReferral(referralEntry, families);

            var authorizationResult = await authorizationEngine.AuthorizeReferralCommandAsync(
                organizationId, locationId, user, command);
            
            referralEntry = await referralsResource.ExecuteReferralCommandAsync(organizationId, locationId, command, user.UserId());
                
            var disclosedReferral = await authorizationEngine.DiscloseReferralAsync(user,
                ToReferral(referralEntry, families));
            return disclosedReferral;
        }

        public async Task<CombinedFamilyInfo> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementCommand command)
        {
            command = command switch
            {
                CreateArrangement c => c with { ArrangementId = Guid.NewGuid() },
                _ => command
            };

            var referralEntry = await referralsResource.GetReferralAsync(organizationId, locationId, command.ReferralId);
            
            var families = directoryResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var referral = ToReferral(referralEntry, families);

            var authorizationResult = await authorizationEngine.AuthorizeArrangementCommandAsync(
                organizationId, locationId, user, command);
            
            referralEntry = await referralsResource.ExecuteArrangementCommandAsync(organizationId, locationId, command, user.UserId());

            var disclosedReferral = await authorizationEngine.DiscloseReferralAsync(user,
                ToReferral(referralEntry, families));
            return disclosedReferral;
        }

        public async Task<CombinedFamilyInfo> ExecuteArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementNoteCommand command)
        {
            command = command switch
            {
                CreateDraftArrangementNote c => c with { NoteId = Guid.NewGuid() },
                _ => command
            };

            var referralEntry = await referralsResource.GetReferralAsync(organizationId, locationId, command.ReferralId);
            
            var families = directoryResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var referral = ToReferral(referralEntry, families);

            var authorizationResult = await authorizationEngine.AuthorizeArrangementNoteCommandAsync(
                organizationId, locationId, user, command);
            
            referralEntry = await referralsResource.ExecuteArrangementNoteCommandAsync(organizationId, locationId, command, user.UserId());
                
            var disclosedReferral = await authorizationEngine.DiscloseReferralAsync(user,
                ToReferral(referralEntry, families));
            return disclosedReferral;
        }

        public async Task<ImmutableList<CombinedFamilyInfo>> ListPartneringFamiliesAsync(Guid organizationId, Guid locationId)
        {
            var families = (await directoryResource.ListFamiliesAsync(organizationId, locationId)).ToImmutableDictionary(x => x.Id);
            var referrals = await referralsResource.ListReferralsAsync(organizationId, locationId);
            return families.Select(f =>
            {
                var openReferral = referrals.SingleOrDefault(r => r.FamilyId == f.Key && r.CloseReason == null);
                var closedReferrals = referrals.Where(r => r.FamilyId == f.Key && r.CloseReason != null)
                    .Select(r => ToReferral(r, families)).ToImmutableList();
                return new PartneringFamily(f.Value,
                    openReferral == null ? null : ToReferral(openReferral, families),
                    closedReferrals);
            }).ToImmutableList();
        }
    }
}
