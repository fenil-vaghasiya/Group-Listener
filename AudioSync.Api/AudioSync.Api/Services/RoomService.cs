using AudioSync.Api.Interfaces;
using AudioSync.Api.Models;
using AudioSync.Api.DTOs;
using System.Collections.Concurrent;

namespace AudioSync.Api.Services
{
    public class RoomService : IRoomService
    {
        private readonly ConcurrentDictionary<string, Room> _rooms = new();
        private readonly ILogger<RoomService> _logger;
        private static readonly char[] _chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".ToCharArray();
        private readonly Random _random = new();

        public RoomService(ILogger<RoomService> logger)
        {
            _logger = logger;
        }

        public Task<bool> UpdateMediaAsync(string roomCode, string? mediaUrl, double? positionSeconds, bool? isPlaying, string? hostConnectionId = null)
        {
            if (!_rooms.TryGetValue(roomCode, out var room))
            {
                _logger.LogWarning("UpdateMedia failed, room not found: {RoomCode}", roomCode);
                return Task.FromResult(false);
            }

            // Update fields if provided
            if (mediaUrl != null)
            {
                room.CurrentMediaUrl = mediaUrl;
                // when new media is loaded, reset position if positionSeconds not provided
                room.CurrentPositionSeconds = positionSeconds ?? 0.0;
                room.HostConnectionId = hostConnectionId ?? room.HostConnectionId;
                _logger.LogInformation("Media loaded in room {RoomCode} by {Host}: {MediaUrl}", roomCode, hostConnectionId ?? "(unknown)", mediaUrl);
            }

            if (positionSeconds.HasValue && mediaUrl == null)
            {
                room.CurrentPositionSeconds = positionSeconds.Value;
                _logger.LogInformation("Media position updated in room {RoomCode}: {Position}", roomCode, positionSeconds.Value);
            }

            if (isPlaying.HasValue)
            {
                room.IsPlaying = isPlaying.Value;
                _logger.LogInformation("Playback state updated in room {RoomCode}: IsPlaying={IsPlaying}", roomCode, isPlaying.Value);
            }

            room.LastUpdatedUtc = DateTime.UtcNow;

            return Task.FromResult(true);
        }

        public Task<MediaStateDto?> GetMediaStateAsync(string roomCode)
        {
            if (!_rooms.TryGetValue(roomCode, out var room))
                return Task.FromResult<MediaStateDto?>(null);

            var dto = new MediaStateDto
            {
                MediaUrl = room.CurrentMediaUrl,
                CurrentPositionSeconds = room.CurrentPositionSeconds,
                IsPlaying = room.IsPlaying,
                LastUpdatedUtc = room.LastUpdatedUtc,
                HostConnectionId = room.HostConnectionId
            };

            return Task.FromResult<MediaStateDto?>(dto);
        }

        public Task<Room> CreateRoomAsync(string? hostName = null)
        {
            string code;
            do
            {
                code = GenerateCode(6);
            } while (!_rooms.TryAdd(code, new Room { Code = code }));

            _logger.LogInformation("Room created: {RoomCode} by {Host}", code, hostName ?? "(unknown)");
            return Task.FromResult(_rooms[code]);
        }

        public bool TryGetRoom(string roomCode, out Room? room)
        {
            return _rooms.TryGetValue(roomCode, out room);
        }

        public Room? GetRoom(string roomCode)
        {
            _rooms.TryGetValue(roomCode, out var room);
            return room;
        }

        public Task<bool> AddParticipantAsync(string roomCode, string connectionId, string userName)
        {
            if (!_rooms.TryGetValue(roomCode, out var room))
            {
                _logger.LogWarning("AddParticipant failed, room not found: {RoomCode}", roomCode);
                return Task.FromResult(false);
            }

            var participant = new Participant { ConnectionId = connectionId, UserName = userName, JoinedAt = DateTime.UtcNow };
            room.Participants[connectionId] = participant;
            _logger.LogInformation("User joined room {RoomCode}: {ConnectionId} ({UserName})", roomCode, connectionId, userName);
            return Task.FromResult(true);
        }

        public Task<bool> RemoveParticipantAsync(string roomCode, string connectionId)
        {
            if (!_rooms.TryGetValue(roomCode, out var room))
            {
                _logger.LogWarning("RemoveParticipant failed, room not found: {RoomCode}", roomCode);
                return Task.FromResult(false);
            }

            if (room.Participants.TryRemove(connectionId, out var participant))
            {
                _logger.LogInformation("User left room {RoomCode}: {ConnectionId} ({UserName})", roomCode, connectionId, participant.UserName);

                // remove room when empty
                if (room.Participants.IsEmpty)
                {
                    _rooms.TryRemove(roomCode, out _);
                    _logger.LogInformation("Room removed because empty: {RoomCode}", roomCode);
                }

                return Task.FromResult(true);
            }

            return Task.FromResult(false);
        }

        public Task RemoveParticipantFromAllRoomsAsync(string connectionId)
        {
            var roomsToNotify = new List<(string RoomCode, Participant Participant)>();

            foreach (var kvp in _rooms)
            {
                var room = kvp.Value;
                if (room.Participants.TryRemove(connectionId, out var participant))
                {
                    roomsToNotify.Add((kvp.Key, participant));
                    _logger.LogInformation("User disconnected and removed from room {RoomCode}: {ConnectionId} ({UserName})", kvp.Key, connectionId, participant.UserName);

                    if (room.Participants.IsEmpty)
                    {
                        _rooms.TryRemove(kvp.Key, out _);
                        _logger.LogInformation("Room removed because empty: {RoomCode}", kvp.Key);
                    }
                }
            }

            // nothing else to do here; hub will read results if needed
            return Task.CompletedTask;
        }

        private string GenerateCode(int length)
        {
            var buffer = new char[length];
            for (int i = 0; i < length; i++)
            {
                buffer[i] = _chars[_random.Next(_chars.Length)];
            }
            return new string(buffer);
        }
    }
}