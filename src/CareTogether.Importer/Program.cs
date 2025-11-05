using System.Collections.Immutable;
using System.Globalization;
using Newtonsoft.Json;
using CareTogether;
using CareTogether.Resources;
using CareTogether.Resources.Communities;
using CareTogether.Resources.Directory;

namespace CareTogether.Importer;

// Immutable record types for CSV data
public record CommunityData(
    Guid OrganizationId,
    Guid LocationId,
    Guid CommunityId,
    string Name,
    string Status);

public record FamilyData(
    Guid OrganizationId,
    Guid LocationId,
    Guid FamilyId,
    string Name,
    string Email,
    string Phone,
    string AddressLine1,
    string AddressLine2,
    string PostalCode,
    Guid? HomeChurchId,
    string HomeChurch,
    string City,
    string County,
    string State,
    string Status);

public record PersonData(
    Guid OrganizationId,
    Guid LocationId,
    Guid FamilyId,
    Guid PersonId,
    string FirstName,
    string LastName,
    string PersonType,
    Gender? Gender,
    DateTime? BirthDate);

public record EventsByLocation<T>(ImmutableDictionary<Guid, ImmutableList<T>> Events);

public record ProcessingResult(
    ImmutableDictionary<Guid, string> Locations,
    ImmutableList<CommunityData> Communities,
    EventsByLocation<CommunityCommandExecutedEvent> CommunityEvents,
    EventsByLocation<DirectoryEvent> DirectoryEvents);

public record DirectoryEventWithLocation(Guid LocationId, DirectoryEvent Event);

/// <summary>
/// This application maps CSV files from data_to_import/ to CareTogether events and outputs them as JSON.
/// Usage: dotnet run [output-file.json]
/// </summary>
public class Program
{
    private static readonly Guid SystemUserId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
    private static readonly DateTime ImportTimestamp = DateTime.UtcNow;
    private static readonly JsonSerializerSettings JsonSettings = new()
    {
        Formatting = Formatting.None,
        StringEscapeHandling = StringEscapeHandling.Default
    };
    
    // Pure functions for mapping
    private static Gender? MapGender(string genderCode) => genderCode switch
    {
        "1" => Gender.Male,
        "2" => Gender.Female,
        _ => null
    };

    private static bool IsAdult(string personType) => personType?.ToLower() == "adult";

    public static async Task Main(string[] args)
    {
        try
        {
            var dataDirectory = "./data_to_import";
            
            var pipeline = await ProcessCsvFiles(dataDirectory);
            
            await SaveEventsByLocation("CommunitiesEventLog", pipeline.CommunityEvents);
            await SaveEventsByLocation("DirectoryEventLog", pipeline.DirectoryEvents);
            
            LogResults(pipeline);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
            Environment.Exit(1);
        }
    }

    private static async Task<ProcessingResult> ProcessCsvFiles(string dataDirectory)
    {
        Console.WriteLine("Reading CSV files and mapping to events...");
        
        var locations = await ReadCsvFile(
            Path.Combine(dataDirectory, "locations.csv"),
            ParseLocationFromCsv);
        
        var communities = await ReadCsvFile(
            Path.Combine(dataDirectory, "communities.csv"),
            ParseCommunityFromCsv);
        
        var families = await ReadCsvFile(
            Path.Combine(dataDirectory, "families.csv"),
            ParseFamilyFromCsv);
        
        var people = await ReadCsvFile(
            Path.Combine(dataDirectory, "person.csv"),
            ParsePersonFromCsv);
        
        var communityEvents = communities
            .Where(c => c.Status == "Active")
            .GroupBy(c => c.LocationId)
            .ToImmutableDictionary(
                g => g.Key,
                g => g.Select(CreateCommunityEvent).ToImmutableList());
        
        var directoryEvents = CreateDirectoryEvents(families, people)
            .GroupBy(de => de.LocationId)
            .ToImmutableDictionary(
                g => g.Key,
                g => g.Select(de => de.Event).ToImmutableList());
        
        return new ProcessingResult(
            Locations: locations.OfType<KeyValuePair<Guid, string>>().ToImmutableDictionary(l => l.Key, l => l.Value),
            Communities: communities.Where(c => c.Status == "Active").ToImmutableList(),
            CommunityEvents: new EventsByLocation<CommunityCommandExecutedEvent>(communityEvents),
            DirectoryEvents: new EventsByLocation<DirectoryEvent>(directoryEvents));
    }

    // Pure CSV reading function
    private static async Task<IEnumerable<T>> ReadCsvFile<T>(string filePath, Func<string[], T?> parser)
    {
        if (!File.Exists(filePath))
        {
            Console.WriteLine($"Warning: {filePath} not found, skipping");
            return Enumerable.Empty<T>();
        }

        var lines = await File.ReadAllLinesAsync(filePath);
        return lines.Skip(1) // Skip header
            .Select(ParseCsvLine)
            .Select(parser)
            .Where(item => item != null)
            .Cast<T>();
    }

    // CSV parsers
    private static KeyValuePair<Guid, string>? ParseLocationFromCsv(string[] fields)
    {
        if (fields.Length >= 3 && Guid.TryParse(fields[1], out var locationId))
            return new KeyValuePair<Guid, string>(locationId, fields[2]);
        return null;
    }

    private static CommunityData? ParseCommunityFromCsv(string[] fields)
    {
        if (fields.Length >= 4 &&
            Guid.TryParse(fields[0], out var orgId) &&
            Guid.TryParse(fields[1], out var locationId) &&
            Guid.TryParse(fields[2], out var communityId))
        {
            return new CommunityData(
                OrganizationId: orgId,
                LocationId: locationId,
                CommunityId: communityId,
                Name: fields[3],
                Status: fields.Length > 5 ? fields[5] : "Active");
        }
        return null;
    }

    private static FamilyData? ParseFamilyFromCsv(string[] fields)
    {
        if (fields.Length >= 17 &&
            Guid.TryParse(fields[0], out var orgId) &&
            Guid.TryParse(fields[1], out var locationId) &&
            Guid.TryParse(fields[2], out var familyId))
        {
            return new FamilyData(
                OrganizationId: orgId,
                LocationId: locationId,
                FamilyId: familyId,
                Name: fields[3],
                Email: fields[4],
                Phone: fields[5],
                AddressLine1: fields[6],
                AddressLine2: fields[7],
                PostalCode: fields[8],
                HomeChurchId: Guid.TryParse(fields[9], out var churchId) ? churchId : null,
                HomeChurch: fields[10],
                City: fields[11],
                County: fields[13],
                State: fields[14],
                Status: fields[16]);
        }
        return null;
    }

    private static PersonData? ParsePersonFromCsv(string[] fields)
    {
        if (fields.Length >= 12 &&
            Guid.TryParse(fields[0], out var orgId) &&
            Guid.TryParse(fields[2], out var locationId) &&
            Guid.TryParse(fields[3], out var familyId) &&
            Guid.TryParse(fields[4], out var personId))
        {
            return new PersonData(
                OrganizationId: orgId,
                LocationId: locationId,
                FamilyId: familyId,
                PersonId: personId,
                FirstName: fields[5],
                LastName: fields[6],
                PersonType: fields[7],
                Gender: MapGender(fields[8]),
                BirthDate: !string.IsNullOrWhiteSpace(fields[10]) ? TryParseDate(fields[10]) : null);
        }
        return null;
    }

    // Event creation functions
    private static CommunityCommandExecutedEvent CreateCommunityEvent(CommunityData community) =>
        new(UserId: SystemUserId,
            TimestampUtc: ImportTimestamp,
            Command: new CreateCommunity(
                CommunityId: community.CommunityId,
                Name: community.Name,
                Description: ""));

    private static IEnumerable<DirectoryEventWithLocation> CreateDirectoryEvents(
        IEnumerable<FamilyData> families,
        IEnumerable<PersonData> people)
    {
        var activeFamilies = families.Where(f => f.Status == "Active").ToList();
        var peopleByFamily = people.ToLookup(p => p.FamilyId);

        foreach (var family in activeFamilies)
        {
            var familyPeople = peopleByFamily[family.FamilyId].ToList();
            var adults = familyPeople.Where(p => IsAdult(p.PersonType)).ToList();
            var children = familyPeople.Where(p => !IsAdult(p.PersonType)).ToList();

            // Create person events
            foreach (var person in familyPeople)
            {
                yield return new DirectoryEventWithLocation(family.LocationId, CreatePersonEvent(person, family));
            }

            // Create family event
            if (familyPeople.Any())
            {
                yield return new DirectoryEventWithLocation(family.LocationId, CreateFamilyEvent(family, adults, children));
            }
        }
    }

    private static PersonCommandExecuted CreatePersonEvent(PersonData person, FamilyData family)
    {
        var age = person.BirthDate.HasValue
            ? new ExactAge(person.BirthDate.Value) as Age
            : null;

        var addresses = !string.IsNullOrWhiteSpace(family.AddressLine1)
            ? ImmutableList.Create(new Address(
                Id: Guid.NewGuid(),
                Line1: family.AddressLine1,
                Line2: family.AddressLine2,
                City: family.City ?? "",
                County: family.County,
                State: family.State ?? "",
                PostalCode: family.PostalCode ?? ""))
            : ImmutableList<Address>.Empty;

        var phoneNumbers = !string.IsNullOrWhiteSpace(family.Phone)
            ? ImmutableList.Create(new PhoneNumber(
                Id: Guid.NewGuid(),
                Number: family.Phone,
                Type: PhoneNumberType.Home))
            : ImmutableList<PhoneNumber>.Empty;

        var emailAddresses = !string.IsNullOrWhiteSpace(family.Email)
            ? ImmutableList.Create(new EmailAddress(
                Id: Guid.NewGuid(),
                Address: family.Email,
                Type: EmailAddressType.Personal))
            : ImmutableList<EmailAddress>.Empty;

        var createPersonCommand = new CreatePerson(
            PersonId: person.PersonId,
            FirstName: person.FirstName ?? "",
            LastName: person.LastName ?? "",
            Gender: person.Gender,
            Age: age,
            Ethnicity: null,
            Addresses: addresses,
            CurrentAddressId: addresses.FirstOrDefault()?.Id,
            PhoneNumbers: phoneNumbers,
            PreferredPhoneNumberId: phoneNumbers.FirstOrDefault()?.Id,
            EmailAddresses: emailAddresses,
            PreferredEmailAddressId: emailAddresses.FirstOrDefault()?.Id,
            Concerns: null,
            Notes: null);

        return new PersonCommandExecuted(
            UserId: SystemUserId,
            TimestampUtc: ImportTimestamp,
            Command: createPersonCommand);
    }

    private static FamilyCommandExecuted CreateFamilyEvent(
        FamilyData family,
        IList<PersonData> adults,
        IList<PersonData> children)
    {
        var primaryContact = adults.FirstOrDefault()?.PersonId ?? children.FirstOrDefault()?.PersonId;
        if (!primaryContact.HasValue)
            throw new InvalidOperationException($"No people found for family {family.FamilyId}");

        var adultRelationships = adults
            .Select(a => (a.PersonId, new FamilyAdultRelationshipInfo("Parent", true)))
            .ToImmutableList();

        var childIds = children.Select(c => c.PersonId).ToImmutableList();

        var custodialRelationships = children
            .SelectMany(child => adults.Select(adult => new CustodialRelationship(
                ChildId: child.PersonId,
                PersonId: adult.PersonId,
                Type: CustodialRelationshipType.ParentWithCustody)))
            .ToImmutableList();

        var createFamilyCommand = new CreateFamily(
            FamilyId: family.FamilyId,
            PrimaryFamilyContactPersonId: primaryContact.Value,
            Adults: adultRelationships,
            Children: childIds,
            CustodialRelationships: custodialRelationships);

        return new FamilyCommandExecuted(
            UserId: SystemUserId,
            TimestampUtc: ImportTimestamp,
            Command: createFamilyCommand);
    }

    // Location extraction functions
    private static async Task SaveEventsByLocation<T>(string baseDirectory, EventsByLocation<T> eventsByLocation)
    {
        Directory.CreateDirectory(baseDirectory);
        
        foreach (var (locationId, events) in eventsByLocation.Events)
        {
            var locationDir = Path.Combine(baseDirectory, locationId.ToString());
            Directory.CreateDirectory(locationDir);
            
            var locationFile = Path.Combine(locationDir, "0001.ndjson");
            
            using var writer = new StreamWriter(locationFile);
            foreach (var evt in events)
            {
                var json = JsonConvert.SerializeObject(evt, JsonSettings);
                await writer.WriteLineAsync(json);
            }
            
            Console.WriteLine($"Location {locationId}: {events.Count} events written to {locationFile}");
        }
    }

    private static void LogResults(ProcessingResult result)
    {
        Console.WriteLine($"Loaded {result.Locations.Count} locations");
        
        var totalCommunityEvents = result.CommunityEvents.Events.Values.Sum(events => events.Count);
        Console.WriteLine($"Generated {totalCommunityEvents} community events from {result.Communities.Count} communities across {result.CommunityEvents.Events.Count} locations");
        
        var totalDirectoryEvents = result.DirectoryEvents.Events.Values.Sum(events => events.Count);
        Console.WriteLine($"Generated {totalDirectoryEvents} directory events across {result.DirectoryEvents.Events.Count} locations");
    }

    private static DateTime? TryParseDate(string dateString)
    {
        if (DateTime.TryParse(dateString, out var date))
            return date;
        
        var formats = new[] { "yyyy-MM-dd", "MM/dd/yyyy", "dd/MM/yyyy", "yyyy/MM/dd" };
        foreach (var format in formats)
        {
            if (DateTime.TryParseExact(dateString, format, CultureInfo.InvariantCulture, DateTimeStyles.None, out date))
                return date;
        }
        
        return null;
    }

    private static string[] ParseCsvLine(string line)
    {
        var fields = new List<string>();
        var inQuotes = false;
        var currentField = "";
        
        for (int i = 0; i < line.Length; i++)
        {
            char c = line[i];
            
            if (c == '"')
            {
                inQuotes = !inQuotes;
            }
            else if (c == ',' && !inQuotes)
            {
                fields.Add(currentField.Trim());
                currentField = "";
            }
            else
            {
                currentField += c;
            }
        }
        
        fields.Add(currentField.Trim());
        return fields.ToArray();
    }

    private static async Task<Dictionary<Guid, string>> ReadLocations(string filePath)
    {
        var locations = new Dictionary<Guid, string>();
        
        if (!File.Exists(filePath))
        {
            Console.WriteLine($"Warning: {filePath} not found, skipping locations");
            return locations;
        }
        
        var lines = await File.ReadAllLinesAsync(filePath);
        foreach (var line in lines.Skip(1)) // Skip header
        {
            var fields = ParseCsvLine(line);
            if (fields.Length >= 3)
            {
                if (Guid.TryParse(fields[1], out var locationId))
                {
                    locations[locationId] = fields[2];
                }
            }
        }
        
        return locations;
    }

    private static async Task<(Dictionary<Guid, List<CommunityCommandExecutedEvent>>, Dictionary<Guid, string>)> ReadCommunities(string filePath)
    {
        var eventsByLocation = new Dictionary<Guid, List<CommunityCommandExecutedEvent>>();
        var communities = new Dictionary<Guid, string>();
        
        if (!File.Exists(filePath))
        {
            Console.WriteLine($"Warning: {filePath} not found, skipping communities");
            return (eventsByLocation, communities);
        }
        
        var lines = await File.ReadAllLinesAsync(filePath);
        foreach (var line in lines.Skip(1)) // Skip header
        {
            var fields = ParseCsvLine(line);
            if (fields.Length >= 4)
            {
                if (Guid.TryParse(fields[1], out var locationId) && 
                    Guid.TryParse(fields[2], out var communityId))
                {
                    var communityName = fields[3];
                    var status = fields.Length > 5 ? fields[5] : "Active";
                    
                    if (status == "Active")
                    {
                        var createCommand = new CreateCommunity(
                            CommunityId: communityId,
                            Name: communityName,
                            Description: ""
                        );
                        
                        var communityEvent = new CommunityCommandExecutedEvent(
                            UserId: SystemUserId,
                            TimestampUtc: ImportTimestamp,
                            Command: createCommand
                        );
                        
                        if (!eventsByLocation.ContainsKey(locationId))
                        {
                            eventsByLocation[locationId] = new List<CommunityCommandExecutedEvent>();
                        }
                        
                        eventsByLocation[locationId].Add(communityEvent);
                        communities[communityId] = communityName;
                    }
                }
            }
        }
        
        return (eventsByLocation, communities);
    }
}
