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

    public NotificationService(
        IUnitOfWork unitOfWork,
        ILogger<NotificationService> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task NotifyUserContentChangedAsync(
        Guid authorId,
        string message,
        Guid? songId = null,
        Guid? albumId = null,
        CancellationToken cancellationToken = default)
    {
        var trimmedMessage = TrimMessage(message);

        var subscribers = await _unitOfWork.Subscriptions
            .GetSubscribersAsync(authorId, isUserSub: true, cancellationToken);

        if (subscribers.Count == 0)
        {
            return;
        }

        var notifications = subscribers
            .Select(s => Notification.Create(
                userId: s.UserId,
                type: NotificationType.UserContentChanged,
                message: trimmedMessage,
                actorUserId: authorId,
                songId: songId,
                albumId: albumId))
            .ToList();

        foreach (var notification in notifications)
        {
            await _unitOfWork.Notifications.AddAsync(notification, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Created {Count} user content notifications for author {AuthorId}",
            notifications.Count,
            authorId);
    }

    public async Task NotifyAlbumChangedAsync(
        Guid albumId,
        string message,
        Guid? songId = null,
        CancellationToken cancellationToken = default)
    {
        var trimmedMessage = TrimMessage(message);

        var subscribers = await _unitOfWork.Subscriptions
            .GetSubscribersAsync(albumId, isUserSub: false, cancellationToken);

        if (subscribers.Count == 0)
        {
            return;
        }

        var notifications = subscribers
            .Select(s => Notification.Create(
                userId: s.UserId,
                type: NotificationType.AlbumChanged,
                message: trimmedMessage,
                albumId: albumId,
                songId: songId))
            .ToList();

        foreach (var notification in notifications)
        {
            await _unitOfWork.Notifications.AddAsync(notification, cancellationToken);
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Created {Count} album notifications for album {AlbumId}",
            notifications.Count,
            albumId);
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

