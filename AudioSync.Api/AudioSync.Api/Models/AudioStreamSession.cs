namespace AudioSync.Api.Models
{
    public class AudioStreamSession
    {
        public string RoomCode { get; set; } = string.Empty;
        public bool IsStreaming { get; set; }
        public long CurrentSequence { get; set; }
        public DateTime StartedUtc { get; set; }
        public DateTime? LastChunkUtc { get; set; }
    }
}
