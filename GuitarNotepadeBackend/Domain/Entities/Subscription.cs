using Domain.Entities.Base;

namespace Domain.Entities;

public class Subscription : BaseEntityWithId
{
    public Guid UserId { get; private set; }
    public Guid TargetId { get; private set; } 
    public bool IsUserSub { get; private set; } 
    public DateTime CreatedAt { get; private set; }

    public virtual User Subscriber { get; private set; } = null!; 
    public virtual User? TargetUser { get; private set; } 
    public virtual Album? TargetAlbum { get; private set; } 

    private Subscription() { }

    public static Subscription Create(Guid userId, Guid targetId, bool isUserSub)
    {
        if (userId == Guid.Empty)
        {
            throw new ArgumentException("UserId is required", nameof(userId));
        }

        if (targetId == Guid.Empty)
        {
            throw new ArgumentException("SubId is required", nameof(targetId));
        }

        return new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TargetId = targetId,
            IsUserSub = isUserSub,
            CreatedAt = DateTime.UtcNow
        };
    }

    public bool IsSubscriptionToUser() => IsUserSub;
    public bool IsSubscriptionToAlbum() => !IsUserSub;
}
