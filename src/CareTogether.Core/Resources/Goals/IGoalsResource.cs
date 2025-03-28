using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using JsonPolymorph;

namespace CareTogether.Resources.Goals
{
    public sealed record Goal(
        Guid Id,
        Guid PersonId,
        string Description,
        DateTime CreatedDate,
        DateTime? TargetDate,
        DateTime? CompletedDate
    );

    [JsonHierarchyBase]
    public abstract partial record GoalCommand(Guid PersonId, Guid GoalId);

    public sealed record CreateGoal(
        Guid PersonId,
        Guid GoalId,
        string Description,
        DateTime? TargetDate
    ) : GoalCommand(PersonId, GoalId);

    public sealed record ChangeGoalDescription(Guid PersonId, Guid GoalId, string Description)
        : GoalCommand(PersonId, GoalId);

    public sealed record ChangeGoalTargetDate(Guid PersonId, Guid GoalId, DateTime? TargetDate)
        : GoalCommand(PersonId, GoalId);

    public sealed record MarkGoalCompleted(Guid PersonId, Guid GoalId, DateTime CompletedUtc)
        : GoalCommand(PersonId, GoalId);

    /// <summary>
    /// The <see cref="IGoalsResource"/> is responsible for all personal goals in CareTogether.
    /// This includes generally-privileged information like names and contact information, as well as
    /// more restricted information like intake forms, goals, and volunteer application forms.
    /// </summary>
    public interface IGoalsResource
    {
        Task<Goal> ExecuteGoalCommandAsync(
            Guid organizationId,
            Guid locationId,
            GoalCommand command,
            Guid userId
        );

        Task<ImmutableList<Goal>> ListPersonGoalsAsync(
            Guid organizationId,
            Guid locationId,
            Guid personId
        );
    }
}
