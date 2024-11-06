using System;
using System.Collections.Immutable;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Referrals;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Timelines;
using H = CareTogether.Core.Test.ReferralCalculationTests.Helpers;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CreateChildLocationBasedTimeline
    {
        [TestMethod]
        public void CreateTimeline()
        {
            var result = ReferralCalculations.CreateChildLocationBasedTimeline(
                H.ChildLocation(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (ChildLocationPlan.WithParent, 1, 12),
                    (ChildLocationPlan.DaytimeChildCare, 1, 20),
                    (ChildLocationPlan.WithParent, 1, 25)
                ).ToImmutableList()
            );

            AssertEx.SequenceIs(result, new DateOnlyTimeline([
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 2)),
                    DateOnly.FromDateTime(H.Date(1, 12))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 21)),
                    DateOnly.FromDateTime(H.Date(1, 25))
                )
            ]));
        }

        [TestMethod]
        public void CreateTimelineChildWithParentAtEnd()
        {
            var result = ReferralCalculations.CreateChildLocationBasedTimeline(
                H.ChildLocation(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (ChildLocationPlan.WithParent, 1, 12),
                    (ChildLocationPlan.DaytimeChildCare, 1, 20)
                ).ToImmutableList()
            );

            AssertEx.SequenceIs(result, new DateOnlyTimeline([
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 2)),
                    DateOnly.FromDateTime(H.Date(1, 12))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 21))
                )
            ]));
        }
    }
}