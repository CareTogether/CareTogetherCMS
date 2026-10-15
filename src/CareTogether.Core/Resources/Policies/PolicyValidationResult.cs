using System.Collections.Immutable;

namespace CareTogether.Resources.Policies
{
    public sealed record PolicyValidationResult(
        ImmutableList<string> Errors,
        ImmutableList<string> Warnings
    );
}
