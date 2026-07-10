// ----------------------------------------------------------------------------
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
// ----------------------------------------------------------------------------

namespace CareTogether.Api.Controllers.AppOwnsData.Services
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Runtime.InteropServices;
    using System.Threading.Tasks;
    using AppOwnsData.Models;
    using Microsoft.PowerBI.Api;
    using Microsoft.PowerBI.Api.Models;

    public class PbiEmbedService
    {
        private readonly AadService aadService;
        private readonly string powerBiApiUrl = "https://api.powerbi.com";

        public PbiEmbedService(AadService aadService)
        {
            this.aadService = aadService;
        }

        /// <summary>
        /// Get Power BI client
        /// </summary>
        /// <returns>Power BI client object</returns>
        public async Task<PowerBIClient> GetPowerBIClient()
        {
            var accessToken = await aadService.GetAccessToken();
            return new PowerBIClient(accessToken, new Uri(powerBiApiUrl));
        }

        /// <summary>
        /// Get embed params for a report
        /// </summary>
        /// <returns>Wrapper object containing Embed token, Embed URL, Report Id, and Report name for single report</returns>
        public async Task<EmbedParams> GetEmbedParams(
            Guid workspaceId,
            Guid reportId,
            Guid userId,
            [Optional] Guid additionalDatasetId
        )
        {
            PowerBIClient pbiClient = await this.GetPowerBIClient();

            // Get report info
            var pbiReport = pbiClient.Reports.GetReportInGroup(workspaceId, reportId).Value;

            //  Check if dataset is present for the corresponding report
            //  If isRDLReport is true then it is a RDL Report
            var isRDLReport = String.IsNullOrEmpty(pbiReport.DatasetId);

            EmbedToken embedToken;

            // Generate embed token for RDL report if dataset is not present
            if (isRDLReport)
            {
                // Get Embed token for RDL Report
                embedToken = await GetEmbedTokenForRDLReport(workspaceId, reportId);
            }
            else
            {
                // Create list of datasets
                var datasetIds = new List<Guid>();

                // Add dataset associated to the report
                datasetIds.Add(Guid.Parse(pbiReport.DatasetId));

                // Append additional dataset to the list to achieve dynamic binding later
                if (additionalDatasetId != Guid.Empty)
                {
                    datasetIds.Add(additionalDatasetId);
                }

                // Get Embed token multiple resources
                embedToken = await GetEmbedToken(reportId, datasetIds, userId, workspaceId);
            }

            // Add report data for embedding
            var embedReports = new List<EmbedReport>()
            {
                new EmbedReport
                {
                    ReportId = pbiReport.Id,
                    ReportName = pbiReport.Name,
                    EmbedUrl = pbiReport.EmbedUrl,
                },
            };

            // Capture embed params
            var embedParams = new EmbedParams
            {
                EmbedReport = embedReports,
                Type = "Report",
                EmbedToken = embedToken,
            };

            return embedParams;
        }

        /// <summary>
        /// Get embed params for multiple reports for a single workspace
        /// </summary>
        /// <returns>Wrapper object containing Embed token, Embed URL, Report Id, and Report name for multiple reports</returns>
        /// <remarks>This function is not supported for RDL Report</remakrs>
        public async Task<EmbedParams> GetEmbedParams(
            Guid workspaceId,
            IList<Guid> reportIds,
            Guid userId,
            [Optional] IList<Guid> additionalDatasetIds
        )
        {
            // Note: This method is an example and is not consumed in this sample app

            PowerBIClient pbiClient = await this.GetPowerBIClient();

            // Create mapping for reports and Embed URLs
            var embedReports = new List<EmbedReport>();

            // Create list of datasets
            var datasetIds = new List<Guid>();

            // Get datasets and Embed URLs for all the reports
            foreach (var reportId in reportIds)
            {
                // Get report info
                var pbiReport = pbiClient.Reports.GetReportInGroup(workspaceId, reportId).Value;

                datasetIds.Add(Guid.Parse(pbiReport.DatasetId));

                // Add report data for embedding
                embedReports.Add(
                    new EmbedReport
                    {
                        ReportId = pbiReport.Id,
                        ReportName = pbiReport.Name,
                        EmbedUrl = pbiReport.EmbedUrl,
                    }
                );
            }

            // Append to existing list of datasets to achieve dynamic binding later
            if (additionalDatasetIds != null)
            {
                datasetIds.AddRange(additionalDatasetIds);
            }

            // Get Embed token multiple resources
            var embedToken = await GetEmbedToken(reportIds, datasetIds, workspaceId, userId);

            // Capture embed params
            var embedParams = new EmbedParams
            {
                EmbedReport = embedReports,
                Type = "Report",
                EmbedToken = embedToken,
            };

            return embedParams;
        }

        /// <summary>
        /// Get Embed token for single report, multiple datasets, and an optional target workspace
        /// </summary>
        /// <returns>Embed token</returns>
        /// <remarks>This function is not supported for RDL Report</remakrs>
        public async Task<EmbedToken> GetEmbedToken(
            Guid reportId,
            IList<Guid> datasetIds,
            Guid userId,
            [Optional] Guid targetWorkspaceId
        )
        {
            PowerBIClient pbiClient = await this.GetPowerBIClient();

            // Create a request for getting Embed token
            // This method works only with new Power BI V2 workspace experience
            var tokenRequest = CreateGenerateTokenRequest(
                reports: [new GenerateTokenRequestV2Report(reportId)],
                datasets: datasetIds
                    .Select(datasetId => new GenerateTokenRequestV2Dataset(datasetId.ToString()))
                    .ToList(),
                targetWorkspaces: targetWorkspaceId != Guid.Empty
                    ? [new GenerateTokenRequestV2TargetWorkspace(targetWorkspaceId)]
                    : [],
                identities: [CreateEffectiveIdentity(userId, datasetIds, ["Dynamic"])]
            );

            // Generate Embed token
            var embedToken = pbiClient.EmbedToken.GenerateToken(tokenRequest);

            return embedToken;
        }

        /// <summary>
        /// Get Embed token for multiple reports, datasets, and an optional target workspace
        /// </summary>
        /// <returns>Embed token</returns>
        /// <remarks>This function is not supported for RDL Report</remakrs>
        public async Task<EmbedToken> GetEmbedToken(
            IList<Guid> reportIds,
            IList<Guid> datasetIds,
            Guid userId,
            [Optional] Guid targetWorkspaceId
        )
        {
            // Note: This method is an example and is not consumed in this sample app

            PowerBIClient pbiClient = await this.GetPowerBIClient();

            // Convert report Ids to required types
            var reports = reportIds
                .Select(reportId => new GenerateTokenRequestV2Report(reportId))
                .ToList();

            // Convert dataset Ids to required types
            var datasets = datasetIds
                .Select(datasetId => new GenerateTokenRequestV2Dataset(datasetId.ToString()))
                .ToList();

            // Create a request for getting Embed token
            // This method works only with new Power BI V2 workspace experience
            var tokenRequest = CreateGenerateTokenRequest(
                reports,
                datasets,
                targetWorkspaceId != Guid.Empty
                    ? [new GenerateTokenRequestV2TargetWorkspace(targetWorkspaceId)]
                    : [],
                [CreateEffectiveIdentity(userId, datasetIds, [])]
            );

            // Generate Embed token
            var embedToken = pbiClient.EmbedToken.GenerateToken(tokenRequest);

            return embedToken;
        }

        /// <summary>
        /// Get Embed token for multiple reports, datasets, and optional target workspaces
        /// </summary>
        /// <returns>Embed token</returns>
        /// <remarks>This function is not supported for RDL Report</remakrs>
        public async Task<EmbedToken> GetEmbedToken(
            IList<Guid> reportIds,
            IList<Guid> datasetIds,
            Guid userId,
            [Optional] IList<Guid> targetWorkspaceIds
        )
        {
            // Note: This method is an example and is not consumed in this sample app

            PowerBIClient pbiClient = await this.GetPowerBIClient();

            // Convert report Ids to required types
            var reports = reportIds
                .Select(reportId => new GenerateTokenRequestV2Report(reportId))
                .ToList();

            // Convert dataset Ids to required types
            var datasets = datasetIds
                .Select(datasetId => new GenerateTokenRequestV2Dataset(datasetId.ToString()))
                .ToList();

            // Convert target workspace Ids to required types
            var targetWorkspaces =
                targetWorkspaceIds
                    ?.Select(targetWorkspaceId => new GenerateTokenRequestV2TargetWorkspace(
                        targetWorkspaceId
                    ))
                    .ToList() ?? [];

            // Create a request for getting Embed token
            // This method works only with new Power BI V2 workspace experience
            var tokenRequest = CreateGenerateTokenRequest(
                reports,
                datasets,
                targetWorkspaces,
                [CreateEffectiveIdentity(userId, datasetIds, [])]
            );

            // Generate Embed token
            var embedToken = pbiClient.EmbedToken.GenerateToken(tokenRequest);

            return embedToken;
        }

        /// <summary>
        /// Get Embed token for RDL Report
        /// </summary>
        /// <returns>Embed token</returns>
        public async Task<EmbedToken> GetEmbedTokenForRDLReport(
            Guid targetWorkspaceId,
            Guid reportId,
            string accessLevel = "view"
        )
        {
            PowerBIClient pbiClient = await this.GetPowerBIClient();

            // Generate token request for RDL Report
            var generateTokenRequestParameters = new GenerateTokenRequest
            {
                AccessLevel = Enum.Parse<TokenAccessLevel>(accessLevel, ignoreCase: true),
            };

            // Generate Embed token
            var embedToken = pbiClient.Reports.GenerateTokenInGroup(
                targetWorkspaceId,
                reportId,
                generateTokenRequestParameters
            );

            return embedToken;
        }

        private static GenerateTokenRequestV2 CreateGenerateTokenRequest(
            IEnumerable<GenerateTokenRequestV2Report> reports,
            IEnumerable<GenerateTokenRequestV2Dataset> datasets,
            IEnumerable<GenerateTokenRequestV2TargetWorkspace> targetWorkspaces,
            IEnumerable<EffectiveIdentity> identities
        )
        {
            var request = new GenerateTokenRequestV2();

            foreach (var report in reports)
                request.Reports.Add(report);

            foreach (var dataset in datasets)
                request.Datasets.Add(dataset);

            foreach (var targetWorkspace in targetWorkspaces)
                request.TargetWorkspaces.Add(targetWorkspace);

            foreach (var identity in identities)
                request.Identities.Add(identity);

            return request;
        }

        private static EffectiveIdentity CreateEffectiveIdentity(
            Guid userId,
            IEnumerable<Guid> datasetIds,
            IEnumerable<string> roles
        )
        {
            var identity = new EffectiveIdentity { Username = userId.ToString() };

            foreach (var datasetId in datasetIds)
                identity.Datasets.Add(datasetId.ToString());

            foreach (var role in roles)
                identity.Roles.Add(role);

            return identity;
        }
    }
}
