using Domain.Entities.Base;

namespace Domain.Entities;

public class ReviewLike : BaseEntityWithId
{
    public Guid ReviewId { get; private set; }
    public Guid UserId { get; private set; }
    public bool IsLike { get; private set; } 
    public DateTime CreatedAt { get; private set; }

    public virtual SongReview Review { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;

    private ReviewLike() { }

    public static ReviewLike Create(Guid reviewId, Guid userId, bool isLike)
    {
        return new ReviewLike
        {
            ReviewId = reviewId,
            UserId = userId,
            IsLike = isLike,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Toggle()
    {
        IsLike = !IsLike;
    }
}