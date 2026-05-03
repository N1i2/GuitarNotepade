using Domain.Entities.Base;
using Domain.Common;

namespace Domain.Entities;

public class Subscription : BaseEntityWithId
{
    public Guid UserId { get; private set; }
    public Guid? TargetAlbumId { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public virtual User Subscriber { get; private set; } = null!;
    public virtual Album TargetAlbum { get; private set; } = null!;

    private Subscription() { }

    public static Subscription Create(Guid userId, Guid targetAlbumId)
    {
        Guard.AgainstEmptyGuid(userId, nameof(userId));
        Guard.AgainstEmptyGuid(targetAlbumId, nameof(targetAlbumId));

        return new Subscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            TargetAlbumId = targetAlbumId,
            CreatedAt = DateTime.UtcNow
        };
    }
}
