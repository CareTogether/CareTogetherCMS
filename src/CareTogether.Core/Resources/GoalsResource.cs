using CareTogether.Resources.Models;
using CareTogether.Resources.Storage;
using System;
using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Resources
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


        public async Task<ResourceResult<Goal>> ExecuteGoalCommandAsync(Guid organizationId, Guid locationId, GoalCommand command,
            Guid userId)
        {
            using (var lockedModel = await tenantGoalsModels.WriteLockItemAsync((organizationId, locationId)))
            {
                var result = lockedModel.Value.ExecuteGoalCommand(command, userId, DateTime.UtcNow);
                if (result.TryPickT0(out var success, out var _))
                {
                    await goalsEventLog.AppendEventAsync(organizationId, locationId, success.Value.Event, success.Value.SequenceNumber);
                    success.Value.OnCommit();
                    return success.Value.Goal;
                }
                else
                    return ResourceResult.NotFound; //TODO: Something more specific involving 'error'?
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
