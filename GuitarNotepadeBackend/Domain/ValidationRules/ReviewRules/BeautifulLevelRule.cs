using Domain.Common;

namespace Domain.ValidationRules.ReviewRules;

public static class BeautifulLevelRule
{
    public static void IsValid(int level)
    {
        if (level > Constants.Review.MaxRating)
        {
            throw new ArgumentException($"Beautiful level must be between {Constants.Review.MinRating} and {Constants.Review.MaxRating}", nameof(level));
        }
    }
}