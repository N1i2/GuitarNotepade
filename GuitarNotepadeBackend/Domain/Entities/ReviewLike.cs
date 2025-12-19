using Domain.Entities.Base;

namespace Domain.Entities;

public class ReviewLike : BaseEntityWithId
{
    public Guid ReviewId { get; private set; }
    public Guid UserId { get; private set; }
    public bool IsLike { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public virtual SongReview Review { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;

    protected ReviewLike() { }

    public static ReviewLike Create(Guid reviewId, Guid userId, bool isLike)
    {
        if (reviewId == Guid.Empty)
        {
            throw new ArgumentException("ReviewId is required", nameof(reviewId));
        }

        if (userId == Guid.Empty)
        {
            throw new ArgumentException("UserId is required", nameof(userId));
        }

        return new ReviewLike
        {
            Id = Guid.NewGuid(),
            ReviewId = reviewId,
            UserId = userId,
            IsLike = isLike,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Toggle()
    {
        IsLike = !IsLike;
        UpdatedAt = DateTime.UtcNow;
    }
}