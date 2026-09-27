using AudioSync.Api.DTOs;
using AudioSync.Api.Models;

namespace AudioSync.Api.Interfaces
{
    public interface IAudioStreamService
    {
        Task<bool> StartStreamAsync(string roomCode, string hostConnectionId);
        Task<bool> StopStreamAsync(string roomCode, string hostConnectionId);
        Task<bool> PublishChunkAsync(string roomCode, AudioChunk chunk);
        Task<AudioStreamStatusDto?> GetStreamStatusAsync(string roomCode);
    }
}
