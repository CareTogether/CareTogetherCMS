using System;
using System.Collections.Immutable;

namespace CareTogether.Resources.Policies
{
    public sealed class PolicyValidationException : InvalidOperationException
    {
        public PolicyValidationException(ImmutableList<string> errors)
            : base($"Policy validation failed: {string.Join(" ", errors)}")
        {
            Errors = errors;
        }

        public ImmutableList<string> Errors { get; }
    }
}
