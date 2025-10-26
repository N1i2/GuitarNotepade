using Domain.Exceptions.SongReviewExceptions;

namespace Domain.ValidationRules.SongReviewRules;

public static class RatingRule
{
    private static readonly List<int> allRating;

    static RatingRule()
    {
        allRating = new List<int>
        {
            1, 2, 3, 4, 5
        };
    }
    
    public static void IsValid(int rating)
    {
        if (!allRating.Contains(rating))
        {
            throw new RatingException("Unknow this rating");
        }
    }
}
