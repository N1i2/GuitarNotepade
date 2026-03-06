using Domain.Common;

namespace Domain.ValidationRules.ReviewRules;

public static class ReviewTextRule
{
    public static void IsValid(string reviewText)
    {
        if (string.IsNullOrWhiteSpace(reviewText))
        {
            throw new ArgumentException("Review text cannot be empty", nameof(reviewText));
        }

        if (reviewText.Length < Constants.Review.MinLength)
        {
            throw new ArgumentException($"Review text must be at least {Constants.Review.MinLength} characters", nameof(reviewText));
        }

        if (reviewText.Length > Constants.Review.MaxLength)
        {
            throw new ArgumentException($"Review text cannot exceed {Constants.Review.MaxLength} characters", nameof(reviewText));
        }
    }
}
