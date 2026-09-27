using System.ComponentModel.DataAnnotations;

namespace AudioSync.Api.DTOs
{
    public class RoomCreateDto
    {
        [MaxLength(100)]
        public string? HostName { get; set; }
    }
}