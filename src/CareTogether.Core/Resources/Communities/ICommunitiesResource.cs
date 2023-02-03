using JsonPolymorph;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources.Communities
{
    public sealed record Community(Guid Id, string Name, string Description,
        ImmutableList<Guid> MemberFamilies, ImmutableList<CommunityRoleAssignment> CommunityRoleAssignments,
        ImmutableList<UploadedDocumentInfo> UploadedDocuments);
    public sealed record CommunityRoleAssignment(Guid PersonId, string CommunityRole);

    [JsonHierarchyBase]
    public abstract partial record CommunityCommand(Guid CommunityId);
    public sealed record CreateCommunity(Guid CommunityId, string Name, string Description)
        : CommunityCommand(CommunityId);
    public sealed record RenameCommunity(Guid CommunityId, string Name)
        : CommunityCommand(CommunityId);
    public sealed record EditCommunityDescription(Guid CommunityId, string Description)
        : CommunityCommand(CommunityId);
    public sealed record AddCommunityMemberFamily(Guid CommunityId, Guid FamilyId)
        : CommunityCommand(CommunityId);
    public sealed record RemoveCommunityMemberFamily(Guid CommunityId, Guid FamilyId)
        : CommunityCommand(CommunityId);
    public sealed record AddCommunityRoleAssignment(Guid CommunityId, Guid PersonId, string CommunityRole)
        : CommunityCommand(CommunityId);
    public sealed record RemoveCommunityRoleAssignment(Guid CommunityId, Guid PersonId, string CommunityRole)
        : CommunityCommand(CommunityId);
    public sealed record UploadCommunityDocument(Guid CommunityId, Guid UploadedDocumentId, string UploadedFileName)
        : CommunityCommand(CommunityId);
    public sealed record DeleteUploadedCommunityDocument(Guid CommunityId, Guid UploadedDocumentId)
        : CommunityCommand(CommunityId);

    /// <summary>
    /// The <see cref="ICommunitiesResource"/> is responsible for all communities in CareTogether.
    /// This includes family-level membership and community role assignments as well as tracking community content.
    /// </summary>
    public interface ICommunitiesResource
    {
        Task<Community> ExecuteCommunityCommandAsync(Guid organizationId, Guid locationId, CommunityCommand command, Guid userId);

        Task<ImmutableList<Community>> ListLocationCommunitiesAsync(Guid organizationId, Guid locationId);
    }
}
