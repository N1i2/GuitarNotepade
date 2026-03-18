using Domain.Common;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class SongDeletionService : ISongDeletionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebDavService _webDavService;
    private readonly ILogger<SongDeletionService> _logger;

    public SongDeletionService(
        IUnitOfWork unitOfWork,
        IWebDavService webDavService,
        ILogger<SongDeletionService> logger)
    {
        _unitOfWork = unitOfWork;
        _webDavService = webDavService;
        _logger = logger;
    }

    public async Task<bool> DeleteSongWithAudioAsync(Guid songId, Guid userId, CancellationToken cancellationToken = default)
    {
        try
        {
            var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
            if (song == null)
            {
                _logger.LogWarning("Song not found: {SongId}", songId);
                return false;
            }

            if (song.OwnerId != userId)
            {
                var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
                if (user?.Role != Constants.Roles.Admin)
                {
                    _logger.LogWarning("User {UserId} is not authorized to delete song {SongId}", userId, songId);
                    throw new UnauthorizedAccessException("Only owner or admin can delete song");
                }
            }

            _logger.LogInformation("User {UserId} is deleting song {SongId}: {Title}", userId, songId, song.Title);

            return await DeleteSongByIdAsync(songId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting song with audio (with user check): {SongId}", songId);
            throw;
        }
    }

    public async Task<bool> DeleteSongWithAudioAsync(Guid songId, CancellationToken cancellationToken = default)
    {
        try
        {
            var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
            if (song == null)
            {
                _logger.LogWarning("Song not found: {SongId}", songId);
                return false;
            }

            _logger.LogInformation("Starting deletion of song: {SongId} - {Title}", songId, song.Title);

            return await DeleteSongByIdAsync(songId, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting song with audio: {SongId}", songId);
            throw;
        }
    }

    private async Task<bool> DeleteSongByIdAsync(Guid songId, CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
        {
            _logger.LogWarning("Song not found: {SongId}", songId);
            return false;
        }

        await DeleteAudioFileIfExists(song);

        var deleteResult = await _unitOfWork.Songs.DeleteAsync(songId, cancellationToken);

        if (!deleteResult)
        {
            _logger.LogWarning("Failed to delete song from database: {SongId}", songId);
            return false;
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Song deleted successfully: {SongId} - {Title}", songId, song.Title);
        return true;
    }

    private async Task DeleteAudioFileIfExists(Domain.Entities.Song song)
    {
        if (!string.IsNullOrEmpty(song.CustomAudioUrl) &&
            !song.CustomAudioUrl.StartsWith("http://") &&
            !song.CustomAudioUrl.StartsWith("https://"))
        {
            try
            {
                _logger.LogInformation("Attempting to delete audio file: {FileName}", song.CustomAudioUrl);

                var audioExists = await _webDavService.AudioExistsAsync(song.CustomAudioUrl);
                if (audioExists)
                {
                    var deleteResult = await _webDavService.DeleteAudioAsync(song.CustomAudioUrl);
                    if (deleteResult)
                    {
                        _logger.LogInformation("Audio file deleted from Yandex.Disk: {FileName}", song.CustomAudioUrl);
                    }
                    else
                    {
                        _logger.LogWarning("Failed to delete audio file from Yandex.Disk: {FileName}", song.CustomAudioUrl);
                    }
                }
                else
                {
                    _logger.LogInformation("Audio file does not exist on Yandex.Disk: {FileName}", song.CustomAudioUrl);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting audio file from Yandex.Disk: {FileName}", song.CustomAudioUrl);
            }
        }
        else
        {
            _logger.LogDebug("No audio file to delete for song: {SongId}", song.Id);
        }
    }
}
