namespace Domain.Interfaces.Services;

public interface ISongDeletionService
{
    Task<bool> DeleteSongWithAudioAsync(Guid songId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> DeleteSongWithAudioAsync(Guid songId, CancellationToken cancellationToken = default);
}