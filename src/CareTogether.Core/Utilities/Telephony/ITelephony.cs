using System.Collections.Immutable;
using System.Threading.Tasks;

namespace CareTogether.Utilities.Telephony
{
    public sealed record SmsMessageResult(string PhoneNumber, SmsResult Result);

    public enum SmsResult
    {
        InvalidSourcePhoneNumber,
        InvalidDestinationPhoneNumber,
        SendFailure,
        SendSuccess,
    }

    public interface ITelephony
    {
        Task<ImmutableList<SmsMessageResult>> SendSmsMessageAsync(
            string sourcePhoneNumber,
            ImmutableList<string> destinationPhoneNumbers,
            string message
        );
    }
}
