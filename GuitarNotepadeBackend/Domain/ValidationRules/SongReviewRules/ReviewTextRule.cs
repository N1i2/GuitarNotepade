using Domain.Exceptions.SongExceptions;
using Domain.Exceptions.SongReviewExceptions;

namespace Domain.ValidationRules.SongReviewRules;

public static class ReviewTextRule
{
    private const int minLength = 2;
    private const int maxLength = 255;
    
    public static void IsValid(string text)
    {
        if (string.IsNullOrWhiteSpace(text) || text.Length < minLength)
        {
            throw new ReviewTextException($"Review text is too shart, min length = {minLength}.");
        }
        if (text.Length > maxLength)
        {
            throw new ReviewTextException($"Review text is too shart, max length = {maxLength}.");
        }
    }
}
