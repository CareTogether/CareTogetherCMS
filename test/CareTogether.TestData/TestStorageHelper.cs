using System;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace CareTogether.TestData
{
    public static class TestStorageHelper
    {
        public static void ResetTestTenantData(BlobServiceClient blobServiceClient)
        {
            var organizationId = guid1.ToString();
            var tenantContainer = blobServiceClient.GetBlobContainerClient(organizationId);

            tenantContainer.CreateIfNotExists();

            foreach (var blobPage in tenantContainer.GetBlobs().AsPages())
                foreach (var blob in blobPage.Values)
                    tenantContainer.DeleteBlobIfExists(blob.Name, DeleteSnapshotsOption.IncludeSnapshots);

            //TODO: Fix the following logic so it works properly in Azure as well (API issue)
            if (blobServiceClient.AccountName == "devstoreaccount1")
            {
                blobServiceClient.SetProperties(new BlobServiceProperties
                {
                    Cors = new System.Collections.Generic.List<BlobCorsRule> { new BlobCorsRule
                {
                    AllowedHeaders = "*",
                    AllowedMethods = "GET,PUT",
                    AllowedOrigins = "http://localhost:3000",
                    ExposedHeaders = "*",
                    MaxAgeInSeconds = 10
                } },
                    Logging = new BlobAnalyticsLogging
                    {
                        Version = "1.0"
                    }
                });
            }
        }

        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid1 = Id('1');
    }
}
