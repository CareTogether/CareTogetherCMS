using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    //TODO: Notes are just a particular case of Forms, and notes can just be modeled as simple forms.
    //      Note approval logic would be handled in the ReferralManager.
    //      Note display logic is a client concern.
    public enum NoteStatus { Draft, Denied, Approved };
    public record Note(Guid Id, Guid AuthorId, NoteContents Contents, NoteStatus Status, DraftNoteDenialReason DenialReason);
    public record NoteContents(string Contents);
    public record DraftNoteDenialReason(string Reason);


    public interface IFormsResource
    {
        public Guid CreateDraftNote(Guid arrangementId, NoteContents contents)
        {
            throw new NotImplementedException();
        }

        public void ApproveDraftNote(Guid arrangementId, Guid noteId)
        {
            throw new NotImplementedException();
        }

        public void DenyDraftNote(Guid arrangementId, Guid noteId, DraftNoteDenialReason reason)
        {
            throw new NotImplementedException();
        }

        public void EditDraftNote(Guid arrangementId, Guid noteId, NoteContents contents)
        {
            throw new NotImplementedException();
        }

        public IEnumerable<Note> GetNotes(Guid arrangementId)
        {
            throw new NotImplementedException();
        }

        public Note GetNote(Guid arrangementId, Guid noteId)
        {
            throw new NotImplementedException();
        }
    }
}
