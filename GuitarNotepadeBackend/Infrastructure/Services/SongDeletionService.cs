using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class SongDeletionService : ISongDeletionService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebDavService _webDavService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<SongDeletionService> _logger;

    public SongDeletionService(
        IUnitOfWork unitOfWork,
        IWebDavService webDavService,
        INotificationService notificationService,
        ILogger<SongDeletionService> logger)
    {
        _unitOfWork = unitOfWork;
        _webDavService = webDavService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<bool> DeleteSongWithAudioAsync(Guid songId, Guid userId, CancellationToken cancellationToken = default)
    {
        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
        {
            _logger.LogWarning("Song {SongId} not found for deletion", songId);
            return false;
        }

        var songAlbums = await _unitOfWork.SongAlboms.GetBySongIdAsync(songId, cancellationToken);

        _logger.LogInformation("Song {SongId} is in {Count} albums", songId, songAlbums.Count);

        foreach (var songAlbum in songAlbums)
        {
            if (songAlbum.Album != null && songAlbum.Album.Title != Constants.Albums.FavoriteTitle)
            {
                _logger.LogInformation("Sending notification for album {AlbumId} about song removal", songAlbum.AlbumId);

                await _notificationService.NotifyAlbumChangedAsync(
                    albumId: songAlbum.AlbumId,
                    type: NotificationType.SongRemoved,
                    songId: songId,
                    cancellationToken: cancellationToken);
            }
        }

        if (!string.IsNullOrEmpty(song.CustomAudioUrl) &&
            !song.CustomAudioUrl.StartsWith("http://") &&
            !song.CustomAudioUrl.StartsWith("https://"))
        {
            try
            {
                await _webDavService.DeleteAudioAsync(song.CustomAudioUrl);
                _logger.LogInformation("Deleted audio file for song {SongId}: {AudioUrl}", songId, song.CustomAudioUrl);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete audio file for song {SongId}", songId);
            }
        }

        var deleted = await _unitOfWork.Songs.DeleteAsync(songId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        if (deleted)
        {
            _logger.LogInformation("Song {SongId} deleted successfully with all related data", songId);
        }

        return deleted;
    }
}