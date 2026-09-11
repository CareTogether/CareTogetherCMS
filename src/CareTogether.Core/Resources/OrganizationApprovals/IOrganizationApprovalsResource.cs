using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Resources.Approvals;
using JsonPolymorph;

namespace CareTogether.Resources.OrganizationApprovals
{
    public sealed record OrganizationApprovalEntry(
        Guid OrganizationId,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<RoleRemoval> RoleRemovals
    );

    [JsonHierarchyBase]
    public abstract partial record OrganizationApprovalCommand(Guid OrganizationId);

    public sealed record ActivateOrganizationApprovals(Guid OrganizationId)
        : OrganizationApprovalCommand(OrganizationId);

    public sealed record CompleteOrganizationRequirement(
        Guid OrganizationId,
        Guid CompletedRequirementId,
        string RequirementName,
        DateTime CompletedAtUtc,
        Guid? UploadedDocumentId,
        Guid? NoteId
    ) : OrganizationApprovalCommand(OrganizationId);

    public sealed record MarkOrganizationRequirementIncomplete(
        Guid OrganizationId,
        Guid CompletedRequirementId,
        string RequirementName
    ) : OrganizationApprovalCommand(OrganizationId);

    public sealed record ExemptOrganizationRequirement(
        Guid OrganizationId,
        string RequirementName,
        string AdditionalComments,
        DateTime? ExemptionExpiresAtUtc
    ) : OrganizationApprovalCommand(OrganizationId);

    public sealed record UnexemptOrganizationRequirement(
        Guid OrganizationId,
        string RequirementName
    ) : OrganizationApprovalCommand(OrganizationId);

    public sealed record RemoveOrganizationRole(
        Guid OrganizationId,
        string RoleName,
        RoleRemovalReason Reason,
        string? AdditionalComments,
        DateOnly? EffectiveSince,
        DateOnly? EffectiveThrough
    ) : OrganizationApprovalCommand(OrganizationId);

    public sealed record ResetOrganizationRole(
        Guid OrganizationId,
        string RoleName,
        DateOnly? ForRemovalEffectiveSince,
        DateOnly? EffectiveThrough
    ) : OrganizationApprovalCommand(OrganizationId);

    public interface IOrganizationApprovalsResource
    {
        Task<ImmutableList<OrganizationApprovalEntry>> ListAsync(
            Guid tenantId,
            Guid locationId
        );

        Task<OrganizationApprovalEntry?> TryGetAsync(
            Guid tenantId,
            Guid locationId,
            Guid organizationId
        );

        Task<OrganizationApprovalEntry> ExecuteCommandAsync(
            Guid tenantId,
            Guid locationId,
            OrganizationApprovalCommand command,
            Guid userId
        );
    }
}
