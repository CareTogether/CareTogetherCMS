using System;
using System.Globalization;
using System.Text.RegularExpressions;
using CareTogether.Resources.Policies;
using Newtonsoft.Json.Linq;

namespace CareTogether.Resources
{
    public static class CustomFieldValue
    {
        private const string DateOnlyFormat = "yyyy-MM-dd";

        private static readonly Regex IsoDateTime = new(
            @"^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$",
            RegexOptions.CultureInvariant
        );

        public static object? Normalize(CustomFieldType customFieldType, object? value) =>
            value is null
                ? null
                : customFieldType switch
                {
                    CustomFieldType.DateOnly => NormalizeDateOnly(value),
                    CustomFieldType.DateTime => NormalizeDateTime(value),
                    _ => value,
                };

        private static string NormalizeDateOnly(object value)
        {
            var dateOnly = RequireString(value, "DateOnly");

            if (
                !DateOnly.TryParseExact(
                    dateOnly,
                    DateOnlyFormat,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.None,
                    out var parsed
                )
            )
            {
                throw new InvalidOperationException("DateOnly custom field values must use YYYY-MM-DD.");
            }

            return parsed.ToString(DateOnlyFormat, CultureInfo.InvariantCulture);
        }

        private static string NormalizeDateTime(object value)
        {
            var dateTime = RequireString(value, "DateTime");

            if (
                !IsoDateTime.IsMatch(dateTime)
                || !DateTimeOffset.TryParse(
                    dateTime,
                    CultureInfo.InvariantCulture,
                    DateTimeStyles.RoundtripKind,
                    out var parsed
                )
            )
            {
                throw new InvalidOperationException(
                    "DateTime custom field values must be ISO 8601 timestamps with a timezone offset."
                );
            }

            return parsed
                .ToUniversalTime()
                .ToString("yyyy-MM-dd'T'HH:mm:ss.fff'Z'", CultureInfo.InvariantCulture);
        }

        private static string RequireString(object value, string customFieldType) =>
            value switch
            {
                string stringValue => stringValue,
                JValue { Type: JTokenType.String } jsonValue => jsonValue.Value<string>()!,
                _ => throw new InvalidOperationException(
                    $"{customFieldType} custom field values must be strings."
                ),
            };
    }
}
