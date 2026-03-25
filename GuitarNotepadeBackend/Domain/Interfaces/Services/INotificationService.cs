using Domain.Entities;

namespace Domain.Interfaces.Services;

public interface INotificationService
{
    Task NotifyAlbumChangedAsync(
        Guid albumId,
        string? message = null,
        Guid? songId = null,
        NotificationType? type = null,
        string? updatedFields = null,
        bool? wasPublic = null,
        CancellationToken cancellationToken = default);
}
