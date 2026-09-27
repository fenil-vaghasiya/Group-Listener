namespace AudioSync.Api.Models
{
    public class AudioChunk
    {
        public long SequenceNumber { get; set; }
        public DateTime TimestampUtc { get; set; }
        public byte[] Data { get; set; } = Array.Empty<byte>();
    }
}
