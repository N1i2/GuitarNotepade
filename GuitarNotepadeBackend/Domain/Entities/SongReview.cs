using Domain.Entities.Base;
using Domain.ValidationRules.SongReviewRules;

namespace Domain.Entities;

public class SongReview : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid UserId { get; private set; }
    public int Rating { get; private set; }
    public int DifficultyRating { get; private set; }
    public string ReviewText { get; private set; }
    public DateTime CreatedAt { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;

    private SongReview()
    {
        ReviewText = string.Empty;
    }

    public static SongReview Create(Guid songId, Guid userId, int rating, int difficultyRating, string reviewText)
    {
        RatingRule.IsValid(rating);
        DifficultyLevelRule.IsValid(difficultyRating);
        ReviewTextRule.IsValid(reviewText);

        var newSongReview = new SongReview();

        newSongReview.SongId = songId;
        newSongReview.UserId = userId;
        newSongReview.Rating = rating;
        newSongReview.DifficultyRating = difficultyRating;
        newSongReview.ReviewText = reviewText;
        newSongReview.CreatedAt = DateTime.UtcNow;

        return newSongReview;
    }
}
