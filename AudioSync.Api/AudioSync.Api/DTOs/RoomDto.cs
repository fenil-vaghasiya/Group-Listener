namespace AudioSync.Api.DTOs
{
    public class ParticipantDto
    {
        public string ConnectionId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
    }

    public class RoomDto
    {
        public string Code { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public int ParticipantCount { get; set; }
        public IEnumerable<ParticipantDto> Participants { get; set; } = Array.Empty<ParticipantDto>();
    }
}