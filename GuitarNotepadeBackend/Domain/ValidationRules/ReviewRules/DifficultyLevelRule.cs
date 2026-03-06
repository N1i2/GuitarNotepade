using Domain.Common;

namespace Domain.ValidationRules.ReviewRules;

public static class DifficultyLevelRule
{
    public static void IsValid(int level)
    {
        if (level > Constants.Review.MaxRating)
        {
            throw new ArgumentException($"Difficulty level must be between {Constants.Review.MinRating} and {Constants.Review.MaxRating}", nameof(level));
        }
    }
}
