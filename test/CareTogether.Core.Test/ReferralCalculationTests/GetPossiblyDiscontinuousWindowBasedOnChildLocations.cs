using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Referrals;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Immutable;
using Timelines;
using H = CareTogether.Core.Test.ReferralCalculationTests.Helpers;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class GetPossiblyDiscontinuousWindowBasedOnChildLocations
    {
        [TestMethod]
        public void GetDiscontinuousWindowWithPauseInMiddle()
        {
            var result = ReferralCalculations.GetPossiblyDiscontinuousWindowBasedOnChildLocations(
                nextWindowSearchFromDate: DateOnly.FromDateTime(H.Date(1, 10)),
                windowLength: TimeSpan.FromDays(7),
                childLocationHistory: H.ChildLocation(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (ChildLocationPlan.WithParent, 1, 12),
                    (ChildLocationPlan.DaytimeChildCare, 1, 20)
                ).ToImmutableList()
            );

            AssertEx.SequenceIs(result, [
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 11)),
                    DateOnly.FromDateTime(H.Date(1, 12))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 21)),
                    DateOnly.FromDateTime(H.Date(1, 25))
                )
            ]);
        }

        [TestMethod]
        public void GetDiscontinuousWindowWithTwoPauses()
        {
            var result = ReferralCalculations.GetPossiblyDiscontinuousWindowBasedOnChildLocations(
                nextWindowSearchFromDate: DateOnly.FromDateTime(H.Date(1, 10)),
                windowLength: TimeSpan.FromDays(7),
                childLocationHistory: H.ChildLocation(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (ChildLocationPlan.WithParent, 1, 12),
                    (ChildLocationPlan.DaytimeChildCare, 1, 20),
                    (ChildLocationPlan.WithParent, 1, 22),
                    (ChildLocationPlan.DaytimeChildCare, 1, 27)
                ).ToImmutableList()
            );

            AssertEx.SequenceIs(result, [
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 11)),
                    DateOnly.FromDateTime(H.Date(1, 12))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 21)),
                    DateOnly.FromDateTime(H.Date(1, 22))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 28)),
                    DateOnly.FromDateTime(H.Date(1, 30))
                )
            ]);
        }

        [TestMethod]
        public void GetDiscontinuousWindowWithThreePauses()
        {
            var result = ReferralCalculations.GetPossiblyDiscontinuousWindowBasedOnChildLocations(
                nextWindowSearchFromDate: DateOnly.FromDateTime(H.Date(1, 10)),
                windowLength: TimeSpan.FromDays(7),
                childLocationHistory: H.ChildLocation(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (ChildLocationPlan.WithParent, 1, 12),
                    (ChildLocationPlan.DaytimeChildCare, 1, 20),
                    (ChildLocationPlan.WithParent, 1, 22),
                    (ChildLocationPlan.DaytimeChildCare, 1, 27),
                    (ChildLocationPlan.WithParent, 1, 29),
                    (ChildLocationPlan.DaytimeChildCare, 2, 3)
                ).ToImmutableList()
            );

            AssertEx.SequenceIs(result, [
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 11)),
                    DateOnly.FromDateTime(H.Date(1, 12))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 21)),
                    DateOnly.FromDateTime(H.Date(1, 22))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 28)),
                    DateOnly.FromDateTime(H.Date(1, 29))
                ),
                new DateRange(
                    DateOnly.FromDateTime(H.Date(2, 4)),
                    DateOnly.FromDateTime(H.Date(2, 4))
                )
            ]);
        }

        [TestMethod]
        public void GetDiscontinuousWindowWithPauseWithoutResume()
        {
            var result = ReferralCalculations.GetPossiblyDiscontinuousWindowBasedOnChildLocations(
                nextWindowSearchFromDate: DateOnly.FromDateTime(H.Date(1, 10)),
                windowLength: TimeSpan.FromDays(7),
                childLocationHistory: H.ChildLocation(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1),
                    (ChildLocationPlan.WithParent, 1, 12)
                ).ToImmutableList()
            );

            AssertEx.SequenceIs(result, null);
        }


        [TestMethod]
        public void GetDiscontinuousWindowWithoutPause()
        {
            var result = ReferralCalculations.GetPossiblyDiscontinuousWindowBasedOnChildLocations(
                nextWindowSearchFromDate: DateOnly.FromDateTime(H.Date(1, 10)),
                windowLength: TimeSpan.FromDays(7),
                childLocationHistory: H.ChildLocation(
                    (ChildLocationPlan.DaytimeChildCare, 1, 1)
                ).ToImmutableList()
            );

            AssertEx.SequenceIs(result, [
                new DateRange(
                    DateOnly.FromDateTime(H.Date(1, 11)),
                    DateOnly.FromDateTime(H.Date(1, 17))
                )
            ]);
        }
    }
}
