using System;

namespace CareTogether.Managers.Records
{
    public enum RecentRecordType
    {
        Family,
        Referral,
        Organization,
    }

    public sealed record RecentRecordKey(RecentRecordType Type, Guid Id);

    public sealed record RecentRecord(RecentRecordKey Record, DateTimeOffset AccessedAtUtc);
}
