using Domain.Entities;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class NotificationMessageService : INotificationMessageService
{
    private readonly ILogger<NotificationMessageService> _logger;

    public NotificationMessageService(ILogger<NotificationMessageService> logger)
    {
        _logger = logger;
    }

    public string BuildAlbumUpdatedMessage(Album album, string? updatedFields = null)
    {
        var message = $"📀 Album \"{album.Title}\" has been updated";

        if (!string.IsNullOrEmpty(updatedFields))
        {
            message += $": {updatedFields}";
        }

        return message;
    }

    public string BuildAlbumDeletedMessage(Album album)
    {
        return $"🗑️ Album \"{album.Title}\" has been deleted";
    }

    public string BuildSongAddedToAlbumMessage(Album album, Song song)
    {
        var songTitle = song.Title.Length > 50 ? song.Title[..47] + "..." : song.Title;
        return $"🎵 New song \"{songTitle}\" added to album \"{album.Title}\"";
    }

    public string BuildSongRemovedFromAlbumMessage(Album album, Song song)
    {
        var songTitle = song.Title.Length > 50 ? song.Title[..47] + "..." : song.Title;
        return $"🎵 Song \"{songTitle}\" removed from album \"{album.Title}\"";
    }

    public string BuildAlbumVisibilityChangedMessage(Album album, bool wasPublic, bool isPublic)
    {
        var visibility = isPublic ? "public" : "private";
        var icon = isPublic ? "🌍" : "🔒";

        return $"{icon} Album \"{album.Title}\" is now {visibility}";
    }
}
