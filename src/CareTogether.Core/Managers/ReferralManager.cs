using CareTogether.Engines;
using CareTogether.Resources;
using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;
using JsonPolymorph;
using Nito.AsyncEx;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text;
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

            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).WriterLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                var getReferralResult = tenantModel.GetReferralEntry(command.ReferralId);
                if (getReferralResult.TryPickT0(out var referralEntry, out var notFound))
                {
                    var families = communitiesResource.ListPartneringFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                    var contacts = profilesResource.ListContactsAsync(organizationId, locationId).Result;
                    var referral = ToReferral(referralEntry, families, contacts);

                    var authorizationResult = await policyEvaluationEngine.AuthorizeReferralCommandAsync(
                        organizationId, locationId, user, command, referral);
                    if (authorizationResult.TryPickT0(out var yes, out var authorizationError))
                    {
                        var commandResult = tenantModel.ExecuteReferralCommand(command, user.UserId, DateTime.UtcNow);
                        if (commandResult.TryPickT0(out var success, out var commandError))
                        {
                            await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                            success.Value.OnCommit();
                            var disclosedReferral = await policyEvaluationEngine.DiscloseReferralAsync(user,
                                ToReferral(success.Value.ReferralEntry, families, contacts));
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
        }

        public async Task<ManagerResult<Referral>> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, ArrangementCommand command)
        {
            command = command switch
            {
                CreateArrangement c => c with { ArrangementId = Guid.NewGuid(), PolicyVersion = "v1" },
                _ => command
            };

            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).WriterLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                var getReferralResult = tenantModel.GetReferralEntry(command.ReferralId);
                if (getReferralResult.TryPickT0(out var referralEntry, out var notFound))
                {
                    var families = communitiesResource.ListPartneringFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                    var contacts = profilesResource.ListContactsAsync(organizationId, locationId).Result;
                    var referral = ToReferral(referralEntry, families, contacts);

                    var authorizationResult = await policyEvaluationEngine.AuthorizeArrangementCommandAsync(
                        organizationId, locationId, user, command, referral);
                    if (authorizationResult.TryPickT0(out var yes, out var authorizationError))
                    {
                        var commandResult = tenantModel.ExecuteArrangementCommand(command, user.UserId, DateTime.UtcNow);
                        if (commandResult.TryPickT0(out var success, out var commandError))
                        {
                            await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                            success.Value.OnCommit();
                            var disclosedReferral = await policyEvaluationEngine.DiscloseReferralAsync(user,
                                ToReferral(success.Value.ReferralEntry, families, contacts));
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
        }

        public async Task<ManagerResult<Referral>> ExecuteArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, ArrangementNoteCommand command)
        {
            command = command switch
            {
                CreateDraftArrangementNote c => c with { NoteId = Guid.NewGuid() },
                _ => command
            };

            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).WriterLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                var getReferralResult = tenantModel.GetReferralEntry(command.ReferralId);
                if (getReferralResult.TryPickT0(out var referralEntry, out var notFound))
                {
                    var families = communitiesResource.ListPartneringFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                    var contacts = profilesResource.ListContactsAsync(organizationId, locationId).Result;
                    var referral = ToReferral(referralEntry, families, contacts);

                    var authorizationResult = await policyEvaluationEngine.AuthorizeArrangementNoteCommandAsync(
                        organizationId, locationId, user, command, referral);
                    if (authorizationResult.TryPickT0(out var yes, out var authorizationError))
                    {
                        var commandResult = tenantModel.ExecuteArrangementNoteCommand(command, user.UserId, DateTime.UtcNow);
                        if (commandResult.TryPickT0(out var success, out var commandError))
                        {
                            await eventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                            success.Value.OnCommit();
                            var disclosedReferral = await policyEvaluationEngine.DiscloseReferralAsync(user,
                                ToReferral(success.Value.ReferralEntry, families, contacts));
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
        }

        public async Task<ImmutableList<Referral>> ListReferralsAsync(Guid organizationId, Guid locationId)
        {
            using (await tenantLocks.GetOrAdd((organizationId, locationId), new AsyncReaderWriterLock()).ReaderLockAsync())
            {
                var tenantModel = await GetTenantModelAsync(organizationId, locationId);

                var families = communitiesResource.ListPartneringFamilies(organizationId, locationId).Result.ToImmutableDictionary(x => x.Id);
                var contacts = profilesResource.ListContactsAsync(organizationId, locationId).Result;

                var referrals = tenantModel.FindReferralEntries(_ => true);
                return referrals.Select(r => ToReferral(r, families, contacts)).ToImmutableList();
            }
        }


        private async Task<ReferralModel> GetTenantModelAsync(Guid organizationId, Guid locationId)
        {
            var lazyModel = tenantModels.GetOrAdd((organizationId, locationId), (_) => new AsyncLazy<ReferralModel>(() =>
                ReferralModel.InitializeAsync(eventLog.GetAllEventsAsync(organizationId, locationId))));
            return await lazyModel.Task;
        }


        private Referral ToReferral(ReferralEntry entry,
            ImmutableDictionary<Guid, Family> families,
            ImmutableDictionary<Guid, ContactInfo> contacts) =>
            new(entry.Id, entry.PolicyVersion, entry.TimestampUtc, entry.CloseReason,
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

    //[JsonHierarchyBase]
    //public abstract partial record ReferralEvent(Guid ReferralId, Guid UserId);
    //// JSON form: person info, contact info, basic referral notes
    //public sealed record RequestForHelpReceived(Guid ReferralId, Guid UserId)
    //    : ReferralEvent(ReferralId, UserId);
    //// Blob form (Cognito -> PDF), family info (manual entry for now), additional contact info (if applicable)
    //public sealed record IntakeFormReceived(Guid ReferralId, Guid UserId)
    //    : ReferralEvent(ReferralId, UserId);
    //public sealed record ReferralClosed(Guid ReferralId, Guid UserId,
    //    ReferralCloseReason CloseReason) : ReferralEvent(ReferralId, UserId);
    //public sealed record ArrangementCreated(Guid ReferralId, Guid ArrangementId, Guid UserId)
    //    : ReferralEvent(ReferralId, UserId);
    //// Blob form (always)
    //// Need the ability to update family info ongoing, separate from referral lifecycle
    ////TODO: That also means community relationship deletion should perhaps be replaced with inactivation, with reasons given?
    //public sealed record ArrangementSetupFormReceived(Guid ReferralId, Guid ArrangementId, Guid UserId)
    //    : ReferralEvent(ReferralId, UserId);
    //public sealed record ArrangementOpened(Guid ReferralId, Guid ArrangementId, Guid UserId)
    //    : ReferralEvent(ReferralId, UserId);
    //public sealed record ArrangementMonitoringActivityPerformed(Guid ReferralId, Guid ArrangementId, Guid UserId)
    //    : ReferralEvent(ReferralId, UserId);
    //public sealed record ArrangementNoteCreated(Guid ReferralId, Guid ArrangementId, Guid UserId)
    //    : ReferralEvent(ReferralId, UserId);
    //public sealed record ArrangementDischargeFormReceived(Guid ReferralId, Guid ArrangementId, Guid UserId)
    //    : ReferralEvent(ReferralId, UserId);
    //public sealed record ArrangementClosed(Guid ReferralId, Guid ArrangementId, Guid UserId)
    //    : ReferralEvent(ReferralId, UserId);


    //public sealed class Referral
    //{


    //    public static Referral SubmitRequestForHelp(RequestForHelp request)
    //    {

    //    }
    //}


    // Validate ->
    // Authorize (PolicyEvaluationEngine?) ->
    // Execute (returning new state & optionally events) ->
    // (optionally) Raise Domain Events ->
    // Apply Permissions Filters (PolicyEvaluationEngine) ->
    // Return New State


    //#region Arrangement Notes

    //internal IEnumerable<Note> GetArrangementNotes(Guid arrangementId)
    //{
    //    var workflow = workflowsResourceAccess.GetWorkflowState(arrangementId);
    //    workflow.ValidateUserAccess();
    //    return notesResourceAccess.GetNotes(arrangementId);
    //}

    //internal Guid RecordArrangementNote(Guid arrangementId, NoteContents contents)
    //{
    //    var workflow = workflowsResourceAccess.GetWorkflowState(arrangementId);
    //    workflow.ValidateUserAccess();
    //    workflow.ValidateAction();
    //    var noteId = notesResourceAccess.CreateDraftNote(arrangementId, contents);
    //    return noteId;
    //}

    //internal void EditArrangementNote(Guid arrangementId, Guid noteId, NoteContents updatedContents)
    //{
    //    var workflow = workflowsResourceAccess.GetWorkflowState(arrangementId);
    //    workflow.ValidateUserAccess();
    //    var note = notesResourceAccess.GetNote(arrangementId, noteId);
    //    workflow.ValidateAction(note);
    //    notesResourceAccess.EditDraftNote(arrangementId, noteId, updatedContents);
    //}

    //internal void ApproveArrangementNote(Guid arrangementId, Guid noteId)
    //{
    //    var workflow = workflowsResourceAccess.GetWorkflowState(arrangementId);
    //    workflow.ValidateUserAccess();
    //    var note = notesResourceAccess.GetNote(arrangementId, noteId);
    //    workflow.ValidateAction(note);
    //    notesResourceAccess.ApproveDraftNote(arrangementId, noteId);
    //    notificationsUtility.NotifyUser(new Notifications.NoteApproved(arrangementId, noteId));
    //}

    //internal void RejectArrangementNote(Guid arrangementId, Guid noteId, DraftNoteDenialReason reason)
    //{
    //    var workflow = workflowsResourceAccess.GetWorkflowState(arrangementId);
    //    workflow.ValidateUserAccess();
    //    var note = notesResourceAccess.GetNote(arrangementId, noteId);
    //    workflow.ValidateAction(note);
    //    notesResourceAccess.DenyDraftNote(arrangementId, noteId, reason);
    //    notificationsUtility.NotifyUser(new Notifications.NoteRejected(arrangementId, noteId));
    //}

    //#endregion
}
