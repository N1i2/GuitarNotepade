namespace Domain.ValidationRules.ReviewRules;

public static class ReviewTextRule
{
    private const int MinLength = 0;
    private const int MaxLength = 500;

    public static void IsValid(string reviewText)
    {
        if (string.IsNullOrWhiteSpace(reviewText))
        {
            throw new ArgumentException("Review text cannot be empty", nameof(reviewText));
        }

        if (reviewText.Length < MinLength)
        {
            throw new ArgumentException($"Review text must be at least {MinLength} characters", nameof(reviewText));
        }

        if (reviewText.Length > MaxLength)
        {
            throw new ArgumentException($"Review text cannot exceed {MaxLength} characters", nameof(reviewText));
        }
    }
}
