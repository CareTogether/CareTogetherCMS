using System;

namespace CareTogether.Api
{
    public sealed class MembershipOptions
    {
        public const string Membership = "Membership";

        public string PersonInviteLinkFormat { get; set; } = string.Empty;

        public string PersonInviteRedirectFormat { get; set; } = string.Empty;

        public string[] TombstonedOrganizations { get; set; } = Array.Empty<string>();
    }
}
