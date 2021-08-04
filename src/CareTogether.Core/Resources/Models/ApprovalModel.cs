using JsonPolymorph;
using OneOf;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Models
{
    [JsonHierarchyBase]
    public abstract partial record ApprovalEvent(Guid UserId, DateTime TimestampUtc)
        : DomainEvent(UserId, TimestampUtc);
    public sealed record VolunteerFamilyCommandExecuted(Guid UserId, DateTime TimestampUtc,
        VolunteerFamilyCommand Command) : ApprovalEvent(UserId, TimestampUtc);
    public sealed record VolunteerCommandExecuted(Guid UserId, DateTime TimestampUtc,
        VolunteerCommand Command) : ApprovalEvent(UserId, TimestampUtc);

    public sealed class ApprovalModel
    {
        private ImmutableDictionary<Guid, VolunteerFamilyEntry> volunteerFamilies = ImmutableDictionary<Guid, VolunteerFamilyEntry>.Empty;


        public long LastKnownSequenceNumber { get; private set; } = -1;


        public static async Task<ApprovalModel> InitializeAsync(
            IAsyncEnumerable<(ApprovalEvent DomainEvent, long SequenceNumber)> eventLog)
        {
            var model = new ApprovalModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            return model;
        }


        public OneOf<Success<(VolunteerFamilyCommandExecuted Event, long SequenceNumber, VolunteerFamilyEntry VolunteerFamilyEntry, Action OnCommit)>, Error<string>>
            ExecuteVolunteerFamilyCommand(VolunteerFamilyCommand command, Guid userId, DateTime timestampUtc)
        {
            VolunteerFamilyEntry volunteerFamilyEntry;
            if (!volunteerFamilies.TryGetValue(command.FamilyId, out volunteerFamilyEntry))
                volunteerFamilyEntry = new VolunteerFamilyEntry(command.FamilyId, true, null,
                    ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty, ImmutableDictionary<Guid, VolunteerEntry>.Empty);

            OneOf<VolunteerFamilyEntry, Error<string>> result = command switch
            {
                //TODO: Enforce any business rules dynamically via the policy evaluation engine.
                //      This involves returning "allowed actions" with the rendered Approval state
                //      and failing any attempted actions that are not allowed.
                PerformVolunteerFamilyActivity c => volunteerFamilyEntry with
                {
                    ApprovalActivitiesPerformed = volunteerFamilyEntry.ApprovalActivitiesPerformed.Add(
                        new ActivityInfo(userId, timestampUtc, c.ActivityName))
                },
                UploadVolunteerFamilyForm c => volunteerFamilyEntry with
                {
                    ApprovalFormUploads = volunteerFamilyEntry.ApprovalFormUploads.Add(
                        new FormUploadInfo(userId, timestampUtc, c.FormName, c.FormVersion, c.UploadedFileName))
                },
                DeactivateVolunteerFamily c => volunteerFamilyEntry with
                {
                    Active = false,
                },
                ReactivateVolunteerFamily c => volunteerFamilyEntry with
                {
                    Active = true,
                },
                SetVolunteerFamilyNote c => volunteerFamilyEntry with
                {
                    Note = c.Note
                },
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            };
            if (result.TryPickT0(out var volunteerFamilyEntryToUpsert, out var error))
            {
                return new Success<(VolunteerFamilyCommandExecuted Event, long SequenceNumber, VolunteerFamilyEntry VolunteerFamilyEntry, Action OnCommit)>((
                    Event: new VolunteerFamilyCommandExecuted(userId, timestampUtc, command),
                    SequenceNumber: LastKnownSequenceNumber + 1,
                    VolunteerFamilyEntry: volunteerFamilyEntryToUpsert,
                    OnCommit: () => volunteerFamilies = volunteerFamilies.SetItem(volunteerFamilyEntryToUpsert.FamilyId, volunteerFamilyEntryToUpsert)));
            }
            else
                return result.AsT1;
        }

        public OneOf<Success<(VolunteerCommandExecuted Event, long SequenceNumber, VolunteerFamilyEntry VolunteerFamilyEntry, Action OnCommit)>, Error<string>>
            ExecuteVolunteerCommand(VolunteerCommand command, Guid userId, DateTime timestampUtc)
        {
            VolunteerFamilyEntry volunteerFamilyEntry;
            if (!volunteerFamilies.TryGetValue(command.FamilyId, out volunteerFamilyEntry))
                volunteerFamilyEntry = new VolunteerFamilyEntry(command.FamilyId, true, null,
                    ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty, ImmutableDictionary<Guid, VolunteerEntry>.Empty);

            VolunteerEntry volunteerEntry;
            if (!volunteerFamilyEntry.IndividualEntries.TryGetValue(command.PersonId, out volunteerEntry))
                volunteerEntry = new VolunteerEntry(command.PersonId, true, null,
                    ImmutableList<FormUploadInfo>.Empty, ImmutableList<ActivityInfo>.Empty);

            OneOf<VolunteerEntry, Error<string>> result = command switch
            {
                //TODO: Enforce any business rules dynamically via the policy evaluation engine.
                //      This involves returning "allowed actions" with the rendered Approval state
                //      and failing any attempted actions that are not allowed.
                PerformVolunteerActivity c => volunteerEntry with
                {
                    ApprovalActivitiesPerformed = volunteerEntry.ApprovalActivitiesPerformed.Add(
                        new ActivityInfo(userId, timestampUtc, c.ActivityName))
                },
                UploadVolunteerForm c => volunteerEntry with
                {
                    ApprovalFormUploads = volunteerEntry.ApprovalFormUploads.Add(
                        new FormUploadInfo(userId, timestampUtc, c.FormName, c.FormVersion, c.UploadedFileName))
                },
                DeactivateVolunteer c => volunteerEntry with
                {
                    Active = false,
                },
                ReactivateVolunteer c => volunteerEntry with
                {
                    Active = true,
                },
                SetVolunteerNote c => volunteerEntry with
                {
                    Note = c.Note
                },
                _ => throw new NotImplementedException(
                    $"The command type '{command.GetType().FullName}' has not been implemented.")
            };

            if (result.TryPickT0(out var volunteerEntryToUpsert, out var error))
            {
                var volunteerFamilyEntryToUpsert = volunteerFamilyEntry with
                {
                    IndividualEntries = volunteerFamilyEntry.IndividualEntries.SetItem(command.PersonId, volunteerEntryToUpsert)
                };
                return new Success<(VolunteerCommandExecuted Event, long SequenceNumber, VolunteerFamilyEntry VolunteerFamilyEntry, Action OnCommit)>((
                    Event: new VolunteerCommandExecuted(userId, timestampUtc, command),
                    SequenceNumber: LastKnownSequenceNumber + 1,
                    VolunteerFamilyEntry: volunteerFamilyEntryToUpsert,
                    OnCommit: () => volunteerFamilies = volunteerFamilies.SetItem(volunteerFamilyEntryToUpsert.FamilyId, volunteerFamilyEntryToUpsert)));
            }
            else
                return error;
        }

        public ImmutableList<VolunteerFamilyEntry> FindVolunteerFamilyEntries(Func<VolunteerFamilyEntry, bool> predicate)
        {
            return volunteerFamilies.Values
                .Where(predicate)
                .ToImmutableList();
        }

        public ResourceResult<VolunteerFamilyEntry> GetVolunteerFamilyEntry(Guid familyId) =>
            volunteerFamilies.TryGetValue(familyId, out var familyEntry)
            ? familyEntry
            : ResourceResult.NotFound;


        private void ReplayEvent(ApprovalEvent domainEvent, long sequenceNumber)
        {
            if (domainEvent is VolunteerFamilyCommandExecuted volunteerFamilyCommandExecuted)
            {
                var (_, _, _, onCommit) = (ExecuteVolunteerFamilyCommand(volunteerFamilyCommandExecuted.Command,
                    volunteerFamilyCommandExecuted.UserId, volunteerFamilyCommandExecuted.TimestampUtc)).AsT0.Value;
                onCommit();
            }
            else if (domainEvent is VolunteerCommandExecuted volunteerCommandExecuted)
            {
                var (_, _, _, onCommit) = (ExecuteVolunteerCommand(volunteerCommandExecuted.Command,
                    volunteerCommandExecuted.UserId, volunteerCommandExecuted.TimestampUtc)).AsT0.Value;
                onCommit();
            }
            else
                throw new NotImplementedException(
                $"The event type '{domainEvent.GetType().FullName}' has not been implemented.");

            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
