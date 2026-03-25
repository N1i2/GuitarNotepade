using Domain.Common;
using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class AlbumService : IAlbumService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IWebDavService _webDavService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<AlbumService> _logger;

    public AlbumService(
        IUnitOfWork unitOfWork,
        IWebDavService webDavService,
        INotificationService notificationService,
        ILogger<AlbumService> logger)
    {
        _unitOfWork = unitOfWork;
        _webDavService = webDavService;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task<Album> CreateAlbumAsync(
    Guid userId,
    string title,
    bool isPublic,
    string? genre = null,
    string? theme = null,
    string? coverBase64 = null,
    string? description = null,
    CancellationToken cancellationToken = default)
    {
        if (await _unitOfWork.Alboms.ExistsByTitleAndOwnerAsync(title, userId, cancellationToken))
            throw new InvalidOperationException($"You already have an album with title '{title}'");

        string? coverFileName = null;

        _logger.LogInformation("CreateAlbumAsync called with coverBase64 length: {Length}", coverBase64?.Length ?? 0);
        _logger.LogInformation("coverBase64 preview: {Preview}", coverBase64?.Substring(0, Math.Min(100, coverBase64?.Length ?? 0)));

        if (!string.IsNullOrEmpty(coverBase64))
        {
            try
            {
                var newAlbumId = Guid.NewGuid();
                _logger.LogInformation("Uploading album cover for album {AlbumId}", newAlbumId);
                coverFileName = await _webDavService.UploadAlbumCoverAsync(coverBase64, newAlbumId);
                _logger.LogInformation("Upload successful, coverFileName: {FileName}", coverFileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload album cover");
                throw;
            }
        }
        else
        {
            _logger.LogInformation("No cover image provided");
        }

        _logger.LogInformation("Creating album with coverFileName: {FileName}", coverFileName ?? "null");

        var album = Album.Create(
            userId,
            title,
            genre,
            theme,
            isPublic,
            coverFileName,
            description);

        _logger.LogInformation("Album created with CoverUrl: {CoverUrl}", album.CoverUrl ?? "null");

        album = await _unitOfWork.Alboms.CreateAsync(album, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Album created: {AlbumId} - {AlbumTitle} by user {UserId}",
            album.Id,
            album.Title,
            userId);

        return album;
    }

    public async Task<Album> UpdateAlbumAsync(
    Guid albumId,
    Guid userId,
    string? title = null,
    bool? isPublic = null,
    string? genre = null,
    string? theme = null,
    string? coverBase64 = null,
    string? description = null,
    CancellationToken cancellationToken = default)
    {
        var album = await _unitOfWork.Alboms.GetByIdAsync(albumId, cancellationToken);
        if (album == null)
            throw new KeyNotFoundException($"Album with ID {albumId} not found");

        if (album.OwnerId != userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
            if (user?.Role != Constants.Roles.Admin)
                throw new UnauthorizedAccessException("Only owner or admin can update this album");
        }

        if (album.Title == "Favorite")
            throw new InvalidOperationException("Cannot modify the Favorite album");

        if (title != null && title != album.Title)
        {
            if (await _unitOfWork.Alboms.ExistsByTitleAndOwnerAsync(title, album.OwnerId, cancellationToken))
                throw new InvalidOperationException($"You already have an album with title '{title}'");
        }

        var wasPublic = album.IsPublic;
        var updatedFields = new List<string>();

        if (title != null && title != album.Title)
        {
            updatedFields.Add($"title changed to \"{title}\"");
        }

        if (isPublic.HasValue && isPublic.Value != album.IsPublic)
        {
            updatedFields.Add($"visibility changed to {(isPublic.Value ? "public" : "private")}");
        }

        string? coverFileName = album.CoverUrl;

        if (!string.IsNullOrEmpty(coverBase64))
        {
            if (!string.IsNullOrEmpty(album.CoverUrl))
            {
                await _webDavService.DeleteAlbumCoverAsync(album.CoverUrl);
            }

            coverFileName = await _webDavService.UploadAlbumCoverAsync(coverBase64, albumId);
            updatedFields.Add("cover image updated");
        }

        if (description != null && description != album.Description)
        {
            updatedFields.Add("description updated");
        }

        if (genre != null && genre != album.Genre)
        {
            updatedFields.Add($"genre changed to {genre}");
        }

        if (theme != null && theme != album.Theme)
        {
            updatedFields.Add($"theme changed to {theme}");
        }

        album.Update(title, genre, theme, coverFileName, description, isPublic);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Album updated: {AlbumId} by user {UserId}", albumId, userId);

        if (updatedFields.Any())
        {
            var updatedFieldsMessage = string.Join(", ", updatedFields);

            await _notificationService.NotifyAlbumChangedAsync(
                albumId: album.Id,
                updatedFields: updatedFieldsMessage,
                cancellationToken: cancellationToken);
        }

        if (isPublic.HasValue && isPublic.Value != wasPublic)
        {
            await _notificationService.NotifyAlbumChangedAsync(
                albumId: album.Id,
                type: NotificationType.AlbumVisibilityChanged,
                wasPublic: wasPublic,
                cancellationToken: cancellationToken);
        }

        return album;
    }

    public async Task DeleteAlbumAsync(
    Guid albumId,
    Guid userId,
    CancellationToken cancellationToken = default)
    {
        var album = await _unitOfWork.Alboms.GetByIdAsync(albumId, cancellationToken);
        if (album == null)
            throw new KeyNotFoundException($"Album with ID {albumId} not found");

        if (album.OwnerId != userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
            if (user?.Role != Constants.Roles.Admin)
                throw new UnauthorizedAccessException("Only owner or admin can delete this album");
        }

        if (album.Title == "Favorite")
            throw new InvalidOperationException("Cannot delete the Favorite album");

        await _notificationService.NotifyAlbumChangedAsync(
            albumId: album.Id,
            type: NotificationType.AlbumDeleted,
            cancellationToken: cancellationToken);

        if (!string.IsNullOrEmpty(album.CoverUrl))
        {
            try
            {
                await _webDavService.DeleteAlbumCoverAsync(album.CoverUrl);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Failed to delete album cover: {CoverUrl}", album.CoverUrl);
            }
        }

        await _unitOfWork.Alboms.DeleteAsync(albumId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Album deleted: {AlbumId} by user {UserId}", albumId, userId);
    }

    public async Task<Album> GetAlbumByIdAsync(Guid albumId, CancellationToken cancellationToken = default)
    {
        var album = await _unitOfWork.Alboms.GetByIdWithDetailsAsync(albumId, cancellationToken);
        if (album == null)
            throw new KeyNotFoundException($"Album with ID {albumId} not found");

        return album;
    }

    public async Task<Album> GetFavoriteAlbumAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var album = await _unitOfWork.Alboms.FindAsync(
            a => a.OwnerId == userId && a.Title == "Favorite",
            cancellationToken);

        if (album == null)
        {
            album = Album.Create(userId, "Favorite", isPublic: false);
            album = await _unitOfWork.Alboms.CreateAsync(album, cancellationToken);
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Favorite album created for user {UserId}", userId);
        }

        return album;
    }

    public async Task<List<Album>> GetUserAlbumsAsync(
        Guid userId,
        bool includePrivate = false,
        CancellationToken cancellationToken = default)
    {
        var query = _unitOfWork.Alboms.GetQueryable()
            .Where(a => a.OwnerId == userId);

        if (!includePrivate)
        {
            query = query.Where(a => a.IsPublic);
        }

        return await query.ToListAsync(cancellationToken);
    }

    public async Task AddSongToAlbumAsync(
    Guid albumId,
    Guid songId,
    Guid userId,
    CancellationToken cancellationToken = default)
    {
        var album = await _unitOfWork.Alboms.GetByIdAsync(albumId, cancellationToken);
        if (album == null)
            throw new KeyNotFoundException($"Album with ID {albumId} not found");

        if (album.OwnerId != userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
            if (user?.Role != Constants.Roles.Admin)
                throw new UnauthorizedAccessException("Only owner or admin can add songs to this album");
        }

        if (album.Title == "Favorite")
            throw new InvalidOperationException("Use AddSongToFavoriteAsync for Favorite album");

        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            throw new KeyNotFoundException($"Song with ID {songId} not found");

        if (await _unitOfWork.SongAlboms.ExistsAsync(albumId, songId, cancellationToken))
        {
            _logger.LogDebug("Song {SongId} already in album {AlbumId}", songId, albumId);
            return;
        }

        var songAlbum = SongAlbum.Create(albumId, songId);
        await _unitOfWork.SongAlboms.CreateAsync(songAlbum, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Song {SongId} added to album {AlbumId}", songId, albumId);

        await _notificationService.NotifyAlbumChangedAsync(
            albumId: album.Id,
            type: NotificationType.SongAdded,
            songId: song.Id,
            cancellationToken: cancellationToken);
    }

    public async Task RemoveSongFromAlbumAsync(
    Guid albumId,
    Guid songId,
    Guid userId,
    CancellationToken cancellationToken = default)
    {
        var album = await _unitOfWork.Alboms.GetByIdAsync(albumId, cancellationToken);
        if (album == null)
            throw new KeyNotFoundException($"Album with ID {albumId} not found");

        if (album.OwnerId != userId)
        {
            var user = await _unitOfWork.Users.GetByIdAsync(userId, cancellationToken);
            if (user?.Role != Constants.Roles.Admin)
                throw new UnauthorizedAccessException("Only owner or admin can remove songs from this album");
        }

        if (album.Title == "Favorite")
            throw new InvalidOperationException("Use RemoveSongFromFavoriteAsync for Favorite album");

        var song = await _unitOfWork.Songs.GetByIdAsync(songId, cancellationToken);
        if (song == null)
            throw new KeyNotFoundException($"Song with ID {songId} not found");

        await _unitOfWork.SongAlboms.DeleteByAlbumAndSongAsync(albumId, songId, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Song {SongId} removed from album {AlbumId}", songId, albumId);

        await _notificationService.NotifyAlbumChangedAsync(
            albumId: album.Id,
            type: NotificationType.SongRemoved,
            songId: song.Id,
            cancellationToken: cancellationToken);
    }

    public async Task AddSongToFavoriteAsync(
        Guid userId,
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        var favorite = await GetFavoriteAlbumAsync(userId, cancellationToken);
        await AddSongToAlbumAsync(favorite.Id, songId, userId, cancellationToken);
    }

    public async Task RemoveSongFromFavoriteAsync(
        Guid userId,
        Guid songId,
        CancellationToken cancellationToken = default)
    {
        var favorite = await GetFavoriteAlbumAsync(userId, cancellationToken);
        await RemoveSongFromAlbumAsync(favorite.Id, songId, userId, cancellationToken);
    }

    public async Task<bool> IsAlbumOwnerAsync(
        Guid albumId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var album = await _unitOfWork.Alboms.GetByIdAsync(albumId, cancellationToken);
        return album != null && album.OwnerId == userId;
    }
}
