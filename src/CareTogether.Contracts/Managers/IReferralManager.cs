using CareTogether.Resources;
using JsonPolymorph;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Managers
{
    public interface IReferralManager
    {
        Task<ImmutableList<Referral>> ListReferralsAsync(Guid organizationId, Guid locationId);

        Task<ManagerResult<Referral>> ExecuteReferralCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, ReferralCommand command);

        Task<ManagerResult<Referral>> ExecuteArrangementCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, ArrangementCommand command);

        Task<ManagerResult<Referral>> ExecuteArrangementNoteCommandAsync(Guid organizationId, Guid locationId,
            AuthorizedUser user, ArrangementNoteCommand command);
    }
}
