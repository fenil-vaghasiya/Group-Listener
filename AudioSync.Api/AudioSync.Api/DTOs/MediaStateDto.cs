namespace AudioSync.Api.DTOs
{
    public class MediaStateDto
    {
        public string? MediaUrl { get; set; }
        public double CurrentPositionSeconds { get; set; }
        public bool IsPlaying { get; set; }
        public DateTime LastUpdatedUtc { get; set; }
        public string? HostConnectionId { get; set; }
    }
}
