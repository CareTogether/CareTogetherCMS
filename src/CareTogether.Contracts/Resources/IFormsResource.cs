using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public interface IFormsResource
    {
        //TODO: Where do we track *which forms belong to a referral*? That appears to require the referral ID being used as a lookup ID in the IFormsResource.

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
