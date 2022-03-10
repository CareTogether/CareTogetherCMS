using CareTogether.Engines;
using CareTogether.Resources;
using CareTogether.Resources.Directory;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using System;
using System.Collections.Generic;
using System.Collections.Immutable;

namespace CareTogether.Core.Test.ReferralCalculationTests
{
    [TestClass]
    public class CalculateReferralStatus
    {
        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid0 = Id('0');
        static readonly Guid guid1 = Id('1');
        static readonly Guid guid2 = Id('2');
        static readonly Guid guid3 = Id('3');
        static readonly Guid guid4 = Id('4');
        static readonly Guid guid5 = Id('5');
        static readonly Guid guid6 = Id('6');

        static ReferralPolicy referralPolicy = new ReferralPolicy(
            RequiredIntakeActionNames: Helpers.From(),
            CustomFields: ImmutableList<CustomField>.Empty,
            ArrangementPolicies: ImmutableList<ArrangementPolicy>.Empty
            .Add(new ArrangementPolicy("Overnight Hosting", ChildInvolvement.ChildHousing,
                ImmutableList<ArrangementFunction>.Empty
                .Add(new ArrangementFunction("Host Family", FunctionRequirement.OneOrMore,
                    EligibleIndividualVolunteerRoles: Helpers.From(),
                    EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty))
                .Add(new ArrangementFunction("Parent Ally", FunctionRequirement.ExactlyOne,
                    EligibleIndividualVolunteerRoles: Helpers.From(),
                    EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty))
                .Add(new ArrangementFunction("Family Coach", FunctionRequirement.OneOrMore,
                    EligibleIndividualVolunteerRoles: Helpers.From(),
                    EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty))
                .Add(new ArrangementFunction("Community Friend", FunctionRequirement.ZeroOrMore,
                    EligibleIndividualVolunteerRoles: Helpers.From(),
                    EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty)),
                RequiredSetupActionNames: Helpers.From(),
                RequiredMonitoringActions: ImmutableList<MonitoringRequirement>.Empty,
                RequiredCloseoutActionNames: Helpers.From()))
            .Add(new ArrangementPolicy("Daytime Hosting", ChildInvolvement.DaytimeChildCareOnly,
                ImmutableList<ArrangementFunction>.Empty
                .Add(new ArrangementFunction("Host Family", FunctionRequirement.OneOrMore,
                    EligibleIndividualVolunteerRoles: Helpers.From(),
                    EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty))
                .Add(new ArrangementFunction("Parent Ally", FunctionRequirement.ExactlyOne,
                    EligibleIndividualVolunteerRoles: Helpers.From(),
                    EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty))
                .Add(new ArrangementFunction("Family Coach", FunctionRequirement.OneOrMore,
                    EligibleIndividualVolunteerRoles: Helpers.From(),
                    EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty))
                .Add(new ArrangementFunction("Community Friend", FunctionRequirement.ZeroOrMore,
                    EligibleIndividualVolunteerRoles: Helpers.From(),
                    EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty)),
                RequiredSetupActionNames: Helpers.From(),
                RequiredMonitoringActions: ImmutableList<MonitoringRequirement>.Empty,
                RequiredCloseoutActionNames: Helpers.From()))
            .Add(new ArrangementPolicy("Friending", ChildInvolvement.NoChildInvolvement,
                ImmutableList<ArrangementFunction>.Empty
                .Add(new ArrangementFunction("Parent Ally", FunctionRequirement.ExactlyOne,
                    EligibleIndividualVolunteerRoles: Helpers.From(),
                    EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty))
                .Add(new ArrangementFunction("Community Friend", FunctionRequirement.ZeroOrMore,
                    EligibleIndividualVolunteerRoles: Helpers.From(),
                    EligibleVolunteerFamilyRoles: Helpers.From(),
                EligiblePeople: ImmutableList<Guid>.Empty)),
                RequiredSetupActionNames: Helpers.From(),
                RequiredMonitoringActions: ImmutableList<MonitoringRequirement>.Empty,
                RequiredCloseoutActionNames: Helpers.From())));

        static Person adult1 = new Person(guid1, null, true, "Bob", "Smith", Gender.Male, new ExactAge(new DateTime(2000, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);
        static Person adult2 = new Person(guid2, null, true, "Jane", "Smith", Gender.Female, new ExactAge(new DateTime(2000, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);
        static Person inactiveAdult3 = new Person(guid3, null, false, "BobDUPLICATE", "Smith", Gender.Male, new ExactAge(new DateTime(2000, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);
        static Person brotherNotInHousehold4 = new Person(guid2, null, true, "Eric", "Smith", Gender.Male, new ExactAge(new DateTime(2000, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);
        static Person child5 = new Person(guid5, null, true, "Wanda", "Smith", Gender.Female, new ExactAge(new DateTime(2022, 1, 1)), "",
            ImmutableList<Address>.Empty, null, ImmutableList<PhoneNumber>.Empty, null, ImmutableList<EmailAddress>.Empty, null, null, null);

        static Family family = new Family(guid0, guid1,
            ImmutableList<(Person, FamilyAdultRelationshipInfo)>.Empty
                .Add((adult1, new FamilyAdultRelationshipInfo("Dad", true)))
                .Add((adult2, new FamilyAdultRelationshipInfo("Mom", true)))
                /*.Add((inactiveAdult3, new FamilyAdultRelationshipInfo("Dad", true))) //TODO: Reenable
                .Add((brotherNotInHousehold4, new FamilyAdultRelationshipInfo("Brother", false)))*/, //TODO: Reenable
            ImmutableList<Person>.Empty
                .Add(child5),
            ImmutableList<CustodialRelationship>.Empty
                .Add(new CustodialRelationship(guid5, guid1, CustodialRelationshipType.ParentWithCustody))
                .Add(new CustodialRelationship(guid5, guid2, CustodialRelationshipType.ParentWithCustody)),
            ImmutableList<UploadedDocumentInfo>.Empty, ImmutableList<Guid>.Empty);


        [TestMethod]
        public void Test()
        {
            Assert.Inconclusive("Not implemented");
        }
    }
}
