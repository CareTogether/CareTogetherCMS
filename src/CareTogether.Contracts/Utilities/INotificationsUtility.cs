using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace CareTogether.Utilities
{
    /// <remarks>
    /// Per policy, v1 notifications must not include any potential PII to prevent unintended information leakage.
    /// </remarks>
    public static class Notifications
    {
        public record Notification();
        public record NoteApproved(Guid ArrangementId, Guid NoteId) : Notification;
        public record NoteRejected(Guid ArrangementId, Guid NoteId) : Notification;
    }


    public interface INotificationsUtility
    {
        void NotifyUser(Notifications.Notification notification);
    }
}
