using System;
using System.Collections.Generic;
using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace CareTogether.TestData
{
    public static class TestStorageHelper
    {
        static readonly Guid _Guid1 = Id('1');

        public static void ResetTestTenantData(BlobServiceClient blobServiceClient)
        {
            string? organizationId = _Guid1.ToString();
            BlobContainerClient? tenantContainer = blobServiceClient.GetBlobContainerClient(organizationId);

            tenantContainer.CreateIfNotExists();

            foreach (Page<BlobItem>? blobPage in tenantContainer.GetBlobs().AsPages())
            {
                foreach (BlobItem? blob in blobPage.Values)
                {
                    tenantContainer.DeleteBlobIfExists(blob.Name, DeleteSnapshotsOption.IncludeSnapshots);
                }
            }

            //TODO: Fix the following logic so it works properly in Azure as well (API issue)
            if (blobServiceClient.AccountName == "devstoreaccount1")
            {
                blobServiceClient.SetProperties(
                    new BlobServiceProperties
                    {
                        Cors = new List<BlobCorsRule>
                        {
                            new()
                            {
                                AllowedHeaders = "*",
                                AllowedMethods = "GET,PUT",
                                AllowedOrigins = "http://localhost:3000",
                                ExposedHeaders = "*",
                                MaxAgeInSeconds = 10,
                            },
                        },
                        Logging = new BlobAnalyticsLogging { Version = "1.0" },
                    }
                );
            }
        }

        static Guid Id(char x)
        {
            return Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        }
    }
}
