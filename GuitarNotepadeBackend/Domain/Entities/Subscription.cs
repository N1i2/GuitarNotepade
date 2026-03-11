using Domain.Entities.Base;

namespace Domain.Entities;

public class Subscription : BaseEntityWithId
{
    public Guid UserId { get; private set; }
    public Guid SubId { get; private set; } 
    public bool IsUserSub { get; private set; } 
    public DateTime CreatedAt { get; private set; }

    public virtual User User { get; private set; } = null!;

    private Subscription() { }

    public static Subscription Create(Guid userId, Guid subId, bool isUserSub)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("UserId is required", nameof(userId));
        }

        if (subId == Guid.Empty)
        {
            throw new ArgumentException("SubId is required", nameof(subId));
        }

        return new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SubId = subId,
            IsUserSub = isUserSub,
            CreatedAt = DateTime.UtcNow
        };
    }

    public bool IsSubscriptionToUser() => IsUserSub;
    public bool IsSubscriptionToAlbum() => !IsUserSub;
}
