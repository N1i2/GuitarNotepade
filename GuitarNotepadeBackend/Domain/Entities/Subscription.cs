using Domain.Entities.Base;

namespace Domain.Entities;

public class Subscription : BaseEntityWithId
{
    public Guid UserId { get; private set; }
    public Guid? TargetUserId { get; private set; }
    public Guid? TargetAlbumId { get; private set; }
    public bool IsUserSub { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public virtual User Subscriber { get; private set; } = null!;
    public virtual User? TargetUser { get; private set; }
    public virtual Album? TargetAlbum { get; private set; }

    private Subscription() { }

    public static Subscription CreateForUser(Guid userId, Guid targetUserId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId is required", nameof(userId));
        if (targetUserId == Guid.Empty)
            throw new ArgumentException("TargetUserId is required", nameof(targetUserId));

        return new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TargetUserId = targetUserId,
            TargetAlbumId = null,
            IsUserSub = true,
            CreatedAt = DateTime.UtcNow
        };
    }

    public static Subscription CreateForAlbum(Guid userId, Guid targetAlbumId)
    {
        if (userId == Guid.Empty)
            throw new ArgumentException("UserId is required", nameof(userId));
        if (targetAlbumId == Guid.Empty)
            throw new ArgumentException("TargetAlbumId is required", nameof(targetAlbumId));

        return new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TargetUserId = null,
            TargetAlbumId = targetAlbumId,
            IsUserSub = false,
            CreatedAt = DateTime.UtcNow
        };
    }

    public bool IsSubscriptionToUser() => IsUserSub;
    public bool IsSubscriptionToAlbum() => !IsUserSub;
}
