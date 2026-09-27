using System.ComponentModel.DataAnnotations;

namespace AudioSync.Api.DTOs
{
    public class RoomJoinDto
    {
        [Required]
        [MinLength(6)]
        [MaxLength(6)]
        public string RoomCode { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string UserName { get; set; } = string.Empty;
    }
}