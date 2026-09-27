using AudioSync.Api.Models;
using AudioSync.Api.DTOs;

namespace AudioSync.Api.Interfaces
{
    public interface IRoomService
    {
        Task<Room> CreateRoomAsync(string? hostName = null);
        bool TryGetRoom(string roomCode, out Room? room);
        Task<bool> AddParticipantAsync(string roomCode, string connectionId, string userName);
        Task<bool> RemoveParticipantAsync(string roomCode, string connectionId);
        Task RemoveParticipantFromAllRoomsAsync(string connectionId);
        Room? GetRoom(string roomCode);
        Task<bool> UpdateMediaAsync(string roomCode, string? mediaUrl, double? positionSeconds, bool? isPlaying, string? hostConnectionId = null);
        Task<MediaStateDto?> GetMediaStateAsync(string roomCode);
    }
}