using System;

namespace CareTogether
{
    public static class SystemConstants
    {
        /// <summary>
        /// Reserved user identifier for CareTogether system-initiated actions
        /// </summary>
        public static Guid SystemUserId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        /// <summary>
        /// Reserved role name for organization admins with automatic full access
        /// </summary>
        public const string ORGANIZATION_ADMINISTRATOR = "OrganizationAdministrator";
    }
}
