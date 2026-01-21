using System.Collections.Immutable;
using System.Linq;
using CareTogether.Engines.PolicyEvaluation;
using CareTogether.Resources.Policies;
using Microsoft.VisualStudio.TestTools.UnitTesting;

namespace CareTogether.Core.Test.ApprovalCalculationTests
{
    [TestClass]
    public class GetRequirementNameWithSynonymsTest
    {
        [TestMethod]
        public void NoActionDefinition_ReturnsOriginalName()
        {
            var locationPolicy = new EffectiveLocationPolicy(
                ActionDefinitions: ImmutableDictionary<string, ActionRequirement>.Empty,
                CustomFamilyFields: ImmutableList<CustomField>.Empty,
                ReferralPolicy: new V1CasePolicy(
                    ImmutableList<string>.Empty,
                    ImmutableList<CustomField>.Empty,
                    ImmutableList<ArrangementPolicy>.Empty,
                    ImmutableList<FunctionPolicy>.Empty
                ),
                VolunteerPolicy: new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );

            var result = SharedCalculations.GetRequirementNameWithSynonyms(
                locationPolicy,
                "NonExistentAction"
            );

            Assert.AreEqual(1, result.Count);
            Assert.AreEqual("NonExistentAction", result[0]);
        }

        [TestMethod]
        public void ExactKeyMatch_ReturnsKeyAndAlternates()
        {
            var actionDefinitions = ImmutableDictionary<string, ActionRequirement>.Empty.Add(
                "PrimaryAction",
                new ActionRequirement(
                    DocumentLink: DocumentLinkRequirement.None,
                    NoteEntry: NoteEntryRequirement.None,
                    Instructions: null,
                    InfoLink: null,
                    Validity: null,
                    CanView: null,
                    CanEdit: null,
                    AlternateNames: ImmutableList.Create("AltName1", "AltName2")
                )
            );

            var locationPolicy = new EffectiveLocationPolicy(
                ActionDefinitions: actionDefinitions,
                CustomFamilyFields: ImmutableList<CustomField>.Empty,
                ReferralPolicy: new V1CasePolicy(
                    ImmutableList<string>.Empty,
                    ImmutableList<CustomField>.Empty,
                    ImmutableList<ArrangementPolicy>.Empty,
                    ImmutableList<FunctionPolicy>.Empty
                ),
                VolunteerPolicy: new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );

            var result = SharedCalculations.GetRequirementNameWithSynonyms(
                locationPolicy,
                "PrimaryAction"
            );

            Assert.IsTrue(result.Contains("PrimaryAction"));
            Assert.IsTrue(result.Contains("AltName1"));
            Assert.IsTrue(result.Contains("AltName2"));
        }

        [TestMethod]
        public void AlternateNameMatch_ReturnsKeyAndAlternates()
        {
            var actionDefinitions = ImmutableDictionary<string, ActionRequirement>.Empty.Add(
                "PrimaryAction",
                new ActionRequirement(
                    DocumentLink: DocumentLinkRequirement.None,
                    NoteEntry: NoteEntryRequirement.None,
                    Instructions: null,
                    InfoLink: null,
                    Validity: null,
                    CanView: null,
                    CanEdit: null,
                    AlternateNames: ImmutableList.Create("AltName1", "AltName2")
                )
            );

            var locationPolicy = new EffectiveLocationPolicy(
                ActionDefinitions: actionDefinitions,
                CustomFamilyFields: ImmutableList<CustomField>.Empty,
                ReferralPolicy: new V1CasePolicy(
                    ImmutableList<string>.Empty,
                    ImmutableList<CustomField>.Empty,
                    ImmutableList<ArrangementPolicy>.Empty,
                    ImmutableList<FunctionPolicy>.Empty
                ),
                VolunteerPolicy: new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );

            var result = SharedCalculations.GetRequirementNameWithSynonyms(
                locationPolicy,
                "AltName1"
            );

            Assert.IsTrue(result.Contains("PrimaryAction"));
            Assert.IsTrue(result.Contains("AltName1"));
            Assert.IsTrue(result.Contains("AltName2"));
        }

        [TestMethod]
        public void ExactKeyMatch_TakesPriorityOverAlternateName()
        {
            // This is the bug fix test case:
            // - Action "Confidentiality" has alternate name "Confidentiality & Corporal"
            // - Action "Confidentiality & Corporal" exists as a separate action
            // - When looking up "Confidentiality & Corporal", should return the exact match
            var actionDefinitions = ImmutableDictionary<string, ActionRequirement>
                .Empty.Add(
                    "Confidentiality",
                    new ActionRequirement(
                        DocumentLink: DocumentLinkRequirement.None,
                        NoteEntry: NoteEntryRequirement.None,
                        Instructions: null,
                        InfoLink: null,
                        Validity: null,
                        CanView: null,
                        CanEdit: null,
                        AlternateNames: ImmutableList.Create("Confidentiality & Corporal")
                    )
                )
                .Add(
                    "Confidentiality & Corporal",
                    new ActionRequirement(
                        DocumentLink: DocumentLinkRequirement.None,
                        NoteEntry: NoteEntryRequirement.None,
                        Instructions: null,
                        InfoLink: null,
                        Validity: null,
                        CanView: null,
                        CanEdit: null,
                        AlternateNames: null
                    )
                );

            var locationPolicy = new EffectiveLocationPolicy(
                ActionDefinitions: actionDefinitions,
                CustomFamilyFields: ImmutableList<CustomField>.Empty,
                ReferralPolicy: new V1CasePolicy(
                    ImmutableList<string>.Empty,
                    ImmutableList<CustomField>.Empty,
                    ImmutableList<ArrangementPolicy>.Empty,
                    ImmutableList<FunctionPolicy>.Empty
                ),
                VolunteerPolicy: new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );

            var result = SharedCalculations.GetRequirementNameWithSynonyms(
                locationPolicy,
                "Confidentiality & Corporal"
            );

            // The result should contain "Confidentiality & Corporal"
            Assert.IsTrue(result.Contains("Confidentiality & Corporal"));

            // The result should NOT contain "Confidentiality" because we matched
            // the exact key "Confidentiality & Corporal", not the alternate name
            Assert.IsFalse(result.Contains("Confidentiality"));

            // The result should only have one item (the deduplicated key)
            Assert.AreEqual(1, result.Count);
        }

        [TestMethod]
        public void LookupConfidentiality_ReturnsConfidentialityAndAlternates()
        {
            // When looking up "Confidentiality", should return that action and its alternates
            var actionDefinitions = ImmutableDictionary<string, ActionRequirement>
                .Empty.Add(
                    "Confidentiality",
                    new ActionRequirement(
                        DocumentLink: DocumentLinkRequirement.None,
                        NoteEntry: NoteEntryRequirement.None,
                        Instructions: null,
                        InfoLink: null,
                        Validity: null,
                        CanView: null,
                        CanEdit: null,
                        AlternateNames: ImmutableList.Create("Confidentiality & Corporal")
                    )
                )
                .Add(
                    "Confidentiality & Corporal",
                    new ActionRequirement(
                        DocumentLink: DocumentLinkRequirement.None,
                        NoteEntry: NoteEntryRequirement.None,
                        Instructions: null,
                        InfoLink: null,
                        Validity: null,
                        CanView: null,
                        CanEdit: null,
                        AlternateNames: null
                    )
                );

            var locationPolicy = new EffectiveLocationPolicy(
                ActionDefinitions: actionDefinitions,
                CustomFamilyFields: ImmutableList<CustomField>.Empty,
                ReferralPolicy: new V1CasePolicy(
                    ImmutableList<string>.Empty,
                    ImmutableList<CustomField>.Empty,
                    ImmutableList<ArrangementPolicy>.Empty,
                    ImmutableList<FunctionPolicy>.Empty
                ),
                VolunteerPolicy: new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );

            var result = SharedCalculations.GetRequirementNameWithSynonyms(
                locationPolicy,
                "Confidentiality"
            );

            // The result should contain both the primary name and the alternate
            Assert.IsTrue(result.Contains("Confidentiality"));
            Assert.IsTrue(result.Contains("Confidentiality & Corporal"));
        }

        [TestMethod]
        public void LookupAlternateName_InputNameIsFirstInResults()
        {
            // When looking up "Confidentiality", should return that action and its alternates
            var actionDefinitions = ImmutableDictionary<string, ActionRequirement>
                .Empty.Add(
                    "Confidentiality",
                    new ActionRequirement(
                        DocumentLink: DocumentLinkRequirement.None,
                        NoteEntry: NoteEntryRequirement.None,
                        Instructions: null,
                        InfoLink: null,
                        Validity: null,
                        CanView: null,
                        CanEdit: null,
                        AlternateNames: ImmutableList
                            .Create("Confidentiality & Corporal")
                            .Add("Confidentiality Alt Name")
                    )
                )
                .Add(
                    "Confidentiality & Corporal",
                    new ActionRequirement(
                        DocumentLink: DocumentLinkRequirement.None,
                        NoteEntry: NoteEntryRequirement.None,
                        Instructions: null,
                        InfoLink: null,
                        Validity: null,
                        CanView: null,
                        CanEdit: null,
                        AlternateNames: null
                    )
                );

            var locationPolicy = new EffectiveLocationPolicy(
                ActionDefinitions: actionDefinitions,
                CustomFamilyFields: ImmutableList<CustomField>.Empty,
                ReferralPolicy: new V1CasePolicy(
                    ImmutableList<string>.Empty,
                    ImmutableList<CustomField>.Empty,
                    ImmutableList<ArrangementPolicy>.Empty,
                    ImmutableList<FunctionPolicy>.Empty
                ),
                VolunteerPolicy: new VolunteerPolicy(
                    ImmutableDictionary<string, VolunteerRolePolicy>.Empty,
                    ImmutableDictionary<string, VolunteerFamilyRolePolicy>.Empty
                )
            );

            var result = SharedCalculations.GetRequirementNameWithSynonyms(
                locationPolicy,
                "Confidentiality Alt Name"
            );

            // The result should contain both the primary name and the alternate
            Assert.IsTrue(result.First() == "Confidentiality Alt Name");
        }
    }
}
