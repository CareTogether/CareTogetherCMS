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
            var missingSetupRequirements = CalculateMissingSetupRequirements(arrangement, arrangementPolicy);
            var missingMonitoringRequirements = CalculateMissingMonitoringRequirements();
            var missingCloseoutRequirements = CalculateMissingCloseoutRequirements(arrangement, arrangementPolicy);
            var missingFunctionAssignments = CalculateMissingFunctionAssignments(arrangement, arrangementPolicy);

            var phase = CalculateArrangementPhase(arrangement, missingSetupRequirements, missingFunctionAssignments);

            var missingRequirements = SelectMissingRequirements(phase,
                missingSetupRequirements, missingMonitoringRequirements, missingCloseoutRequirements);

            return new ArrangementStatus(phase,
                missingRequirements);
        }


        internal static ImmutableList<string> SelectMissingRequirements(ArrangementPhase phase,
            ImmutableList<string> missingSetupRequirements,
            ImmutableList<string> missingMonitoringRequirements,
            ImmutableList<string> missingCloseoutRequirements) => phase switch
            {
                ArrangementPhase.SettingUp => missingSetupRequirements,
                ArrangementPhase.ReadyToStart => ImmutableList<string>.Empty,
                ArrangementPhase.Started => missingMonitoringRequirements,
                ArrangementPhase.Ended => missingCloseoutRequirements,
                _ => throw new NotImplementedException($"The arrangement phase '{phase}' has not been implemented.")
            };

        internal static ArrangementPhase CalculateArrangementPhase(ArrangementEntry arrangement,
            ImmutableList<string> missingSetupRequirements,
            ImmutableList<VolunteerFunction> missingFunctionAssignments) =>
            missingSetupRequirements.Count > 0 || missingFunctionAssignments.Count > 0
                ? ArrangementPhase.SettingUp
                : !arrangement.StartedAtUtc.HasValue
                ? ArrangementPhase.ReadyToStart
                : !arrangement.EndedAtUtc.HasValue
                ? ArrangementPhase.Started
                : ArrangementPhase.Ended;

        internal static ImmutableList<string> CalculateMissingSetupRequirements(ArrangementEntry arrangement,
            ArrangementPolicy arrangementPolicy) =>
            arrangementPolicy.RequiredSetupActionNames.Where(requiredAction =>
                !arrangement.CompletedRequirements.Any(completed => completed.RequirementName == requiredAction))
                .ToImmutableList();

        internal static ImmutableList<string> CalculateMissingMonitoringRequirements()
        {
            //TODO: Implement!
            return ImmutableList<string>.Empty;
        }

        internal static ImmutableList<string> CalculateMissingCloseoutRequirements(ArrangementEntry arrangement,
            ArrangementPolicy arrangementPolicy) =>
            arrangementPolicy.RequiredCloseoutActionNames.Where(requiredAction =>
                !arrangement.CompletedRequirements.Any(completed => completed.RequirementName == requiredAction))
                .ToImmutableList();

        internal static ImmutableList<VolunteerFunction> CalculateMissingFunctionAssignments(ArrangementEntry arrangement,
            ArrangementPolicy arrangementPolicy) =>
            arrangementPolicy.VolunteerFunctions
                .Where(vf => (vf.Requirement == FunctionRequirement.ExactlyOne || vf.Requirement == FunctionRequirement.OneOrMore) &&
                    arrangement.FamilyVolunteerAssignments.Where(fva => fva.ArrangementFunction == vf.ArrangementFunction).Count() == 0 &&
                    arrangement.IndividualVolunteerAssignments.Where(iva => iva.ArrangementFunction == vf.ArrangementFunction).Count() == 0)
                .ToImmutableList();
    }
}
