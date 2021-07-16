using Azure.Storage.Blobs;
using System;

namespace CareTogether.TestData
{
    public static class TestStorageHelper
    {
        public static void ResetTestTenantData(BlobServiceClient blobServiceClient)
        {
            var organizationId = guid1.ToString();
            var tenantContainer = blobServiceClient.GetBlobContainerClient(organizationId);
            tenantContainer.DeleteIfExists();
            tenantContainer.Create();
        }

        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid1 = Id('1');
    }
}
