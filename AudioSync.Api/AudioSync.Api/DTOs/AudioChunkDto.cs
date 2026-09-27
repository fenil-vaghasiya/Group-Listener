namespace AudioSync.Api.DTOs
{
    public class AudioChunkDto
    {
        public long SequenceNumber { get; set; }
        public DateTime TimestampUtc { get; set; }
        public byte[] Data { get; set; } = Array.Empty<byte>();
    }
}
