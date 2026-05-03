using Domain.Common;
using Domain.Exceptions.SongReviewExceptions;

namespace Domain.ValidationRules.ReviewRules;

public static class BeautifulLevelRule
{
    public static void IsValid(int level)
    {
        if (level < Constants.Review.MinRating || level > Constants.Review.MaxRating)
        {
            throw new RatingException(
                $"Beautiful level must be between {Constants.Review.MinRating} and {Constants.Review.MaxRating}.");
        }
    }
}
