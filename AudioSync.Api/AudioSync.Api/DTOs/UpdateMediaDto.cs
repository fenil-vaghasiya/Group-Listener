using System.ComponentModel.DataAnnotations;

namespace AudioSync.Api.DTOs
{
    public class UpdateMediaDto
    {
        [Required]
        [Url]
        public string MediaUrl { get; set; } = string.Empty;

        public double? PositionSeconds { get; set; }
        public bool? IsPlaying { get; set; }
    }
}
