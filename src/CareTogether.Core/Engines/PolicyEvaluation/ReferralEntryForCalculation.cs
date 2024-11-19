using System;
using System.Collections.Immutable;
using CareTogether.Resources;

namespace CareTogether.Engines.PolicyEvaluation
{
    public sealed record ReferralEntryForCalculation(
        ImmutableList<CompletedRequirementInfoForCalculation> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfoForCalculation> ExemptedRequirements,
        ImmutableDictionary<string, CompletedCustomFieldInfo> CompletedCustomFields,
        ImmutableDictionary<Guid, ArrangementEntryForCalculation> Arrangements
    );

    public sealed record CompletedRequirementInfoForCalculation(
        string RequirementName,
        DateOnly CompletedAtDate,
        DateTime CompletedAt,
        DateTime? ExpiresAt
    );

    public sealed record ExemptedRequirementInfoForCalculation(
        string RequirementName,
        DateTime? DueDate,
        DateOnly? ExemptionExpiresAtDate,
        DateTime? ExemptionExpiresAt
    );

    public sealed record ArrangementEntryForCalculation(
        string ArrangementType,
        DateOnly? StartedAtDate,
        DateOnly? EndedAtDate,
        DateOnly? CancelledAtUtc,
        Guid PartneringFamilyPersonId,
        ImmutableList<CompletedRequirementInfoForCalculation> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfoForCalculation> ExemptedRequirements,
        ImmutableList<IndividualVolunteerAssignmentForCalculation> IndividualVolunteerAssignments,
        ImmutableList<FamilyVolunteerAssignmentForCalculation> FamilyVolunteerAssignments,
        ImmutableSortedSet<ChildLocation> ChildLocationHistory
    );

    public sealed record IndividualVolunteerAssignmentForCalculation(
        Guid FamilyId,
        Guid PersonId,
        string ArrangementFunction,
        string? ArrangementFunctionVariant,
        ImmutableList<CompletedRequirementInfoForCalculation> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfoForCalculation> ExemptedRequirements
    );

    public sealed record FamilyVolunteerAssignmentForCalculation(
        Guid FamilyId,
        string ArrangementFunction,
        string? ArrangementFunctionVariant,
        ImmutableList<CompletedRequirementInfoForCalculation> CompletedRequirements,
        ImmutableList<ExemptedRequirementInfoForCalculation> ExemptedRequirements
    );
}
