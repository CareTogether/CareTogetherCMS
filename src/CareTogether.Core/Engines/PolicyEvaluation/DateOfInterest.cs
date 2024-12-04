using System;

//NOTE: If there are ever more than two options, IsMissing should become an enum.
public sealed record DateOfInterest(DateOnly Date, bool IsMissing);
