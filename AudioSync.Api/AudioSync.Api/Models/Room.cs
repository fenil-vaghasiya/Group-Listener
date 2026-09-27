using System.Collections.Concurrent;

namespace AudioSync.Api.Models
{
    public class Room
    {
        public string Code { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        // key: connectionId
        public ConcurrentDictionary<string, Participant> Participants { get; } = new();
        // Media state
        public string? CurrentMediaUrl { get; set; }
        public double CurrentPositionSeconds { get; set; }
        public bool IsPlaying { get; set; }
        public DateTime LastUpdatedUtc { get; set; } = DateTime.UtcNow;
        public string? HostConnectionId { get; set; }
    }
}