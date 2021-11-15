using CareTogether.Engines;
using CareTogether.Resources;
using System;
using Nito.AsyncEx;
using System.Collections.Immutable;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public class CombinedFamilyInfoFormatter
    {
        private readonly IPolicyEvaluationEngine policyEvaluationEngine;
        private readonly IAuthorizationEngine authorizationEngine;
        private readonly IApprovalsResource approvalsResource;
        private readonly IReferralsResource referralsResource;
        private readonly IDirectoryResource directoryResource;
        private readonly INotesResource notesResource;


        public CombinedFamilyInfoFormatter(IPolicyEvaluationEngine policyEvaluationEngine, IAuthorizationEngine authorizationEngine,
            IApprovalsResource approvalsResource, IReferralsResource referralsResource, IDirectoryResource directoryResource,
            INotesResource notesResource)
        {
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.authorizationEngine = authorizationEngine;
            this.approvalsResource = approvalsResource;
            this.referralsResource = referralsResource;
            this.directoryResource = directoryResource;
            this.notesResource = notesResource;
        }


        public async Task<CombinedFamilyInfo> RenderCombinedFamilyInfoAsync(Guid organizationId, Guid locationId, Guid familyId,
            ClaimsPrincipal user)
        {
            var family = await directoryResource.FindFamilyAsync(organizationId, locationId, familyId);
            var disclosedFamily = await authorizationEngine.DiscloseFamilyAsync(user, family);

            var partneringFamilyInfo = await RenderPartneringFamilyInfoAsync(organizationId, locationId, family, user);

            var volunteerFamilyInfo = await RenderVolunteerFamilyInfoAsync(organizationId, locationId, family, user);

            var notes = await notesResource.ListFamilyNotesAsync(organizationId, locationId, familyId);
            var disclosedNotes = (await notes
                .Select(note => new Note(note.Id, note.AuthorId, TimestampUtc: note.Status == NoteStatus.Approved
                    ? note.ApprovedTimestampUtc!.Value
                    : note.LastEditTimestampUtc, note.Contents, note.Status))
                .Select(async note =>
                    (note, canDisclose: await authorizationEngine.DiscloseNoteAsync(user, familyId, note)))
                .WhenAll())
                .Where(result => result.canDisclose)
                .Select(result => result.note)
                .ToImmutableList();

            return new CombinedFamilyInfo(disclosedFamily, partneringFamilyInfo, volunteerFamilyInfo, disclosedNotes);
        }


        private async Task<PartneringFamilyInfo?> RenderPartneringFamilyInfoAsync(Guid organizationId, Guid locationId,
            Family family, ClaimsPrincipal user)
        {
            var referrals = (await referralsResource.ListReferralsAsync(organizationId, locationId))
                .Where(r => r.FamilyId == family.Id)
                .Select(r => ToReferral(r))
                .ToList();

            if (referrals.Count == 0)
                return null;

            var openReferral = referrals.SingleOrDefault(r => r.CloseReason == null);
            var closedReferrals = referrals.Where(r => r.CloseReason != null).ToImmutableList();

            //TODO: CalculatePartneringFamilyReferralStatusAsync -- needs to be defined on PolicyEvaluationEngine

            return new PartneringFamilyInfo(openReferral, closedReferrals);

            static Referral ToReferral(ReferralEntry entry) =>
                new(entry.Id, entry.CreatedUtc, entry.CloseReason,
                    entry.CompletedRequirements, entry.UploadedDocuments, ImmutableList<string>.Empty, //TODO: populate MissingRequirements
                    entry.Arrangements.Select(a => ToArrangement(a.Value)).ToImmutableList());

            static Arrangement ToArrangement(ArrangementEntry entry) =>
                new(entry.Id, entry.ArrangementType, entry.State,
                    entry.CompletedRequirements, entry.UploadedDocuments, ImmutableList<string>.Empty, //TODO: populate MissingRequirements
                    entry.IndividualVolunteerAssignments, entry.FamilyVolunteerAssignments,
                    entry.PartneringFamilyChildAssignments, entry.ChildrenLocationHistory);
        }

        private async Task<VolunteerFamilyInfo?> RenderVolunteerFamilyInfoAsync(Guid organizationId, Guid locationId,
            Family family, ClaimsPrincipal user)
        {
            var entry = await approvalsResource.TryGetVolunteerFamilyAsync(organizationId, locationId, family.Id);

            if (entry == null)
                return null;

            var completedIndividualRequirements = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.CompletedRequirements);
            var removedIndividualRoles = entry.IndividualEntries.ToImmutableDictionary(
                x => x.Key,
                x => x.Value.RemovedRoles);

            var volunteerFamilyApprovalStatus = await policyEvaluationEngine.CalculateVolunteerFamilyApprovalStatusAsync(
                organizationId, locationId, family, entry.CompletedRequirements, entry.RemovedRoles,
                completedIndividualRequirements, removedIndividualRoles);

            var volunteerFamilyInfo = new VolunteerFamilyInfo(
                entry.CompletedRequirements, entry.UploadedDocuments, entry.RemovedRoles,
                volunteerFamilyApprovalStatus.MissingFamilyRequirements,
                volunteerFamilyApprovalStatus.AvailableFamilyApplications,
                volunteerFamilyApprovalStatus.FamilyRoleApprovals,
                volunteerFamilyApprovalStatus.IndividualVolunteers.ToImmutableDictionary(
                    x => x.Key,
                    x =>
                    {
                        var hasEntry = entry.IndividualEntries.TryGetValue(x.Key, out var individualEntry);
                        var result = hasEntry
                            ? new VolunteerInfo(individualEntry!.CompletedRequirements, individualEntry!.RemovedRoles,
                                x.Value.MissingIndividualRequirements, x.Value.AvailableIndividualApplications, x.Value.IndividualRoleApprovals)
                            : new VolunteerInfo(ImmutableList<CompletedRequirementInfo>.Empty, ImmutableList<RemovedRole>.Empty,
                                x.Value.MissingIndividualRequirements, x.Value.AvailableIndividualApplications, x.Value.IndividualRoleApprovals);
                        return result;
                    }));

            var disclosedVolunteerFamilyInfo = await authorizationEngine.DiscloseVolunteerFamilyInfoAsync(user, volunteerFamilyInfo);
            return disclosedVolunteerFamilyInfo;
        }
    }
}
