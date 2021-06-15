using JsonPolymorph;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public sealed class ReferralManager : IReferralManager
    {
        public Task<ResourceResult<Referral>> ExecuteArrangementCommand(Guid organizationId, Guid locationId, ArrangementCommand command)
        {
            throw new NotImplementedException();
        }

        public Task<ResourceResult<Referral>> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId, ReferralCommand command)
        {
            throw new NotImplementedException();
        }

        public Task<IImmutableList<Referral>> ListReferralsAsync(Guid organizationId, Guid locationId)
        {
            throw new NotImplementedException();
        }
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
