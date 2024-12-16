using System;
using System.Collections.Immutable;
using CareTogether.Resources;

namespace CareTogether.Engines.PolicyEvaluation
{
    public sealed record ReferralEntry(
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableDictionary<string, CompletedCustomFieldInfo> CompletedCustomFields,
        ImmutableDictionary<Guid, ArrangementEntry> Arrangements
    );

    public sealed record CompletedRequirementInfo(string RequirementName, DateOnly CompletedAt, DateOnly? ExpiresAt);

    public sealed record ExemptedRequirementInfo(
        string RequirementName,
        DateOnly? DueDate,
        DateOnly? ExemptionExpiresAt
    );

    public sealed record ArrangementEntry(
        string ArrangementType,
        DateOnly? StartedAt,
        DateOnly? EndedAt,
        DateOnly? CancelledAt,
        Guid PartneringFamilyPersonId,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements,
        ImmutableList<IndividualVolunteerAssignment> IndividualVolunteerAssignments,
        ImmutableList<FamilyVolunteerAssignment> FamilyVolunteerAssignments,
        ImmutableList<ChildLocation> ChildLocationHistory
    );

    public sealed record IndividualVolunteerAssignment(
        Guid FamilyId,
        Guid PersonId,
        string ArrangementFunction,
        string? ArrangementFunctionVariant,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements
    );

    public sealed record FamilyVolunteerAssignment(
        Guid FamilyId,
        string ArrangementFunction,
        string? ArrangementFunctionVariant,
        ImmutableList<CompletedRequirementInfo> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfo> ExemptedRequirements
    );
}
