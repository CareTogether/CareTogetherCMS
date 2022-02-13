using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
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
            //TODO: Figure out why this fails.
            //blobServiceClient.SetProperties(new BlobServiceProperties
            //{
            //    Cors = new System.Collections.Generic.List<BlobCorsRule> { new BlobCorsRule
            //    {
            //        AllowedHeaders = "https://app.caretogether.io:443",
            //        AllowedMethods = "GET,PUT",
            //        AllowedOrigins = "*",
            //        ExposedHeaders = "*",
            //        MaxAgeInSeconds = 5
            //    } }
            //});
        }

        private static Guid Id(char x) => Guid.Parse("xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".Replace('x', x));
        static readonly Guid guid1 = Id('1');
    }
}
