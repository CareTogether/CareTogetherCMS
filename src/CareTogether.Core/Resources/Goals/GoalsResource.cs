using System;
using System.Collections.Immutable;
using System.Threading.Tasks;
using CareTogether.Utilities.EventLog;

namespace CareTogether.Resources.Goals
{
    public sealed class GoalsResource : IGoalsResource
    {
        readonly IEventLog<GoalCommandExecutedEvent> _GoalsEventLog;
        readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), GoalsModel> _TenantGoalsModels;

        public GoalsResource(IEventLog<GoalCommandExecutedEvent> goalsEventLog)
        {
            _GoalsEventLog = goalsEventLog;
            _TenantGoalsModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), GoalsModel>(key =>
                GoalsModel.InitializeAsync(goalsEventLog.GetAllEventsAsync(key.organizationId, key.locationId))
            );
        }

        public async Task<Goal> ExecuteGoalCommandAsync(
            Guid organizationId,
            Guid locationId,
            GoalCommand command,
            Guid userId
        )
        {
            using (
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    GoalsModel
                >.LockedItem<GoalsModel> lockedModel = await _TenantGoalsModels.WriteLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                (GoalCommandExecutedEvent Event, long SequenceNumber, Goal Goal, Action OnCommit) result =
                    lockedModel.Value.ExecuteGoalCommand(command, userId, DateTime.UtcNow);

                await _GoalsEventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.Goal;
            }
        }

        public async Task<ImmutableList<Goal>> ListPersonGoalsAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            using (
                ConcurrentLockingStore<
                    (Guid organizationId, Guid locationId),
                    GoalsModel
                >.LockedItem<GoalsModel> lockedModel = await _TenantGoalsModels.ReadLockItemAsync(
                    (organizationId, locationId)
                )
            )
            {
                return lockedModel.Value.FindGoals(c => c.PersonId == personId);
            }
        }
    }
}
