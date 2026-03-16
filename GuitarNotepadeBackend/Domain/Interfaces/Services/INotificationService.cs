using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface INotificationService
{
    Task NotifyUserContentChangedAsync(
        Guid authorId,
        string message,
        Guid? songId = null,
        Guid? albumId = null,
        CancellationToken cancellationToken = default);

    Task NotifyAlbumChangedAsync(
        Guid albumId,
        string message,
        Guid? songId = null,
        CancellationToken cancellationToken = default);
}

