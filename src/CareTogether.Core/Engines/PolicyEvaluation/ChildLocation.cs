using System;

namespace CareTogether.Engines.PolicyEvaluation;

public sealed record ChildLocation(
    Guid ChildLocationFamilyId,
    DateOnly Date,
    bool Paused // means "from now on, we stop checking for completion until resuming"
);
