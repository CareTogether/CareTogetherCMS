using CareTogether.Utilities.EventLog;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources.Goals
{
    public sealed class GoalsResource : IGoalsResource
    {
        private readonly IMultitenantEventLog<GoalCommandExecutedEvent> goalsEventLog;
        private readonly ConcurrentLockingStore<(Guid organizationId, Guid locationId), GoalsModel> tenantGoalsModels;


        public GoalsResource(IMultitenantEventLog<GoalCommandExecutedEvent> goalsEventLog)
        {
            this.goalsEventLog = goalsEventLog;
            tenantGoalsModels = new ConcurrentLockingStore<(Guid organizationId, Guid locationId), GoalsModel>(key =>
                GoalsModel.InitializeAsync(goalsEventLog.GetAllEventsAsync(key.organizationId, key.locationId)));
        }


        public async Task<Goal> ExecuteGoalCommandAsync(Guid organizationId, Guid locationId, GoalCommand command,
            Guid userId)
        {
            using (var lockedModel = await tenantGoalsModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteGoalCommand(command, userId, DateTime.UtcNow);

                await goalsEventLog.AppendEventAsync(organizationId, locationId, result.Event, result.SequenceNumber);
                result.OnCommit();
                return result.Goal;
            }
        }

        public async Task<ImmutableList<Goal>> ListPersonGoalsAsync(Guid organizationId, Guid locationId, Guid personId)
        {
            using (var lockedModel = await tenantGoalsModels.ReadLockItemAsync((organizationId, locationId)))
            {
                return lockedModel.Value.FindGoals(c => c.PersonId == personId);
            }
        }
    }
}
