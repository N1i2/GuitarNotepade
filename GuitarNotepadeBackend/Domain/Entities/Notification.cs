using Domain.Entities.Base;

namespace Domain.Entities;

public enum NotificationType
{
    UserContentChanged = 1,
    AlbumChanged = 2
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
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId is required", nameof(userId));

        if (string.IsNullOrWhiteSpace(message))
            throw new ArgumentException("Message is required", nameof(message));

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
