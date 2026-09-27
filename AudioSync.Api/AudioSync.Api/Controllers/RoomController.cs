using AudioSync.Api.DTOs;
using AudioSync.Api.Interfaces;
using AudioSync.Api.Models;
using Microsoft.AspNetCore.Mvc;

namespace AudioSync.Api.Controllers
{
    [ApiController]
    [Route("api/rooms")]
    public class RoomController : ControllerBase
    {
        private readonly IRoomService _roomService;
        private readonly ILogger<RoomController> _logger;

        public RoomController(IRoomService roomService, ILogger<RoomController> logger)
        {
            _roomService = roomService;
            _logger = logger;
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] RoomCreateDto dto)
        {
            var room = await _roomService.CreateRoomAsync(dto?.HostName);
            var response = MapToDto(room);
            return CreatedAtAction(nameof(Get), new { roomCode = room.Code }, response);
        }

        [HttpPost("join")]
        public IActionResult Join([FromBody] RoomJoinDto dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!_roomService.TryGetRoom(dto.RoomCode, out var room))
            {
                _logger.LogWarning("Join requested for non-existing room {RoomCode} by {UserName}", dto.RoomCode, dto.UserName);
                return NotFound(new { Message = "Room not found" });
            }

            _logger.LogInformation("Join requested for room {RoomCode} by {UserName}", dto.RoomCode, dto.UserName);

            // Actual real-time join is handled in the SignalR hub. This endpoint validates room and returns room info.
            var response = MapToDto(room!);
            return Ok(response);
        }

        [HttpGet("{roomCode}")]
        public IActionResult Get(string roomCode)
        {
            if (!_roomService.TryGetRoom(roomCode, out var room))
                return NotFound(new { Message = "Room not found" });

            return Ok(MapToDto(room!));
        }

        [HttpGet("{roomCode}/media-state")]
        public async Task<IActionResult> GetMediaState(string roomCode)
        {
            var state = await _roomService.GetMediaStateAsync(roomCode);
            if (state == null)
                return NotFound(new { Message = "Room not found or no media" });

            return Ok(state);
        }

        private static RoomDto MapToDto(Room room)
        {
            return new RoomDto
            {
                Code = room.Code,
                CreatedAt = room.CreatedAt,
                ParticipantCount = room.Participants.Count,
                Participants = room.Participants.Values.Select(p => new ParticipantDto
                {
                    ConnectionId = p.ConnectionId,
                    UserName = p.UserName,
                    JoinedAt = p.JoinedAt
                }).ToArray()
            };
        }
    }
}
