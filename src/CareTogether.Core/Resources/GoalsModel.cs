using OneOf;
using OneOf.Types;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Threading.Tasks;

namespace CareTogether.Resources
{
    public sealed record GoalCommandExecutedEvent(GoalCommand Command);

    public sealed class GoalsModel
    {
        private ImmutableDictionary<(Guid PersonId, Guid GoalId), Goal> goals =
            ImmutableDictionary<(Guid PersonId, Guid GoalId), Goal>.Empty;


        public long LastKnownSequenceNumber { get; private set; } = -1;


        public static async Task<GoalsModel> InitializeAsync(
            IAsyncEnumerable<(GoalCommandExecutedEvent DomainEvent, long SequenceNumber)> eventLog)
        {
            var model = new GoalsModel();

            await foreach (var (domainEvent, sequenceNumber) in eventLog)
                model.ReplayEvent(domainEvent, sequenceNumber);

            return model;
        }


        public OneOf<Success<(GoalCommandExecutedEvent Event, long SequenceNumber, Goal Goal, Action OnCommit)>, Error<string>>
            ExecuteGoalCommand(GoalCommand command)
        {
            Goal goal;
            if (command is CreateGoal create)
                goal = new Goal(create.GoalId, create.PersonId, create.Description, create.CreatedDate, create.TargetDate, null);
            else
            {
                if (!goals.TryGetValue((command.PersonId, command.GoalId), out goal))
                    return new Error<string>("A goal with the specified person ID and goal ID does not exist.");

                goal = command switch
                {
                    ChangeGoalDescription c => goal with
                    {
                        Description = c.Description
                    },
                    ChangeGoalTargetDate c => goal with
                    {
                        TargetDate = c.TargetDate
                    },
                    MarkGoalCompleted c => goal with
                    {
                        CompletedDate = c.CompletedDate
                    },
                    _ => throw new NotImplementedException(
                        $"The command type '{command.GetType().FullName}' has not been implemented.")
                };
            }

            return new Success<(GoalCommandExecutedEvent Event, long SequenceNumber, Goal Goal, Action OnCommit)>((
                Event: new GoalCommandExecutedEvent(command),
                SequenceNumber: LastKnownSequenceNumber + 1,
                Goal: goal,
                OnCommit: () => { goals = goals.SetItem((goal.PersonId, goal.Id), goal); }
            ));
        }

        public IImmutableList<Goal> FindGoals(Func<Goal, bool> predicate) =>
            goals.Values
                .Where(predicate)
                .ToImmutableList();


        private void ReplayEvent(GoalCommandExecutedEvent domainEvent, long sequenceNumber)
        {
            var (_, _, _, onCommit) = ExecuteGoalCommand(domainEvent.Command).AsT0.Value;
            onCommit();
            LastKnownSequenceNumber = sequenceNumber;
        }
    }
}
