using Domain.Entities.Base;
using Domain.ValidationRules.ReviewRules;
using System.Text.Json.Serialization;

namespace Domain.Entities;

public class SongReview : BaseEntityWithId
{
    public Guid SongId { get; private set; }
    public Guid UserId { get; private set; }
    public string ReviewText { get; private set; }

    public int? BeautifulLevel { get; private set; }
    public int? DifficultyLevel { get; private set; }

    public int LikesCount { get; private set; }
    public int DislikesCount { get; private set; }

    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    [JsonIgnore]
    public virtual Song Song { get; private set; } = null!;
    [JsonIgnore]
    public virtual User User { get; private set; } = null!;
    [JsonIgnore]
    public virtual ICollection<ReviewLike> Likes { get; private set; }

    private SongReview()
    {
        ReviewText = string.Empty;
        LikesCount = 0;
        DislikesCount = 0;
        Likes = new List<ReviewLike>();
    }

    public static SongReview Create(
           Guid songId,
           Guid userId,
           string reviewText,
           int? beautifulLevel = null,
           int? difficultyLevel = null)
    {
        if (string.IsNullOrWhiteSpace(reviewText) || reviewText.Length < 10)
        {
            throw new ArgumentException("Review text must be at least 10 characters", nameof(reviewText));
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
            SongId = songId,
            UserId = userId,
            ReviewText = reviewText.Trim(),
            BeautifulLevel = beautifulLevel,
            DifficultyLevel = difficultyLevel,
            CreatedAt = DateTime.UtcNow
        };
    }

    public void Update(
        string? newReviewText,
        int? newBeautifulLevel = null,
        int? newDifficultyLevel = null)
    {
        if (newReviewText != null)
        {
            ReviewTextRule.IsValid(newReviewText);
            ReviewText = newReviewText;
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

    public void RemoveLike() => LikesCount = Math.Max(0, LikesCount - 1);
    public void AddDislike() => DislikesCount++;
    public void RemoveDislike() => DislikesCount = Math.Max(0, DislikesCount - 1);

    public static bool CanUserReviewSong(User user, Song song)
    {
        if (user == null || song == null)
            return false;

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
}