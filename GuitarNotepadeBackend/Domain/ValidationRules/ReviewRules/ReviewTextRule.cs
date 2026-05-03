using Domain.Common;
using Domain.Exceptions.SongReviewExceptions;

namespace Domain.ValidationRules.ReviewRules;

public static class ReviewTextRule
{
    public static void IsValid(string reviewText)
    {
        if (string.IsNullOrWhiteSpace(reviewText))
        {
            throw new ReviewTextException("Review text cannot be empty.");
        }

        if (reviewText.Length < Constants.Review.MinLength)
        {
            throw new ReviewTextException($"Review text must be at least {Constants.Review.MinLength} characters.");
        }

        if (reviewText.Length > Constants.Review.MaxLength)
        {
            throw new ReviewTextException($"Review text cannot exceed {Constants.Review.MaxLength} characters.");
        }
    }
}
