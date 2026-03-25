using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface INotificationMessageService
{
    string BuildAlbumUpdatedMessage(Album album, string? updatedFields = null);
    string BuildAlbumDeletedMessage(Album album);
    string BuildSongAddedToAlbumMessage(Album album, Song song);
    string BuildSongRemovedFromAlbumMessage(Album album, Song song);
    string BuildAlbumVisibilityChangedMessage(Album album, bool wasPublic, bool isPublic);
}