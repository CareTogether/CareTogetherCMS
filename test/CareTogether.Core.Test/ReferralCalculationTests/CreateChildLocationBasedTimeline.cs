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
        public void CreateTimelineWithOneGap()
        {
            var result = ReferralCalculations.CreateChildLocationBasedTimeline(
                H.ChildLocation(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 12),
                    (H.Id('1'), ChildLocationPlan.DaytimeChildCare, 1, 20),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 25)
                ).ToImmutableList()
            );

            AssertEx.SequenceIs(result, new DateOnlyTimeline([
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 1)),
                    DateOnly.FromDateTime(H.Date(1, 12))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 20)),
                    DateOnly.FromDateTime(H.Date(1, 25))
                )
            ]));
        }

        [TestMethod]
        public void CreateTimelineWithTwoGaps()
        {
            var result = ReferralCalculations.CreateChildLocationBasedTimeline(
                H.ChildLocation(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 12),
                    (H.Id('1'), ChildLocationPlan.DaytimeChildCare, 1, 20),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 25),
                    (H.Id('2'), ChildLocationPlan.DaytimeChildCare, 1, 30),
                    (Guid.Empty, ChildLocationPlan.WithParent, 2, 5)
                ).ToImmutableList()
            );

            AssertEx.SequenceIs(result, new DateOnlyTimeline([
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 1)),
                    DateOnly.FromDateTime(H.Date(1, 12))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 20)),
                    DateOnly.FromDateTime(H.Date(1, 25))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 30)),
                    DateOnly.FromDateTime(H.Date(2, 5))
                )
            ]));
        }

        [TestMethod]
        public void CreateTimelineWithTwoGapsFilteredByFamilyId()
        {
            var result = ReferralCalculations.CreateChildLocationBasedTimeline(
                H.ChildLocation(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 12),
                    (H.Id('1'), ChildLocationPlan.DaytimeChildCare, 1, 20),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 25),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 30),
                    (Guid.Empty, ChildLocationPlan.WithParent, 2, 5)
                ).ToImmutableList(),
                filterToFamilyId: H.Id('0')
            );

            AssertEx.SequenceIs(result, new DateOnlyTimeline([
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 1)),
                    DateOnly.FromDateTime(H.Date(1, 12))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 30)),
                    DateOnly.FromDateTime(H.Date(2, 5))
                )
            ]));
        }

        [TestMethod]
        public void CreateTimelineChildWithParentAtEnd()
        {
            var result = ReferralCalculations.CreateChildLocationBasedTimeline(
                H.ChildLocation(
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (Guid.Empty, ChildLocationPlan.WithParent, 1, 12),
                    (H.Id('0'), ChildLocationPlan.DaytimeChildCare, 1, 20)
                ).ToImmutableList()
            );

            AssertEx.SequenceIs(result, new DateOnlyTimeline([
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 1)),
                    DateOnly.FromDateTime(H.Date(1, 12))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 20))
                )
            ]));
        }
    }
}