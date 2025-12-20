using Domain.Entities.Base;
using Domain.ValidationRules.ReviewRules;

namespace Domain.Entities;

public class SongReview : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid UserId { get; private set; }
    public string ReviewText { get; private set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    public int? BeautifulLevel { get; private set; }
    public int? DifficultyLevel { get; private set; }

    public int LikesCount { get; private set; }
    public int DislikesCount { get; private set; }

    public virtual Song Song { get; private set; } = null!;
    public virtual User User { get; private set; } = null!;
    public virtual ICollection<ReviewLike> Likes { get; private set; }

    protected SongReview()
    {
        ReviewText = string.Empty;
        Likes = new List<ReviewLike>();
    }

    public static SongReview Create(
        Guid songId,
        Guid userId,
        string reviewText,
        int? beautifulLevel = null,
        int? difficultyLevel = null)
    {
        if (songId == Guid.Empty)
        {
            throw new ArgumentException("SongId is required", nameof(songId));
        }

        if (userId == Guid.Empty)
        {
            throw new ArgumentException("UserId is required", nameof(userId));
        }

        ReviewTextRule.IsValid(reviewText);

        if (beautifulLevel.HasValue)
        {
            BeautifulLevelRule.IsValid(beautifulLevel.Value);
        }

        if (difficultyLevel.HasValue)
        {
            DifficultyLevelRule.IsValid(difficultyLevel.Value);
        }

        return new SongReview
        {
            Id = Guid.NewGuid(),
            SongId = songId,
            UserId = userId,
            ReviewText = reviewText.Trim(),
            BeautifulLevel = beautifulLevel,
            DifficultyLevel = difficultyLevel,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(
        string? newReviewText = null,
        int? newBeautifulLevel = null,
        int? newDifficultyLevel = null)
    {
        if (newReviewText != null)
        {
            ReviewTextRule.IsValid(newReviewText);
            ReviewText = newReviewText.Trim();
        }

        if (newBeautifulLevel.HasValue)
        {
            BeautifulLevelRule.IsValid(newBeautifulLevel.Value);
            BeautifulLevel = newBeautifulLevel;
        }

        if (newDifficultyLevel.HasValue)
        {
            DifficultyLevelRule.IsValid(newDifficultyLevel.Value);
            DifficultyLevel = newDifficultyLevel;
        }

        UpdatedAt = DateTime.UtcNow;
    }

    public void AddLike(ReviewLike like)
    {
        if (like.IsLike)
        {
            LikesCount++;
        }
        else
        {
            DislikesCount++;
        }
        Likes.Add(like);
    }

    public void RemoveLike(ReviewLike like)
    {
        if (like.IsLike)
        {
            LikesCount = Math.Max(0, LikesCount - 1);
        }
        else
        {
            DislikesCount = Math.Max(0, DislikesCount - 1);
        }
        Likes.Remove(like);
    }

    public static bool CanUserReviewSong(User user, Song song)
    {
        if (user == null || song == null)
        {
            return false;
        }

        if (user.Id == song.OwnerId)
        {
            return false;
        }

        if (!song.IsPublic)
        {
            return false;
        }

        return !user.IsBlocked;
    }
}