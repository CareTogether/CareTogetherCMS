using System.Collections.Immutable;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Plivo;

namespace CareTogether.Utilities.Telephony
{
    public sealed class PlivoTelephony : ITelephony
    {
        // U+00AD is the soft hyphen.
        private static Regex phoneNumberFormat =
            new(@"^\(?([0-9]{3})\)?[\u00ad\-.\s]?([0-9]{3})[\u00ad\-.\s]?([0-9]{4})$");
        private static Regex validNonDigitCharacters = new(@"[\u00ad\-.\s\(\)]");

        private readonly PlivoApi api;

        public PlivoTelephony(string authId, string authToken)
        {
            api = new PlivoApi(authId, authToken);
        }

        public async Task<ImmutableList<SmsMessageResult>> SendSmsMessageAsync(
            string sourcePhoneNumber,
            ImmutableList<string> destinationPhoneNumbers,
            string message
        )
        {
            if (!TrySanitizePhoneNumber(sourcePhoneNumber, out var sanitizedSourcePhoneNumber))
                return destinationPhoneNumbers
                    .Select(number => new SmsMessageResult(number, SmsResult.InvalidSourcePhoneNumber))
                    .ToImmutableList();

            var destinationNumberSanitizationResults = destinationPhoneNumbers
                .Select(destinationNumber =>
                {
                    var isValid = TrySanitizePhoneNumber(destinationNumber, out var sanitizedNumber);
                    return (destinationNumber, isValid, sanitizedNumber);
                })
                .ToImmutableList();

            var sanitizedDestinationNumbers = destinationNumberSanitizationResults
                .Where(x => x.isValid)
                .Select(x => x.sanitizedNumber)
                .ToList();

            var response =
                sanitizedDestinationNumbers.Count > 0
                    ? await api.Message.CreateAsync(
                        dst: sanitizedDestinationNumbers,
                        text: message,
                        src: sanitizedSourcePhoneNumber,
                        type: "sms"
                    )
                    : null;

            var sendResults = destinationNumberSanitizationResults
                .Select(x =>
                {
                    if (!x.isValid)
                        return new SmsMessageResult(x.destinationNumber, SmsResult.InvalidDestinationPhoneNumber);

                    if (response?.StatusCode != 202)
                        return new SmsMessageResult(x.destinationNumber, SmsResult.SendFailure);

                    if (response?.invalid_number?.Contains(x.sanitizedNumber) ?? false)
                        return new SmsMessageResult(x.destinationNumber, SmsResult.InvalidDestinationPhoneNumber);

                    return new SmsMessageResult(x.destinationNumber, SmsResult.SendSuccess);
                })
                .ToImmutableList();

            return sendResults;
        }

        internal static bool TrySanitizePhoneNumber(string input, out string sanitizedOutput)
        {
            sanitizedOutput = string.Empty;

            if (string.IsNullOrWhiteSpace(input))
                return false;

            if (!phoneNumberFormat.IsMatch(input))
                return false;

            sanitizedOutput = "+1" + validNonDigitCharacters.Replace(input, string.Empty);

            return true;
        }
    }
}
