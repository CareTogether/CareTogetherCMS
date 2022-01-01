using CareTogether.Resources;
using System;
using System.Collections.Immutable;
using System.Linq;

namespace CareTogether.Engines
{
    internal static class ReferralCalculations
    {
        public static ArrangementStatus CalculateArrangementStatus(ArrangementEntry arrangement, ArrangementPolicy arrangementPolicy)
        {
            var missingSetupRequirements = arrangementPolicy.RequiredSetupActionNames.Where(requiredAction =>
                !arrangement.CompletedRequirements.Any(completed => completed.RequirementName == requiredAction))
                .ToImmutableList();

            var missingMonitoringRequirements = ImmutableList<string>.Empty;

            var missingCloseoutRequirements = arrangementPolicy.RequiredCloseoutActionNames.Where(requiredAction =>
                !arrangement.CompletedRequirements.Any(completed => completed.RequirementName == requiredAction))
                .ToImmutableList();

            var missingFunctionAssignments = arrangementPolicy.VolunteerFunctions
                .Where(vf => (vf.Requirement == FunctionRequirement.ExactlyOne || vf.Requirement == FunctionRequirement.OneOrMore) &&
                    arrangement.FamilyVolunteerAssignments.Where(fva => fva.ArrangementFunction == vf.ArrangementFunction).Count() == 0 &&
                    arrangement.IndividualVolunteerAssignments.Where(iva => iva.ArrangementFunction == vf.ArrangementFunction).Count() == 0)
                .ToImmutableList();

            var phase = missingSetupRequirements.Count > 0 || missingFunctionAssignments.Count > 0
                ? ArrangementPhase.SettingUp
                : !arrangement.StartedAtUtc.HasValue
                ? ArrangementPhase.ReadyToStart
                : !arrangement.EndedAtUtc.HasValue
                ? ArrangementPhase.Started
                : ArrangementPhase.Ended;

            var missingRequirements = phase switch
            {
                ArrangementPhase.SettingUp => missingSetupRequirements,
                ArrangementPhase.ReadyToStart => ImmutableList<string>.Empty,
                ArrangementPhase.Started => missingMonitoringRequirements,
                ArrangementPhase.Ended => missingCloseoutRequirements,
                _ => throw new NotImplementedException($"The arrangement phase '{phase}' has not been implemented.")
            };

            return new ArrangementStatus(phase,
                missingRequirements);
        }
    }
}
