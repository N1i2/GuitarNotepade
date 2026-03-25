using Domain.Entities;
using Domain.Interfaces;
using Domain.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Services;

public class NotificationService : INotificationService
{
    private const int MaxMessageLength = 500;

    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<NotificationService> _logger;
    private readonly INotificationMessageService _messageService;

    public NotificationService(
        IUnitOfWork unitOfWork,
        ILogger<NotificationService> logger,
        INotificationMessageService messageService)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
        _messageService = messageService;
    }

    public async Task NotifyAlbumChangedAsync(
        Guid albumId,
        string? message = null,
        Guid? songId = null,
        NotificationType? type = null,
        string? updatedFields = null,
        bool? wasPublic = null,
        CancellationToken cancellationToken = default)
    {
        var album = await _unitOfWork.Alboms.GetByIdAsync(albumId, cancellationToken);
        if (album == null)
        {
            _logger.LogWarning("Album {AlbumId} not found for notification", albumId);
            return;
        }

        var subscribers = await _unitOfWork.Subscriptions
            .GetSubscribersAsync(albumId, cancellationToken);

        if (subscribers.Count == 0)
        {
            _logger.LogDebug("No subscribers for album {AlbumId}", albumId);
            return;
        }

        string notificationMessage;
        NotificationType notificationType;
        Song? song = null;

        if (type.HasValue)
        {
            notificationType = type.Value;

            switch (notificationType)
            {
                case NotificationType.AlbumDeleted:
                    notificationMessage = _messageService.BuildAlbumDeletedMessage(album);
                    break;

                case NotificationType.SongAdded:
                    if (songId.HasValue)
                    {
                        song = await _unitOfWork.Songs.GetByIdAsync(songId.Value, cancellationToken);
                        notificationMessage = song != null
                            ? _messageService.BuildSongAddedToAlbumMessage(album, song)
                            : _messageService.BuildAlbumUpdatedMessage(album, "song added");
                    }
                    else
                    {
                        notificationMessage = _messageService.BuildAlbumUpdatedMessage(album, "song added");
                    }
                    break;

                case NotificationType.SongRemoved:
                    if (songId.HasValue)
                    {
                        song = await _unitOfWork.Songs.GetByIdAsync(songId.Value, cancellationToken);
                        notificationMessage = song != null
                            ? _messageService.BuildSongRemovedFromAlbumMessage(album, song)
                            : _messageService.BuildAlbumUpdatedMessage(album, "song removed");
                    }
                    else
                    {
                        notificationMessage = _messageService.BuildAlbumUpdatedMessage(album, "song removed");
                    }
                    break;

                case NotificationType.AlbumVisibilityChanged:
                    notificationMessage = _messageService.BuildAlbumVisibilityChangedMessage(
                        album,
                        wasPublic ?? !album.IsPublic,
                        album.IsPublic);
                    break;

                default:
                    notificationMessage = message ?? _messageService.BuildAlbumUpdatedMessage(album, updatedFields);
                    break;
            }
        }
        else
        {
            notificationType = message?.Contains("deleted") == true
                ? NotificationType.AlbumDeleted
                : (songId.HasValue ? NotificationType.SongAdded : NotificationType.AlbumChanged);

            notificationMessage = message ?? _messageService.BuildAlbumUpdatedMessage(album, updatedFields);
        }

        var trimmedMessage = TrimMessage(notificationMessage);
        var notifications = new List<Notification>();

        foreach (var subscriber in subscribers)
        {
            var notification = Notification.Create(
                userId: subscriber.UserId,
                type: notificationType,
                message: trimmedMessage,
                albumId: albumId,
                songId: songId,
                actorUserId: null);

            notifications.Add(notification);
        }

        foreach (var notification in notifications)
        {
            await _unitOfWork.Notifications.AddAsync(notification, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Created {Count} notifications for album {AlbumId} of type {NotificationType}",
            notifications.Count,
            albumId,
            notificationType);
    }

    private static string TrimMessage(string message)
    {
        if (string.IsNullOrWhiteSpace(message))
        {
            return string.Empty;
        }

        var trimmed = message.Trim();

        if (trimmed.Length <= MaxMessageLength)
        {
            return trimmed;
        }

        return trimmed.Substring(0, MaxMessageLength);
    }
}
