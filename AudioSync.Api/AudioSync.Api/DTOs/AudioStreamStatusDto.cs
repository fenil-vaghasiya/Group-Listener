namespace AudioSync.Api.DTOs
{
    public class AudioStreamStatusDto
    {
        public bool IsStreaming { get; set; }
        public long CurrentSequence { get; set; }
        public int ListenerCount { get; set; }
        public DateTime? StartedUtc { get; set; }
        public DateTime? LastChunkUtc { get; set; }
    }
}
