using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources.Goals
{
    public sealed record GoalCommandExecutedEvent(Guid UserId, DateTime TimestampUtc, GoalCommand Command)
        : DomainEvent(UserId, TimestampUtc);

    public sealed class GoalsModel
    {
        ImmutableDictionary<(Guid PersonId, Guid GoalId), Goal> _Goals = ImmutableDictionary<
            (Guid PersonId, Guid GoalId),
            Goal
        >.Empty;

        public long LastKnownSequenceNumber { get; private set; } = -1;

        public static async Task<GoalsModel> InitializeAsync(
            IAsyncEnumerable<(GoalCommandExecutedEvent DomainEvent, long SequenceNumber)> eventLog
        )
        {
            GoalsModel model = new();

            await foreach ((GoalCommandExecutedEvent domainEvent, long sequenceNumber) in eventLog)
            {
                model.ReplayEvent(domainEvent, sequenceNumber);
            }

            return model;
        }

        public (GoalCommandExecutedEvent Event, long SequenceNumber, Goal Goal, Action OnCommit) ExecuteGoalCommand(
            GoalCommand command,
            Guid userId,
            DateTime timestampUtc
        )
        {
            Goal? goal;
            if (command is CreateGoal create)
            {
                goal = new Goal(
                    create.GoalId,
                    create.PersonId,
                    create.Description,
                    timestampUtc,
                    create.TargetDate,
                    null
                );
            }
            else
            {
                if (!_Goals.TryGetValue((command.PersonId, command.GoalId), out goal))
                {
                    throw new KeyNotFoundException("A goal with the specified person ID and goal ID does not exist.");
                }

                goal = command switch
                {
                    ChangeGoalDescription c => goal with { Description = c.Description },
                    ChangeGoalTargetDate c => goal with { TargetDate = c.TargetDate },
                    MarkGoalCompleted c => goal with { CompletedDate = c.CompletedUtc },
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented."
                    ),
                };
            }

            return (
                Event: new GoalCommandExecutedEvent(userId, timestampUtc, command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                Goal: goal,
                OnCommit: () =>
                {
                    LastKnownSequenceNumber++;
                    _Goals = _Goals.SetItem((goal.PersonId, goal.Id), goal);
                }
            );
        }

        public ImmutableList<Goal> FindGoals(Func<Goal, bool> predicate)
        {
            return _Goals.Values.Where(predicate).ToImmutableList();
        }

        void ReplayEvent(GoalCommandExecutedEvent domainEvent, long sequenceNumber)
        {
            (GoalCommandExecutedEvent _, long _, Goal _, Action onCommit) = ExecuteGoalCommand(
                domainEvent.Command,
                domainEvent.UserId,
                domainEvent.TimestampUtc
            );
            onCommit();
            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
