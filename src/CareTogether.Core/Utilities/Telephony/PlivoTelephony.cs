using System.Collections.Generic;
using System.Collections.Immutable;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Plivo;
using Plivo.Resource.Message;

namespace CareTogether.Utilities.Telephony
{
    public sealed class PlivoTelephony : ITelephony
    {
        // U+00AD is the soft hyphen.
        static readonly Regex _PhoneNumberFormat =
            new(@"^\(?([0-9]{3})\)?[\u00ad\-.\s]?([0-9]{3})[\u00ad\-.\s]?([0-9]{4})$");

        static readonly Regex _ValidNonDigitCharacters = new(@"[\u00ad\-.\s\(\)]");

        readonly PlivoApi _Api;

        public PlivoTelephony(string authId, string authToken)
        {
            _Api = new PlivoApi(authId, authToken);
        }

        public async Task<ImmutableList<SmsMessageResult>> SendSmsMessageAsync(
            string sourcePhoneNumber,
            ImmutableList<string> destinationPhoneNumbers,
            string message
        )
        {
            if (!TrySanitizePhoneNumber(sourcePhoneNumber, out string? sanitizedSourcePhoneNumber))
            {
                return destinationPhoneNumbers
                    .Select(number => new SmsMessageResult(number, SmsResult.InvalidSourcePhoneNumber))
                    .ToImmutableList();
            }

            ImmutableList<(
                string destinationNumber,
                bool isValid,
                string sanitizedNumber
            )> destinationNumberSanitizationResults = destinationPhoneNumbers
                .Select(destinationNumber =>
                {
                    bool isValid = TrySanitizePhoneNumber(destinationNumber, out string? sanitizedNumber);
                    return (destinationNumber, isValid, sanitizedNumber);
                })
                .ToImmutableList();

            List<string> sanitizedDestinationNumbers = destinationNumberSanitizationResults
                .Where(x => x.isValid)
                .Select(x => x.sanitizedNumber)
                .ToList();

            MessageCreateResponse? response =
                sanitizedDestinationNumbers.Count > 0
                    ? await _Api.Message.CreateAsync(
                        sanitizedDestinationNumbers,
                        message,
                        sanitizedSourcePhoneNumber,
                        "sms"
                    )
                    : null;

            ImmutableList<SmsMessageResult> sendResults = destinationNumberSanitizationResults
                .Select(x =>
                {
                    if (!x.isValid)
                    {
                        return new SmsMessageResult(x.destinationNumber, SmsResult.InvalidDestinationPhoneNumber);
                    }

                    if (response?.StatusCode != 202)
                    {
                        return new SmsMessageResult(x.destinationNumber, SmsResult.SendFailure);
                    }

                    if (response?.invalid_number?.Contains(x.sanitizedNumber) ?? false)
                    {
                        return new SmsMessageResult(x.destinationNumber, SmsResult.InvalidDestinationPhoneNumber);
                    }

                    return new SmsMessageResult(x.destinationNumber, SmsResult.SendSuccess);
                })
                .ToImmutableList();

            return sendResults;
        }

        internal static bool TrySanitizePhoneNumber(string input, out string sanitizedOutput)
        {
            sanitizedOutput = string.Empty;

            if (string.IsNullOrWhiteSpace(input))
            {
                return false;
            }

            if (!_PhoneNumberFormat.IsMatch(input))
            {
                return false;
            }

            sanitizedOutput = "+1" + _ValidNonDigitCharacters.Replace(input, string.Empty);

            return true;
        }
    }
}
