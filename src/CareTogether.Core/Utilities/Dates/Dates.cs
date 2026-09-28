using System;
using System.Globalization;
using System.Text.RegularExpressions;
using Newtonsoft.Json.Linq;

namespace CareTogether.Utilities.Dates
{
    public static class Dates
    {
        private static readonly Regex IsoDateTime = new(
            @"^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$",
            RegexOptions.CultureInvariant
        );

        internal static bool TryNormalizeDateTime(object value, out string? normalized)
        {
            var parsed = value switch
            {
                DateTime { Kind: not DateTimeKind.Unspecified } dateTime =>
                    new DateTimeOffset(dateTime),
                DateTimeOffset dateTimeOffset => dateTimeOffset,
                JValue
                {
                    Type: JTokenType.Date,
                    Value: DateTime { Kind: not DateTimeKind.Unspecified } dateTime,
                } => new DateTimeOffset(dateTime),
                JValue { Type: JTokenType.Date, Value: DateTimeOffset dateTimeOffset } =>
                    dateTimeOffset,
                string stringValue => ParseDateTime(stringValue),
                JValue { Type: JTokenType.String } jsonValue =>
                    ParseDateTime(jsonValue.Value<string>()!),
                _ => null,
            };

            normalized = parsed
                ?.ToUniversalTime()
                .ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);

            return normalized is not null;
        }

        private static DateTimeOffset? ParseDateTime(string dateTime) =>
            IsoDateTime.IsMatch(dateTime)
            && DateTimeOffset.TryParse(
                dateTime,
                CultureInfo.InvariantCulture,
                DateTimeStyles.RoundtripKind,
                out var parsed
            )
                ? parsed
                : null;

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
