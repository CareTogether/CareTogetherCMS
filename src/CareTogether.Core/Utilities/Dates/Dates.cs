using System;

namespace CareTogether.Utilities.Dates
{
    public static class Dates
    {
        internal static DateTime ToLocationTimeZone(
            DateTime dateTime,
            TimeZoneInfo locationTimeZone
        )
        {
            return TimeZoneInfo.ConvertTimeFromUtc(dateTime, locationTimeZone);
        }

        internal static DateTime? ToLocationTimeZone(
            DateTime? dateTime,
            TimeZoneInfo locationTimeZone
        )
        {
            if (!dateTime.HasValue)
            {
                return null;
            }

            return TimeZoneInfo.ConvertTimeFromUtc(dateTime.Value, locationTimeZone);
        }

        internal static DateOnly ToDateOnlyInLocationTimeZone(
            DateTime dateTime,
            TimeZoneInfo locationTimeZone
        )
        {
            return DateOnly.FromDateTime(ToLocationTimeZone(dateTime, locationTimeZone));
        }

        internal static DateOnly? ToDateOnlyInLocationTimeZone(
            DateTime? dateTime,
            TimeZoneInfo locationTimeZone
        )
        {
            if (!dateTime.HasValue)
            {
                return null;
            }

            return DateOnly.FromDateTime(ToLocationTimeZone(dateTime.Value, locationTimeZone));
        }
    }
}
