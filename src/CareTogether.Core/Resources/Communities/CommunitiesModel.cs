using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Communities
{
    public sealed record CommunityCommandExecutedEvent(Guid UserId, DateTime TimestampUtc, CommunityCommand Command)
        : DomainEvent(UserId, TimestampUtc);

    public sealed class CommunitiesModel
    {
        ImmutableDictionary<Guid, Community> _Communities = ImmutableDictionary<Guid, Community>.Empty;

        public long LastKnownSequenceNumber { get; private set; } = -1;

        public static async Task<CommunitiesModel> InitializeAsync(
            IAsyncEnumerable<(CommunityCommandExecutedEvent DomainEvent, long SequenceNumber)> eventLog
        )
        {
            CommunitiesModel model = new();

            await foreach ((CommunityCommandExecutedEvent domainEvent, long sequenceNumber) in eventLog)
            {
                model.ReplayEvent(domainEvent, sequenceNumber);
            }

            return model;
        }

        public (
            CommunityCommandExecutedEvent Event,
            long SequenceNumber,
            Community Community,
            Action OnCommit
        ) ExecuteCommunityCommand(CommunityCommand command, Guid userId, DateTime timestampUtc)
        {
            Community? community;
            if (command is CreateCommunity create)
            {
                community = new Community(
                    create.CommunityId,
                    create.Name,
                    create.Description,
                    ImmutableList<Guid>.Empty,
                    ImmutableList<CommunityRoleAssignment>.Empty,
                    ImmutableList<UploadedDocumentInfo>.Empty
                );
            }
            else
            {
                if (!_Communities.TryGetValue(command.CommunityId, out community))
                {
                    throw new KeyNotFoundException("A community with the specified ID does not exist.");
                }

                community = command switch
                {
                    RenameCommunity c => community with { Name = c.Name },
                    EditCommunityDescription c => community with { Description = c.Description },
                    AddCommunityMemberFamily c => community with
                    {
                        MemberFamilies = community.MemberFamilies.Add(c.FamilyId),
                    },
                    RemoveCommunityMemberFamily c => community with
                    {
                        MemberFamilies = community.MemberFamilies.Remove(c.FamilyId),
                    },
                    AddCommunityRoleAssignment c => community with
                    {
                        CommunityRoleAssignments = community.CommunityRoleAssignments.Add(
                            new CommunityRoleAssignment(c.PersonId, c.CommunityRole)
                        ),
                    },
                    RemoveCommunityRoleAssignment c => community with
                    {
                        CommunityRoleAssignments = community.CommunityRoleAssignments.Remove(
                            new CommunityRoleAssignment(c.PersonId, c.CommunityRole)
                        ) //TODO: Does this work? (value equality)
                        ,
                    },
                    UploadCommunityDocument c => community with
                    {
                        UploadedDocuments = community.UploadedDocuments.Add(
                            new UploadedDocumentInfo(userId, timestampUtc, c.UploadedDocumentId, c.UploadedFileName)
                        ),
                    },
                    DeleteUploadedCommunityDocument c => community with
                    {
                        UploadedDocuments = community.UploadedDocuments.RemoveAll(udi =>
                            udi.UploadedDocumentId == c.UploadedDocumentId
                        ),
                    },
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                };
            }

            return (
                Event: new CommunityCommandExecutedEvent(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                Community: community,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    _Communities = _Communities.SetItem(community.Id, community);
                }
            );
        }

        public ImmutableList<Community> FindCommunities(Func<Community, bool> predicate)
        {
            return _Communities.Values.Where(predicate).ToImmutableList();
        }

        void ReplayEvent(CommunityCommandExecutedEvent domainEvent, long sequenceNumber)
        {
            (CommunityCommandExecutedEvent _, long _, Community _, Action onCommit) = ExecuteCommunityCommand(
                domainEvent.Command,
                domainEvent.UserId,
                domainEvent.TimestampUtc
            );
            onCommit();
            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
