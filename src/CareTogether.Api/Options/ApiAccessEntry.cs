using System;

namespace CareTogether.Api
{
    public enum DataDisclosure
    {
        Anonymized,
        FullDisclosure,
    }

    public sealed class ApiAccessEntry
    {
        public required string Username { get; set; } 
        public required string ApiKey { get; set; } 
        public DataDisclosure DataDisclosure { get; set; }
    }
}
