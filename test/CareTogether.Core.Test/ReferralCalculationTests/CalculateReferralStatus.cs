using System;
using System.Collections.Immutable;
using CareTogether.Resources;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateReferralStatus
    {
        static readonly Guid _Guid0 = Id('0');
        static readonly Guid _Guid1 = Id('1');
        static readonly Guid _Guid2 = Id('2');
        static readonly Guid _Guid3 = Id('3');
        static readonly Guid _Guid4 = Id('4');
        static readonly Guid _Guid5 = Id('5');
        static readonly Guid _Guid6 = Id('6');

        static readonly ReferralPolicy _ReferralPolicy =
            new(
                Helpers.From(),
                ImmutableList<CustomField>.Empty,
                ImmutableList<ArrangementPolicy>
                    .Empty.Add(
                        new ArrangementPolicy(
                            "Overnight Hosting",
                            ChildInvolvement.ChildHousing,
                            ImmutableList<ArrangementFunction>
                                .Empty.Add(
                                    new ArrangementFunction(
                                        "Host Family",
                                        FunctionRequirement.OneOrMore,
                                        Helpers.From(),
                                        Helpers.From(),
                                        ImmutableList<Guid>.Empty,
                                        ImmutableList<ArrangementFunctionVariant>.Empty
                                    )
                                )
                                .Add(
                                    new ArrangementFunction(
                                        "Parent Ally",
                                        FunctionRequirement.ExactlyOne,
                                        Helpers.From(),
                                        Helpers.From(),
                                        ImmutableList<Guid>.Empty,
                                        ImmutableList<ArrangementFunctionVariant>.Empty
                                    )
                                )
                                .Add(
                                    new ArrangementFunction(
                                        "Family Coach",
                                        FunctionRequirement.OneOrMore,
                                        Helpers.From(),
                                        Helpers.From(),
                                        ImmutableList<Guid>.Empty,
                                        ImmutableList<ArrangementFunctionVariant>.Empty
                                    )
                                )
                                .Add(
                                    new ArrangementFunction(
                                        "Community Friend",
                                        FunctionRequirement.ZeroOrMore,
                                        Helpers.From(),
                                        Helpers.From(),
                                        ImmutableList<Guid>.Empty,
                                        ImmutableList<ArrangementFunctionVariant>.Empty
                                    )
                                ),
                            Helpers.From(),
                            ImmutableList<MonitoringRequirement>.Empty,
                            Helpers.From()
                        )
                    )
                    .Add(
                        new ArrangementPolicy(
                            "Daytime Hosting",
                            ChildInvolvement.DaytimeChildCareOnly,
                            ImmutableList<ArrangementFunction>
                                .Empty.Add(
                                    new ArrangementFunction(
                                        "Host Family",
                                        FunctionRequirement.OneOrMore,
                                        Helpers.From(),
                                        Helpers.From(),
                                        ImmutableList<Guid>.Empty,
                                        ImmutableList<ArrangementFunctionVariant>.Empty
                                    )
                                )
                                .Add(
                                    new ArrangementFunction(
                                        "Parent Ally",
                                        FunctionRequirement.ExactlyOne,
                                        Helpers.From(),
                                        Helpers.From(),
                                        ImmutableList<Guid>.Empty,
                                        ImmutableList<ArrangementFunctionVariant>.Empty
                                    )
                                )
                                .Add(
                                    new ArrangementFunction(
                                        "Family Coach",
                                        FunctionRequirement.OneOrMore,
                                        Helpers.From(),
                                        Helpers.From(),
                                        ImmutableList<Guid>.Empty,
                                        ImmutableList<ArrangementFunctionVariant>.Empty
                                    )
                                )
                                .Add(
                                    new ArrangementFunction(
                                        "Community Friend",
                                        FunctionRequirement.ZeroOrMore,
                                        Helpers.From(),
                                        Helpers.From(),
                                        ImmutableList<Guid>.Empty,
                                        ImmutableList<ArrangementFunctionVariant>.Empty
                                    )
                                ),
                            Helpers.From(),
                            ImmutableList<MonitoringRequirement>.Empty,
                            Helpers.From()
                        )
                    )
                    .Add(
                        new ArrangementPolicy(
                            "Friending",
                            ChildInvolvement.NoChildInvolvement,
                            ImmutableList<ArrangementFunction>
                                .Empty.Add(
                                    new ArrangementFunction(
                                        "Parent Ally",
                                        FunctionRequirement.ExactlyOne,
                                        Helpers.From(),
                                        Helpers.From(),
                                        ImmutableList<Guid>.Empty,
                                        ImmutableList<ArrangementFunctionVariant>.Empty
                                    )
                                )
                                .Add(
                                    new ArrangementFunction(
                                        "Community Friend",
                                        FunctionRequirement.ZeroOrMore,
                                        Helpers.From(),
                                        Helpers.From(),
                                        ImmutableList<Guid>.Empty,
                                        ImmutableList<ArrangementFunctionVariant>.Empty
                                    )
                                ),
                            Helpers.From(),
                            ImmutableList<MonitoringRequirement>.Empty,
                            Helpers.From()
                        )
                    ),
                ImmutableList<FunctionPolicy>.Empty
            );

        static readonly Person _Adult1 =
            new(
                _Guid1,
                true,
                "Bob",
                "Smith",
                Gender.Male,
                new ExactAge(new DateTime(2000, 1, 1)),
                "",
                ImmutableList<Address>.Empty,
                null,
                ImmutableList<PhoneNumber>.Empty,
                null,
                ImmutableList<EmailAddress>.Empty,
                null,
                null,
                null
            );

        static readonly Person _Adult2 =
            new(
                _Guid2,
                true,
                "Jane",
                "Smith",
                Gender.Female,
                new ExactAge(new DateTime(2000, 1, 1)),
                "",
                ImmutableList<Address>.Empty,
                null,
                ImmutableList<PhoneNumber>.Empty,
                null,
                ImmutableList<EmailAddress>.Empty,
                null,
                null,
                null
            );

        static readonly Person _InactiveAdult3 =
            new(
                _Guid3,
                false,
                "BobDUPLICATE",
                "Smith",
                Gender.Male,
                new ExactAge(new DateTime(2000, 1, 1)),
                "",
                ImmutableList<Address>.Empty,
                null,
                ImmutableList<PhoneNumber>.Empty,
                null,
                ImmutableList<EmailAddress>.Empty,
                null,
                null,
                null
            );

        static readonly Person _BrotherNotInHousehold4 =
            new(
                _Guid2,
                true,
                "Eric",
                "Smith",
                Gender.Male,
                new ExactAge(new DateTime(2000, 1, 1)),
                "",
                ImmutableList<Address>.Empty,
                null,
                ImmutableList<PhoneNumber>.Empty,
                null,
                ImmutableList<EmailAddress>.Empty,
                null,
                null,
                null
            );

        static readonly Person _Child5 =
            new(
                _Guid5,
                true,
                "Wanda",
                "Smith",
                Gender.Female,
                new ExactAge(new DateTime(2022, 1, 1)),
                "",
                ImmutableList<Address>.Empty,
                null,
                ImmutableList<PhoneNumber>.Empty,
                null,
                ImmutableList<EmailAddress>.Empty,
                null,
                null,
                null
            );

        static readonly Family _Family =
            new(
                _Guid0,
                true,
                _Guid1,
                ImmutableList<(Person, FamilyAdultRelationshipInfo)>
                    .Empty.Add((_Adult1, new FamilyAdultRelationshipInfo("Dad", true)))
                    .Add(
                        (_Adult2, new FamilyAdultRelationshipInfo("Mom", true))
                    )
                /*.Add((inactiveAdult3, new FamilyAdultRelationshipInfo("Dad", true))) //TODO: Reenable
                .Add((brotherNotInHousehold4, new FamilyAdultRelationshipInfo("Brother", false)))*/, //TODO: Reenable
                ImmutableList<Person>.Empty.Add(_Child5),
                ImmutableList<CustodialRelationship>
                    .Empty.Add(new CustodialRelationship(_Guid5, _Guid1, CustodialRelationshipType.ParentWithCustody))
                    .Add(new CustodialRelationship(_Guid5, _Guid2, CustodialRelationshipType.ParentWithCustody)),
                ImmutableList<UploadedDocumentInfo>.Empty,
                ImmutableList<Guid>.Empty,
                ImmutableList<CompletedCustomFieldInfo>.Empty,
                ImmutableList<Activity>.Empty
            );

        static Guid Id(char x)
        {
            return Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        }

        [TestMethod]
        public void Test()
        {
            Assert.Inconclusive("Not implemented");
        }
    }
}
