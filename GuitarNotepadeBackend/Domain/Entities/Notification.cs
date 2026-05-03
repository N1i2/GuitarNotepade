using Domain.Common;
using Domain.Entities.Base;

namespace Domain.Entities;

public enum NotificationType
{
    AlbumChanged = 1,
    AlbumDeleted = 2,
    SongAdded = 3,
    SongRemoved = 4,
    AlbumVisibilityChanged = 5
}

public class Notification : BaseEntityWithId
{
    public Guid UserId { get; private set; }
    public NotificationType Type { get; private set; }
    public string Message { get; private set; } = string.Empty;
    public Guid? ActorUserId { get; private set; }
    public Guid? SongId { get; private set; }
    public Guid? AlbumId { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public bool IsRead { get; private set; }

    public virtual User User { get; private set; } = null!;
    public virtual User? ActorUser { get; private set; }
    public virtual Song? Song { get; private set; }
    public virtual Album? Album { get; private set; }

    protected Notification() { }

    public static Notification Create(
        Guid userId,
        NotificationType type,
        string message,
        Guid? actorUserId = null,
        Guid? songId = null,
        Guid? albumId = null)
    {
        Guard.AgainstEmptyGuid(userId, nameof(userId));
        Guard.AgainstNullOrWhiteSpace(message, nameof(message), "Message is required");

        return new Notification
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Type = type,
            Message = message.Trim(),
            ActorUserId = actorUserId,
            SongId = songId,
            AlbumId = albumId,
            CreatedAt = DateTime.UtcNow,
            IsRead = false
        };
    }

    public void MarkAsRead() => IsRead = true;
}
