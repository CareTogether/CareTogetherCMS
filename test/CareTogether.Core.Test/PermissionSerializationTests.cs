using System.Linq;
using Microsoft.VisualStudio.TestTools.UnitTesting;
using Newtonsoft.Json;

namespace CareTogether.Core.Test
{
    [TestClass]
    public sealed class PermissionSerializationTests
    {
        [TestMethod]
        public void OrganizationPermissionsRetainTheirPersistedValues()
        {
            var permissions = new[]
            {
                Permission.AccessOrganizationsScreen,
                Permission.CreateOrganization,
                Permission.EditOrganization,
                Permission.DeleteOrganization,
                Permission.EditOrganizationMemberFamilies,
                Permission.EditOrganizationRoleAssignments,
                Permission.ViewOrganizationDocumentMetadata,
                Permission.ReadOrganizationDocuments,
                Permission.UploadOrganizationDocuments,
                Permission.DeleteOrganizationDocuments,
            };

            CollectionAssert.AreEqual(
                new[] { 104, 500, 501, 502, 503, 504, 505, 506, 507, 508 },
                permissions.Select(permission => (int)permission).ToArray()
            );
        }

        [TestMethod]
        public void PermissionsUseNumericJsonSerialization()
        {
            var serialized = JsonConvert.SerializeObject(Permission.CreateOrganization);
            var deserialized = JsonConvert.DeserializeObject<Permission>("500");

            Assert.AreEqual("500", serialized);
            Assert.AreEqual(Permission.CreateOrganization, deserialized);
        }
    }
}
