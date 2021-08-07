using CareTogether.Engines;
using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed class ReferralManager : IReferralManager
    {
        private readonly IPolicyEvaluationEngine policyEvaluationEngine;
        private readonly ICommunitiesResource communitiesResource;
        private readonly IReferralsResource referralsResource;
        private readonly IContactsResource contactsResource;


        public ReferralManager(IPolicyEvaluationEngine policyEvaluationEngine,
            ICommunitiesResource communitiesResource, IReferralsResource referralsResource, IContactsResource contactsResource)
        {
            this.policyEvaluationEngine = policyEvaluationEngine;
            this.communitiesResource = communitiesResource;
            this.referralsResource = referralsResource;
            this.contactsResource = contactsResource;
        }


        public async Task<ManagerResult<Referral>> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, ReferralCommand command)
        {
            command = command switch
            {
                CreateReferral c => c with { ReferralId = Guid.NewGuid(), PolicyVersion = "v1" },
                _ => command
            };

            var getReferralResult = await referralsResource.GetReferralAsync(organizationId, locationId, command.ReferralId);
            if (getReferralResult.TryPickT0(out var referralEntry, out var notFound))
            {
                var families = communitiesResource.ListPartneringFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;
                var referral = ToReferral(referralEntry, families, contacts);

                var authorizationResult = await policyEvaluationEngine.AuthorizeReferralCommandAsync(
                    organizationId, locationId, user, command, referral);
                if (authorizationResult.TryPickT0(out var yes, out var authorizationError))
                {
                    var commandResult = await referralsResource.ExecuteReferralCommandAsync(organizationId, locationId, command, user.UserId);
                    if (commandResult.TryPickT0(out referralEntry, out var commandError))
                    {
                        var disclosedReferral = await policyEvaluationEngine.DiscloseReferralAsync(user,
                            ToReferral(referralEntry, families, contacts));
                        return disclosedReferral;
                    }
                    else
                        return ManagerResult.NotAllowed; //TODO: Include reason from 'commandError'?
                }
                else
                    return ManagerResult.NotAllowed; //TODO: Include reason from 'authorizationError'?
            }
            else
                return notFound;
        }

        public async Task<ManagerResult<Referral>> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, ArrangementCommand command)
        {
            command = command switch
            {
                CreateArrangement c => c with { ArrangementId = Guid.NewGuid(), PolicyVersion = "v1" },
                _ => command
            };

            var getReferralResult = await referralsResource.GetReferralAsync(organizationId, locationId, command.ReferralId);
            if (getReferralResult.TryPickT0(out var referralEntry, out var notFound))
            {
                var families = communitiesResource.ListPartneringFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;
                var referral = ToReferral(referralEntry, families, contacts);

                var authorizationResult = await policyEvaluationEngine.AuthorizeArrangementCommandAsync(
                    organizationId, locationId, user, command, referral);
                if (authorizationResult.TryPickT0(out var yes, out var authorizationError))
                {
                    var commandResult = await referralsResource.ExecuteArrangementCommandAsync(organizationId, locationId, command, user.UserId);
                    if (commandResult.TryPickT0(out referralEntry, out var commandError))
                    {
                        var disclosedReferral = await policyEvaluationEngine.DiscloseReferralAsync(user,
                            ToReferral(referralEntry, families, contacts));
                        return disclosedReferral;
                    }
                    else
                        return ManagerResult.NotAllowed; //TODO: Include reason from 'commandError'?
                }
                else
                    return ManagerResult.NotAllowed; //TODO: Include reason from 'authorizationError'?
            }
            else
                return notFound;
        }

        public async Task<ManagerResult<Referral>> ExecuteArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, ArrangementNoteCommand command)
        {
            command = command switch
            {
                CreateDraftArrangementNote c => c with { NoteId = Guid.NewGuid() },
                _ => command
            };
            
            var getReferralResult = await referralsResource.GetReferralAsync(organizationId, locationId, command.ReferralId);
            if (getReferralResult.TryPickT0(out var referralEntry, out var notFound))
            {
                var families = communitiesResource.ListPartneringFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;
                var referral = ToReferral(referralEntry, families, contacts);

                var authorizationResult = await policyEvaluationEngine.AuthorizeArrangementNoteCommandAsync(
                    organizationId, locationId, user, command, referral);
                if (authorizationResult.TryPickT0(out var yes, out var authorizationError))
                {
                    var commandResult = await referralsResource.ExecuteArrangementNoteCommandAsync(organizationId, locationId, command, user.UserId);
                    if (commandResult.TryPickT0(out referralEntry, out var commandError))
                    {
                        var disclosedReferral = await policyEvaluationEngine.DiscloseReferralAsync(user,
                            ToReferral(referralEntry, families, contacts));
                        return disclosedReferral;
                    }
                    else
                        return ManagerResult.NotAllowed; //TODO: Include reason from 'commandError'?
                }
                else
                    return ManagerResult.NotAllowed; //TODO: Include reason from 'authorizationError'?
            }
            else
                return notFound;
        }

        public async Task<ImmutableList<Referral>> ListReferralsAsync(Guid organizationId, Guid locationId)
        {
            var families = communitiesResource.ListPartneringFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
            var contacts = contactsResource.ListContactsAsync(organizationId, locationId).Result;
            var referrals = await referralsResource.ListReferralsAsync(organizationId, locationId);

            return referrals.Select(r => ToReferral(r, families, contacts)).ToImmutableList();
        }


        private Referral ToReferral(ReferralEntry entry,
            ImmutableDictionary<Guid, Family> families,
            ImmutableDictionary<Guid, ContactInfo> contacts) =>
            new(entry.Id, entry.PolicyVersion, entry.CreatedUtc, entry.CloseReason,
                families[entry.PartneringFamilyId],
                families[entry.PartneringFamilyId].Adults
                    .Select(a => contacts.TryGetValue(a.Item1.Id, out var c) ? c : null)
                    .Where(c => c != null)
                    .ToImmutableList(),
                entry.ReferralFormUploads, entry.ReferralActivitiesPerformed,
                entry.Arrangements.Select(a => ToArrangement(a.Value)).ToImmutableList());

        private Arrangement ToArrangement(ArrangementEntry entry) =>
            new(entry.Id, entry.PolicyVersion, entry.ArrangementType, entry.State,
                entry.ArrangementFormUploads, entry.ArrangementActivitiesPerformed, entry.VolunteerAssignments,
                entry.PartneringFamilyChildAssignments, entry.ChildrenLocationHistory,
                ImmutableList<Note>.Empty); //TODO: Look up note contents
    }
}
