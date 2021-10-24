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
        private readonly IPolicyEvaluationEngine policyEvaluationEngine;
        private readonly IDirectoryResource directoryResource;
        private readonly IReferralsResource referralsResource;


        public ReferralManager(IPolicyEvaluationEngine policyEvaluationEngine,
            IDirectoryResource directoryResource, IReferralsResource referralsResource)
        {
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.directoryResource = directoryResource;
            this.referralsResource = referralsResource;
        }


        public async Task<Referral> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ReferralCommand command)
        {
            command = command switch
            {
                CreateReferral c => c with { ReferralId = Guid.NewGuid(), PolicyVersion = "v1" },
                _ => command
            };

            var referralEntry = await referralsResource.GetReferralAsync(organizationId, locationId, command.ReferralId);
            
            var families = directoryResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var referral = ToReferral(referralEntry, families);

            var authorizationResult = await policyEvaluationEngine.AuthorizeReferralCommandAsync(
                organizationId, locationId, user, command, referral);
            
            referralEntry = await referralsResource.ExecuteReferralCommandAsync(organizationId, locationId, command, user.UserId());
                
            var disclosedReferral = await policyEvaluationEngine.DiscloseReferralAsync(user,
                ToReferral(referralEntry, families));
            return disclosedReferral;
        }

        public async Task<Referral> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            ClaimsPrincipal user, ArrangementCommand command)
        {
            command = command switch
            {
                CreateArrangement c => c with { ArrangementId = Guid.NewGuid(), PolicyVersion = "v1" },
                _ => command
            };

            var referralEntry = await referralsResource.GetReferralAsync(organizationId, locationId, command.ReferralId);
            
            var families = directoryResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var referral = ToReferral(referralEntry, families);

            var authorizationResult = await policyEvaluationEngine.AuthorizeArrangementCommandAsync(
                organizationId, locationId, user, command, referral);
            
            referralEntry = await referralsResource.ExecuteArrangementCommandAsync(organizationId, locationId, command, user.UserId());

            var disclosedReferral = await policyEvaluationEngine.DiscloseReferralAsync(user,
                ToReferral(referralEntry, families));
            return disclosedReferral;
        }

        public async Task<Referral> ExecuteArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
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

            var authorizationResult = await policyEvaluationEngine.AuthorizeArrangementNoteCommandAsync(
                organizationId, locationId, user, command, referral);
            
            referralEntry = await referralsResource.ExecuteArrangementNoteCommandAsync(organizationId, locationId, command, user.UserId());
                
            var disclosedReferral = await policyEvaluationEngine.DiscloseReferralAsync(user,
                ToReferral(referralEntry, families));
            return disclosedReferral;
        }

        public async Task<ImmutableList<Referral>> ListReferralsAsync(Guid organizationId, Guid locationId)
        {
            var families = directoryResource.ListFamiliesAsync(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var referrals = await referralsResource.ListReferralsAsync(organizationId, locationId);

            return referrals.Select(r => ToReferral(r, families)).ToImmutableList();
        }


        private Referral ToReferral(ReferralEntry entry,
            ImmutableDictionary<Guid, Family> families) =>
            new(entry.Id, entry.PolicyVersion, entry.CreatedUtc, entry.CloseReason,
                families[entry.PartneringFamilyId],
                entry.ReferralFormUploads, entry.ReferralActivitiesPerformed,
                entry.Arrangements.Select(a => ToArrangement(a.Value)).ToImmutableList());

        private Arrangement ToArrangement(ArrangementEntry entry) =>
            new(entry.Id, entry.PolicyVersion, entry.ArrangementType, entry.State,
                entry.ArrangementFormUploads, entry.ArrangementActivitiesPerformed, entry.VolunteerAssignments,
                entry.PartneringFamilyChildAssignments, entry.ChildrenLocationHistory,
                entry.Notes.Values.Select(note =>
                    new Note(note.Id, note.AuthorId, TimestampUtc: note.Status == NoteStatus.Approved
                        ? note.ApprovedTimestampUtc!.Value
                        : note.LastEditTimestampUtc, note.Contents, note.Status)).ToImmutableList());
    }
}
