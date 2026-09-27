using AudioSync.Api.Interfaces;
using AudioSync.Api.Models;
using AudioSync.Api.DTOs;
using System.Collections.Concurrent;

namespace AudioSync.Api.Services
{
    public class AudioStreamService : IAudioStreamService
    {
        private readonly ConcurrentDictionary<string, AudioStreamSession> _sessions = new();
        private readonly ILogger<AudioStreamService> _logger;
        private readonly IRoomService _roomService;

        public AudioStreamService(ILogger<AudioStreamService> logger, IRoomService roomService)
        {
            _logger = logger;
            _roomService = roomService;
        }

        public Task<bool> StartStreamAsync(string roomCode, string hostConnectionId)
        {
            var session = _sessions.GetOrAdd(roomCode, code => new AudioStreamSession { RoomCode = code });
            session.IsStreaming = true;
            session.CurrentSequence = 0;
            session.StartedUtc = DateTime.UtcNow;
            session.LastChunkUtc = null;

            _logger.LogInformation("Stream started for room {RoomCode} by {Host}", roomCode, hostConnectionId);
            return Task.FromResult(true);
        }

        public Task<bool> StopStreamAsync(string roomCode, string hostConnectionId)
        {
            if (_sessions.TryGetValue(roomCode, out var session))
            {
                session.IsStreaming = false;
                _logger.LogInformation("Stream stopped for room {RoomCode} by {Host}", roomCode, hostConnectionId);
                return Task.FromResult(true);
            }

            _logger.LogWarning("StopStream called but no active session for room {RoomCode}", roomCode);
            return Task.FromResult(false);
        }

        public Task<bool> PublishChunkAsync(string roomCode, AudioChunk chunk)
        {
            var session = _sessions.GetOrAdd(roomCode, code => new AudioStreamSession { RoomCode = code });
            session.CurrentSequence = chunk.SequenceNumber;
            session.LastChunkUtc = chunk.TimestampUtc;
            session.IsStreaming = true;

            _logger.LogInformation("Chunk published for room {RoomCode} seq {Seq}", roomCode, chunk.SequenceNumber);
            return Task.FromResult(true);
        }

        public Task<AudioStreamStatusDto?> GetStreamStatusAsync(string roomCode)
        {
            _sessions.TryGetValue(roomCode, out var session);

            var room = _roomService.GetRoom(roomCode);
            var listenerCount = room?.Participants.Count ?? 0;

            if (session == null)
                return Task.FromResult<AudioStreamStatusDto?>(new AudioStreamStatusDto { IsStreaming = false, CurrentSequence = 0, ListenerCount = listenerCount, StartedUtc = null, LastChunkUtc = null });

            var dto = new AudioStreamStatusDto
            {
                IsStreaming = session.IsStreaming,
                CurrentSequence = session.CurrentSequence,
                ListenerCount = listenerCount,
                StartedUtc = session.StartedUtc,
                LastChunkUtc = session.LastChunkUtc
            };

            return Task.FromResult<AudioStreamStatusDto?>(dto);
        }
    }
}
